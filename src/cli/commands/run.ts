import chalk from 'chalk';
import type { Command } from 'commander';
import ora from 'ora';
import { getTestPath } from '../../services/filesystem.js';
import { incrementAttempts, markStageComplete } from '../../services/progress.js';
import { runTests } from '../../services/testRunner.js';
import { CLIError, handleCommand } from '../errors.js';
import {
	handleContextError,
	loadLearningContext,
	showCompletedMessage,
} from '../middleware/index.js';

export function registerRunCommand(program: Command): void {
	program
		.command('run [topic]')
		.description('Run tests for the current stage (optionally specify topic or stage)')
		.option(
			'-s, --stage <stageId>',
			'Run tests for a specific stage (e.g., stage-1, linked-list-queue-impl)'
		)
		.action(
			handleCommand(async (topicArg: string | undefined, options: { stage?: string }) => {
				const result = await loadLearningContext(topicArg);
				if (handleContextError(result)) return;

				const { progress, roadmap, currentStage, stageNumber } = result.context;

				let targetStage: (typeof roadmap.stages)[number] | null | undefined;
				let targetStageNum: number;
				let isRerun = false;

				if (options?.stage) {
					// Find stage by id or by number (stage-1, stage-2, etc.)
					const stageArg = options.stage;
					const stageNumMatch = stageArg.match(/^stage-?(\d+)$/i);

					if (stageNumMatch) {
						// stage-1, stage-2, etc.
						targetStageNum = Number.parseInt(stageNumMatch[1], 10);
						targetStage = roadmap.stages[targetStageNum - 1];
					} else {
						// Match by stage id
						const foundIndex = roadmap.stages.findIndex((s) => s.id === stageArg);
						if (foundIndex !== -1) {
							targetStageNum = foundIndex + 1;
							targetStage = roadmap.stages[foundIndex];
						} else {
							// Try partial match
							const partialIndex = roadmap.stages.findIndex((s) => s.id.includes(stageArg));
							if (partialIndex !== -1) {
								targetStageNum = partialIndex + 1;
								targetStage = roadmap.stages[partialIndex];
							} else {
								const stagesList = roadmap.stages
									.map((s, i) => `  stage-${i + 1}: ${s.id}`)
									.join('\n');
								throw new CLIError(`Stage not found: ${stageArg}\n\nAvailable stages:\n${stagesList}`);
							}
						}
					}
					isRerun = targetStageNum < stageNumber;
				} else {
					targetStageNum = stageNumber;
					targetStage = currentStage;
				}

			if (!targetStage) {
				showCompletedMessage();
				return;
			}

			const testPath = getTestPath(progress.topic, targetStage.id);
			const stageLabel = isRerun ? `${targetStage.id} (rerun)` : targetStage.id;
			const spinner = ora(`Running tests for ${stageLabel}...`).start();

			try {
				// Only track attempts for the current stage (not reruns)
				if (!isRerun) {
					await incrementAttempts(progress.topic, targetStageNum);
				}
				const result = await runTests(testPath);

				const passedTests = result.tests.filter((t) => t.passed);
				const failedTests = result.tests.filter((t) => !t.passed);

				if (result.passed) {
					spinner.succeed(chalk.green('All tests passed! 🎉'));
					// Only mark complete for current stage (not reruns)
					if (!isRerun) {
						await markStageComplete(progress.topic, targetStageNum);
					}
					for (const test of passedTests) {
						console.log(chalk.green(`  ✓ ${test.name}`));
					}
					if (isRerun) {
						console.log(chalk.dim('\n(This was a rerun of a completed stage)'));
					} else {
						console.log(chalk.bold('\n✨ Great job! Run "learn continue" for the next lesson.'));
					}
				} else {
					spinner.fail(chalk.red('Some tests failed'));

					// Show passed tests first
					for (const test of passedTests) {
						console.log(chalk.green(`  ✓ ${test.name}`));
					}

					// Show failed tests with details
					failedTests.forEach((test, index) => {
						console.log(chalk.red(`  ✗ ${test.name}`));
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
					});

					console.log(chalk.yellow('\n💡 Tip: Run "learn hint" for help'));
				}
			} catch (error) {
				spinner.stop();
				throw new CLIError(
					`Failed to run tests: ${error instanceof Error ? error.message : String(error)}`,
					{ exitCode: 1 }
				);
			}
			})
		);
}
