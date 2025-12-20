import chalk from 'chalk';
import type { Command } from 'commander';
import ora from 'ora';
import { generateRoadmap } from '../../agent/roadmap.js';
import { loadRoadmap, saveRoadmap } from '../../services/filesystem.js';
import { initializeProgress, setActiveTopic } from '../../services/progress.js';

export function registerStartCommand(program: Command): void {
	program
		.command('start <topic>')
		.description('Start a new learning path for a topic')
		.action(async (topic: string) => {
			const spinner = ora('Generating learning roadmap...').start();

			try {
				// Check if roadmap already exists
				const existingRoadmap = await loadRoadmap(topic);
				if (existingRoadmap) {
					spinner.fail(
						`Topic "${topic}" already exists. Use "learn switch ${topic}" to switch to it.`
					);
					return;
				}

				// Generate roadmap
				const roadmap = await generateRoadmap(topic);
				await saveRoadmap(topic, roadmap);
				await initializeProgress(topic, roadmap.stages.length);

				// Set as active topic
				await setActiveTopic(topic);

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
				spinner.fail(
					`Failed to generate roadmap: ${error instanceof Error ? error.message : String(error)}`
				);
				process.exit(1);
			}
		});
}
