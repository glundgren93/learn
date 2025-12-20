import chalk from 'chalk';
import type { Command } from 'commander';
import ora from 'ora';
import { generateLesson } from '../../agent/lesson.js';
import {
	getSolutionPath,
	getTestPath,
	loadRoadmap,
	saveLesson,
} from '../../services/filesystem.js';
import { findCurrentTopic } from '../utils/index.js';

export function registerContinueCommand(program: Command): void {
	program
		.command('continue [topic]')
		.description('Continue to the next lesson (optionally specify topic)')
		.action(async (topicArg?: string) => {
			const progress = await findCurrentTopic(topicArg);
			if (!progress) {
				console.log(
					chalk.red('No active learning path found. Use "learn start <topic>" to begin.')
				);
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
				console.log(chalk.green("🎉 Congratulations! You've completed all stages!"));
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
				console.log(
					chalk.bold('📚 Theory:'),
					`learning/${progress.topic}/stages/${currentStage.id}/README.md`
				);

				console.log(
					chalk.yellow('\n💡 Tip: Edit solution.ts and run "learn run" to test your code!')
				);
			} catch (error) {
				spinner.fail(
					`Failed to generate lesson: ${error instanceof Error ? error.message : String(error)}`
				);
				process.exit(1);
			}
		});
}
