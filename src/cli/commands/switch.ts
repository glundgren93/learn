import chalk from 'chalk';
import type { Command } from 'commander';
import inquirer from 'inquirer';
import {
	getActiveTopic,
	getAllTopicsProgress,
	loadProgress,
	setActiveTopic,
} from '../../services/progress.js';
import { CLIError, handleCommand } from '../errors.js';

export function registerSwitchCommand(program: Command): void {
	program
		.command('switch [topic...]')
		.description('Switch to a different learning topic')
		.action(
			handleCommand(async (topicParts?: string[]) => {
				const topic = topicParts?.length ? topicParts.join(' ') : undefined;
				const allProgress = await getAllTopicsProgress();

				if (allProgress.length === 0) {
					throw new CLIError('No learning paths found.', {
						tip: 'Use "learn start <topic>" to begin.',
					});
				}

				let selectedTopic = topic;

				if (!selectedTopic) {
					// Show interactive topic selection
					const activeTopic = await getActiveTopic();

					const choices = allProgress.map((p) => {
						const completed = Object.values(p.stages).filter((s) => s.status === 'completed').length;
						const total = Object.keys(p.stages).length;
						const isActive = p.topic === activeTopic;
						const label = `${p.topic} (${completed}/${total} stages)${isActive ? ' ← current' : ''}`;
						return { name: label, value: p.topic };
					});

					const answer = await inquirer.prompt([
						{
							type: 'list',
							name: 'topic',
							message: 'Select a topic to switch to:',
							choices,
						},
					]);
					selectedTopic = answer.topic;
				}

				// Verify topic exists
				const progress = await loadProgress(selectedTopic!);
				if (!progress) {
					throw new CLIError(`Topic "${selectedTopic}" not found.`, {
						tip: 'Use "learn topics" to see available topics.',
					});
				}

				await setActiveTopic(selectedTopic!);
				console.log(chalk.green(`✓ Switched to "${selectedTopic}" (Stage ${progress.currentStage})`));
			})
		);
}
