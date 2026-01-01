import chalk from 'chalk';
import type { Command } from 'commander';
import { loadRoadmap } from '../../services/filesystem.js';
import {
	calculateProgressStats,
	getActiveTopic,
	getAllTopicsProgress,
} from '../../services/progress.js';
import { handleCommand } from '../errors.js';
import { createProgressBar } from '../utils/index.js';

export async function showStatus(): Promise<void> {
	const allProgress = await getAllTopicsProgress();
	const activeTopic = await getActiveTopic();

	if (allProgress.length === 0) {
		console.log(chalk.yellow('No learning paths found. Use "learn start <topic>" to begin.'));
		return;
	}

	console.log(chalk.bold('\n📊 Learning Progress\n'));

	for (const progress of allProgress) {
		const roadmap = await loadRoadmap(progress.topic);
		const { completed, total, percentage } = calculateProgressStats(progress);
		const isActive = progress.topic === activeTopic;

		const progressBar = createProgressBar(percentage, 20, isActive);

		// Highlight active topic with cyan background/bold
		if (isActive) {
			console.log(chalk.bold.cyan(`▶ ${progress.topic}`) + chalk.cyan(' (active)'));
		} else {
			console.log(chalk.bold(`  ${progress.topic}`));
		}

		console.log(`    ${progressBar} ${completed}/${total} stages (${percentage}%)`);

		if (roadmap && progress.currentStage <= roadmap.stages.length) {
			const currentStage = roadmap.stages[progress.currentStage - 1];
			const stageInfo = currentStage
				? `Stage ${progress.currentStage} - ${currentStage.title}`
				: 'Complete';
			console.log(chalk.gray(`    Next: ${stageInfo}`));
		} else {
			console.log(chalk.green(`    ✓ Completed!`));
		}
	}
}

export function registerStatusCommand(program: Command): void {
	program
		.command('status')
		.description('Show progress across all topics')
		.action(handleCommand(showStatus));
}
