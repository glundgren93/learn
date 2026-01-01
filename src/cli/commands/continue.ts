import chalk from 'chalk';
import type { Command } from 'commander';
import ora from 'ora';
import { generateLesson } from '../../agent/lesson.js';
import { getSolutionPath, getTestPath, saveLesson } from '../../services/filesystem.js';
import { CLIError, handleCommand } from '../errors.js';
import { handleContextError, loadLearningContext } from '../middleware/index.js';

export function registerContinueCommand(program: Command): void {
	program
		.command('continue [topic]')
		.description('Continue to the next lesson (optionally specify topic)')
		.action(
			handleCommand(async (topicArg?: string) => {
				const result = await loadLearningContext(topicArg);
				if (handleContextError(result)) return;

				const { progress, currentStage, stageNumber } = result.context;

				if (!currentStage) {
					console.log(chalk.green("🎉 Congratulations! You've completed all stages!"));
					return;
				}

				const spinner = ora(`Generating lesson: ${currentStage.title}...`).start();

				try {
					const { lesson } = await generateLesson(progress.topic, currentStage.id, stageNumber);
					await saveLesson(progress.topic, currentStage.id, lesson);

					spinner.succeed('Lesson generated!');

					console.log(chalk.bold(`\n📖 Stage ${stageNumber}: ${currentStage.title}`));
					console.log(chalk.gray(`Objective: ${currentStage.objective}\n`));

					const solutionPath = getSolutionPath(progress.topic, currentStage.id);
					console.log(chalk.bold('📝 Your code:'), solutionPath);
					console.log(chalk.bold('🧪 Tests:'), getTestPath(progress.topic, currentStage.id));
					console.log(
						chalk.bold('📚 Theory:'),
						`learning/${progress.topic}/stages/${currentStage.id}/THEORY.md`
					);

					console.log(
						chalk.yellow('\n💡 Tip: Edit solution.ts and run "learn run" to test your code!')
					);
				} catch (error) {
					spinner.stop();
					throw new CLIError(
						`Failed to generate lesson: ${error instanceof Error ? error.message : String(error)}`,
						{ exitCode: 1 }
					);
				}
			})
		);
}
