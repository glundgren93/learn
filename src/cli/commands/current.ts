import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import chalk from 'chalk';
import type { Command } from 'commander';
import { getStageDir, loadRoadmap } from '../../services/filesystem.js';
import { getActiveTopic, loadProgress } from '../../services/progress.js';
import { createProgressBar } from '../utils/index.js';

async function listFilesRecursive(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = resolve(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await listFilesRecursive(fullPath)));
		} else {
			files.push(fullPath);
		}
	}

	return files;
}

function printStageFiles(files: string[]): void {
	const readme = files.find((f) => f.endsWith('README.md'));
	const solution = files.find((f) => f.endsWith('solution.ts'));
	const tests = files.filter((f) => f.includes('/tests/'));
	const others = files.filter(
		(f) => !f.endsWith('README.md') && !f.endsWith('solution.ts') && !f.includes('/tests/')
	);

	console.log(chalk.bold('\n  📚 Theory:'));
	if (readme) {
		console.log(`     ${readme}`);
	}

	console.log(chalk.bold('\n  📝 Solution:'));
	if (solution) {
		console.log(`     ${solution}`);
	}

	if (tests.length > 0) {
		console.log(chalk.bold('\n  🧪 Tests:'));
		for (const test of tests) {
			console.log(`     ${test}`);
		}
	}

	if (others.length > 0) {
		console.log(chalk.bold('\n  📄 Other:'));
		for (const file of others) {
			console.log(`     ${file}`);
		}
	}

	console.log(chalk.gray('\n  💡 Click on file paths above to open them'));
}

export function registerCurrentCommand(program: Command): void {
	program
		.command('current')
		.description('Show the current active topic and stage files')
		.action(async () => {
			const activeTopic = await getActiveTopic();

			if (!activeTopic) {
				console.log(chalk.yellow('No active topic. Use "learn start <topic>" to begin.'));
				return;
			}

			const progress = await loadProgress(activeTopic);
			const roadmap = await loadRoadmap(activeTopic);

			if (!progress || !roadmap) {
				console.log(chalk.red(`Topic "${activeTopic}" not found.`));
				return;
			}

			const completed = Object.values(progress.stages).filter(
				(s) => s.status === 'completed'
			).length;
			const total = Object.keys(progress.stages).length;
			const percentage = Math.round((completed / total) * 100);
			const currentStage = roadmap.stages[progress.currentStage - 1];

			console.log(chalk.bold.cyan(`\n📍 Current Topic: ${activeTopic}\n`));
			console.log(
				`  ${createProgressBar(percentage, 20)} ${completed}/${total} stages (${percentage}%)`
			);

			if (currentStage) {
				console.log(chalk.bold(`\n  Stage ${progress.currentStage}: ${currentStage.title}`));
				console.log(chalk.gray(`  ${currentStage.objective}`));
				console.log(chalk.gray(`  Difficulty: ${currentStage.difficulty}`));

				// Show stage files
				const stageDir = getStageDir(activeTopic, currentStage.id);
				try {
					const files = await listFilesRecursive(resolve(stageDir));
					if (files.length > 0) {
						printStageFiles(files);
					} else {
						console.log(
							chalk.yellow('\n  No files found. Run "learn continue" to generate lesson files.')
						);
					}
				} catch (error) {
					if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
						console.log(
							chalk.yellow('\n  Stage files not generated yet. Run "learn continue" first.')
						);
					} else {
						throw error;
					}
				}
			} else {
				console.log(chalk.green('\n  🎉 All stages completed!'));
			}

			console.log(chalk.gray('\n  Use "learn switch" to change topics'));
		});
}
