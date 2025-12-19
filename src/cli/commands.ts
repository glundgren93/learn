import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { generateRoadmap } from '../agent/roadmap.js';
import { generateLesson } from '../agent/lesson.js';
import {
  saveRoadmap,
  loadRoadmap,
  saveLesson,
  getSolutionPath,
  getTestPath,
} from '../services/filesystem.js';
import {
  initializeProgress,
  loadProgress,
  markStageComplete,
  incrementAttempts,
  getCurrentStage,
} from '../services/progress.js';
import { runTests } from '../services/testRunner.js';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

const LEARNING_DIR = process.env.LEARNING_DIR || './learning';

export function setupCommands(program: Command) {
  // Start command
  program
    .command('start <topic>')
    .description('Start a new learning path for a topic')
    .action(async (topic: string) => {
      const spinner = ora('Generating learning roadmap...').start();

      try {
        // Check if roadmap already exists
        const existingRoadmap = await loadRoadmap(topic);
        if (existingRoadmap) {
          spinner.fail(`Topic "${topic}" already exists. Use "learn continue" to proceed.`);
          return;
        }

        // Generate roadmap
        const roadmap = await generateRoadmap(topic);
        await saveRoadmap(topic, roadmap);
        await initializeProgress(topic, roadmap.stages.length);

        spinner.succeed('Roadmap generated successfully!');

        console.log(chalk.bold(`\n📚 Learning Path: ${roadmap.topic}`));
        console.log(chalk.gray(roadmap.description));
        console.log(chalk.bold('\nStages:'));
        roadmap.stages.forEach((stage, index) => {
          const icon = stage.isRealWorldProject ? '🎯' : '📝';
          console.log(
            `  ${index + 1}. ${icon} ${stage.title} (${stage.difficulty}) - ${stage.objective}`
          );
        });

        console.log(chalk.bold('\n✨ Run "learn continue" to start the first lesson!'));
      } catch (error) {
        spinner.fail(`Failed to generate roadmap: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  // Continue command
  program
    .command('continue')
    .description('Continue to the next lesson in your current learning path')
    .action(async () => {
      // Find current topic (simplified - could be improved with topic selection)
      const progress = await findCurrentTopic();
      if (!progress) {
        console.log(chalk.red('No active learning path found. Use "learn start <topic>" to begin.'));
        return;
      }

      const roadmap = await loadRoadmap(progress.topic);
      if (!roadmap) {
        console.log(chalk.red(`Roadmap not found for topic: ${progress.topic}`));
        return;
      }

      const currentStageNum = progress.currentStage;
      const currentStage = roadmap.stages[currentStageNum - 1];

      if (!currentStage) {
        console.log(chalk.green('🎉 Congratulations! You\'ve completed all stages!'));
        return;
      }

      const spinner = ora(`Generating lesson: ${currentStage.title}...`).start();

      try {
        const lesson = await generateLesson(progress.topic, currentStage.id, currentStageNum);
        await saveLesson(progress.topic, currentStage.id, lesson);

        spinner.succeed('Lesson generated!');

        console.log(chalk.bold(`\n📖 Stage ${currentStageNum}: ${currentStage.title}`));
        console.log(chalk.gray(`Objective: ${currentStage.objective}\n`));

        const solutionPath = getSolutionPath(progress.topic, currentStage.id);
        console.log(chalk.bold('📝 Your code:'), solutionPath);
        console.log(chalk.bold('🧪 Tests:'), getTestPath(progress.topic, currentStage.id));
        console.log(chalk.bold('📚 Theory:'), `learning/${progress.topic}/stages/${currentStage.id}/README.md`);

        console.log(chalk.yellow('\n💡 Tip: Edit solution.ts and run "learn run" to test your code!'));
      } catch (error) {
        spinner.fail(`Failed to generate lesson: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  // Status command
  program
    .command('status')
    .description('Show progress across all topics')
    .action(async () => {
      // Simplified - would need to scan learning directory
      console.log(chalk.bold('📊 Learning Progress\n'));
      console.log(chalk.gray('Feature coming soon - will show progress for all topics'));
    });

  // Run command
  program
    .command('run')
    .description('Run tests for the current stage')
    .action(async () => {
      const progress = await findCurrentTopic();
      if (!progress) {
        console.log(chalk.red('No active learning path found. Use "learn start <topic>" to begin.'));
        return;
      }

      const roadmap = await loadRoadmap(progress.topic);
      if (!roadmap) {
        console.log(chalk.red(`Roadmap not found for topic: ${progress.topic}`));
        return;
      }

      const currentStageNum = progress.currentStage;
      const currentStage = roadmap.stages[currentStageNum - 1];

      if (!currentStage) {
        console.log(chalk.green('🎉 All stages completed!'));
        return;
      }

      const testPath = getTestPath(progress.topic, currentStage.id);
      const spinner = ora('Running tests...').start();

      try {
        await incrementAttempts(progress.topic, currentStageNum);
        const result = await runTests(testPath);

        if (result.passed) {
          spinner.succeed(chalk.green('All tests passed! 🎉'));
          await markStageComplete(progress.topic, currentStageNum);
          console.log(chalk.bold('\n✨ Great job! Run "learn continue" for the next lesson.'));
        } else {
          spinner.fail(chalk.red('Some tests failed'));
          console.log(chalk.red('\nFailed tests:'));
          result.failedTests.forEach((test) => {
            console.log(chalk.red(`  × ${test}`));
          });
          if (result.errorMessages.length > 0) {
            console.log(chalk.yellow('\nErrors:'));
            result.errorMessages.forEach((msg) => {
              console.log(chalk.yellow(`  ${msg}`));
            });
          }
          console.log(chalk.yellow('\n💡 Tip: Run "learn hint" for help'));
        }
      } catch (error) {
        spinner.fail(`Failed to run tests: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  // Hint command
  program
    .command('hint')
    .description('Get hints for the current stage')
    .action(async () => {
      const progress = await findCurrentTopic();
      if (!progress) {
        console.log(chalk.red('No active learning path found. Use "learn start <topic>" to begin.'));
        return;
      }

      const roadmap = await loadRoadmap(progress.topic);
      if (!roadmap) {
        console.log(chalk.red(`Roadmap not found for topic: ${progress.topic}`));
        return;
      }

      const currentStageNum = progress.currentStage;
      const currentStage = roadmap.stages[currentStageNum - 1];

      if (!currentStage) {
        console.log(chalk.green('🎉 All stages completed!'));
        return;
      }

      try {
        const hintsPath = `learning/${progress.topic}/stages/${currentStage.id}/hints.json`;
        const hints = JSON.parse(await readFile(hintsPath, 'utf-8')) as string[];

        console.log(chalk.bold(`\n💡 Hints for: ${currentStage.title}\n`));
        hints.forEach((hint, index) => {
          console.log(chalk.yellow(`${index + 1}. ${hint}`));
        });
      } catch (error) {
        console.log(chalk.red(`Failed to load hints: ${error instanceof Error ? error.message : String(error)}`));
        console.log(chalk.yellow('Make sure you\'ve run "learn continue" first.'));
      }
    });
}

async function findCurrentTopic(): Promise<{ topic: string; currentStage: number } | null> {
  try {
    const topics = await readdir(LEARNING_DIR, { withFileTypes: true });
    const topicDirs = topics.filter((dirent) => dirent.isDirectory());

    if (topicDirs.length === 0) {
      return null;
    }

    // Find topics with progress.json
    for (const topicDir of topicDirs) {
      const progressPath = join(LEARNING_DIR, topicDir.name, 'progress.json');
      try {
        const progress = JSON.parse(await readFile(progressPath, 'utf-8'));
        // Return the first active topic found
        if (progress.currentStage) {
          return {
            topic: progress.topic,
            currentStage: progress.currentStage,
          };
        }
      } catch {
        // Skip if progress.json doesn't exist or is invalid
        continue;
      }
    }

    return null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

