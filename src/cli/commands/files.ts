import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import chalk from 'chalk';
import type { Command } from 'commander';
import { getStageDir, loadRoadmap } from '../../services/filesystem.js';
import { getActiveTopic, loadProgress } from '../../services/progress.js';

async function listFilesRecursive(dir: string, prefix = ''): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = resolve(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await listFilesRecursive(fullPath, `${prefix}${entry.name}/`)));
		} else {
			files.push(fullPath);
		}
	}

	return files;
}

export function registerFilesCommand(program: Command): void {
	program
		.command('files')
		.description('List files for the current stage (clickable in terminal)')
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

			const currentStage = roadmap.stages[progress.currentStage - 1];

			if (!currentStage) {
				console.log(chalk.green('🎉 All stages completed! No current stage files.'));
				return;
			}

			const stageDir = getStageDir(activeTopic, currentStage.id);
			const absoluteStageDir = resolve(stageDir);

			console.log(chalk.bold.cyan(`\n📁 Stage ${progress.currentStage}: ${currentStage.title}\n`));

			try {
				const files = await listFilesRecursive(absoluteStageDir);

				if (files.length === 0) {
					console.log(
						chalk.yellow('  No files found. Run "learn continue" to generate lesson files.')
					);
					return;
				}

				// Group files by type for better organization
				const readme = files.find((f) => f.endsWith('README.md'));
				const solution = files.find((f) => f.endsWith('solution.ts'));
				const tests = files.filter((f) => f.includes('/tests/'));
				const others = files.filter(
					(f) => !f.endsWith('README.md') && !f.endsWith('solution.ts') && !f.includes('/tests/')
				);

				console.log(chalk.bold('  📚 Theory:'));
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
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
					console.log(chalk.yellow('  Stage files not generated yet. Run "learn continue" first.'));
				} else {
					throw error;
				}
			}
		});
}
