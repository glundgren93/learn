import { readFile } from 'node:fs/promises';
import chalk from 'chalk';
import type { Command } from 'commander';
import {
	handleContextError,
	loadLearningContext,
	showCompletedMessage,
} from '../middleware/index.js';

export function registerHintCommand(program: Command): void {
	program
		.command('hint [topic]')
		.description('Get hints for the current stage (optionally specify topic)')
		.action(async (topicArg?: string) => {
			const result = await loadLearningContext(topicArg);
			if (handleContextError(result)) return;

			const { progress, currentStage } = result.context;

			if (!currentStage) {
				showCompletedMessage();
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
				console.log(
					chalk.red(
						`Failed to load hints: ${error instanceof Error ? error.message : String(error)}`
					)
				);
				console.log(chalk.yellow('Make sure you\'ve run "learn continue" first.'));
			}
		});
}
