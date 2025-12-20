import { readFile } from 'node:fs/promises';
import chalk from 'chalk';
import type { Command } from 'commander';
import { loadRoadmap } from '../../services/filesystem.js';
import { findCurrentTopic } from '../utils/index.js';

export function registerHintCommand(program: Command): void {
	program
		.command('hint [topic]')
		.description('Get hints for the current stage (optionally specify topic)')
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
