import chalk from 'chalk';
import type { Command } from 'commander';
import ora from 'ora';
import { getTestPath, loadRoadmap } from '../../services/filesystem.js';
import { incrementAttempts, markStageComplete } from '../../services/progress.js';
import { runTests } from '../../services/testRunner.js';
import { findCurrentTopic } from '../utils/index.js';

export function registerRunCommand(program: Command): void {
	program
		.command('run [topic]')
		.description('Run tests for the current stage (optionally specify topic)')
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
				console.log(chalk.green('🎉 All stages completed!'));
				return;
			}

			const testPath = getTestPath(progress.topic, currentStage.id);
			const spinner = ora(`Running tests for ${progress.topic}...`).start();

			try {
				await incrementAttempts(progress.topic, currentStageNum);
				const result = await runTests(testPath);

				if (result.passed) {
					spinner.succeed(chalk.green('All tests passed! 🎉'));
					await markStageComplete(progress.topic, currentStageNum);
					console.log(chalk.bold('\n✨ Great job! Run "learn continue" for the next lesson.'));
				} else {
					spinner.fail(chalk.red('Some tests failed'));
					console.log();

					result.failedTests.forEach((test, index) => {
						console.log(chalk.red.bold(`  ✗ ${test.name}`));
						if (test.error) {
							console.log(chalk.dim(`    ${test.error}`));
						}
						if (test.expected || test.received) {
							if (test.expected) {
								console.log(chalk.green(`      Expected: ${test.expected}`));
							}
							if (test.received) {
								console.log(chalk.red(`      Received: ${test.received}`));
							}
						}
						if (index < result.failedTests.length - 1) {
							console.log();
						}
					});

					console.log(chalk.yellow('\n💡 Tip: Run "learn hint" for help'));
				}
			} catch (error) {
				spinner.fail(
					`Failed to run tests: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		});
}
