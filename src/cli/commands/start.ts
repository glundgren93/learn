import chalk from 'chalk';
import type { Command } from 'commander';
import ora from 'ora';
import type { TokenUsage } from '../../agent/client.js';
import { generateRoadmap, generateTopicOverview } from '../../agent/roadmap.js';
import { loadRoadmap, saveRoadmap, saveTopicOverview } from '../../services/filesystem.js';
import { initializeProgress, setActiveTopic } from '../../services/progress.js';
import { CLIError, handleCommand } from '../errors.js';
import { formatTokenUsage } from '../utils/tokens.js';

export function registerStartCommand(program: Command): void {
	program
		.command('start <topic...>')
		.description('Start a new learning path for a topic')
		.action(
			handleCommand(async (topicParts: string[]) => {
				const topic = topicParts.join(' ');
				const spinner = ora('Generating learning roadmap...').start();

				try {
					// Check if roadmap already exists
					const existingRoadmap = await loadRoadmap(topic);
					if (existingRoadmap) {
						spinner.stop();
						throw new CLIError(`Topic "${topic}" already exists.`, {
							tip: `Use "learn switch ${topic}" to switch to it.`,
						});
					}

					// Track token usage
					const tokenUsage: Record<string, TokenUsage> = {};

					// Generate roadmap
					const { roadmap, usage: roadmapUsage } = await generateRoadmap(topic);
					tokenUsage.Roadmap = roadmapUsage;

					await saveRoadmap(topic, roadmap);
					await initializeProgress(topic, roadmap.stages.length);

					// Generate and save topic overview
					spinner.text = 'Generating topic overview...';
					const { overview, usage: overviewUsage } = await generateTopicOverview(roadmap);
					tokenUsage.Overview = overviewUsage;

					await saveTopicOverview(topic, overview);

					// Set as active topic
					await setActiveTopic(topic);

					spinner.succeed('Learning path created successfully!');

					console.log(chalk.bold(`\n📚 Learning Path: ${roadmap.topic}`));
					console.log(chalk.gray(roadmap.description));
					console.log(chalk.bold('\nStages:'));
					roadmap.stages.forEach((stage, index) => {
						const icon = stage.isRealWorldProject ? '🎯' : '📝';
						console.log(
							`  ${index + 1}. ${icon} ${stage.title} (${stage.difficulty}) - ${stage.objective}`
						);
					});

					console.log(formatTokenUsage(tokenUsage));

					console.log(chalk.bold('\n✨ Run "learn continue" to start the first lesson!'));
				} catch (error) {
					spinner.stop();
					// Re-throw CLIError, wrap other errors
					if (error instanceof CLIError) {
						throw error;
					}
					throw new CLIError(
						`Failed to generate roadmap: ${error instanceof Error ? error.message : String(error)}`,
						{ exitCode: 1 }
					);
				}
			})
		);
}
