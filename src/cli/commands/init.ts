import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import type { Command } from 'commander';
import {
	ENV_EXAMPLE_TEMPLATE,
	GITIGNORE_TEMPLATE,
	PACKAGE_JSON_TEMPLATE,
	README_TEMPLATE,
	TSCONFIG_TEMPLATE,
	VITEST_CONFIG_TEMPLATE,
} from '../../templates/index.js';
import { CLIError, handleCommand } from '../errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the CLI project root (for file: dependency in dev mode)
const CLI_PROJECT_ROOT = resolve(__dirname, '../../..');

export function registerInitCommand(program: Command): void {
	program
		.command('init <name>')
		.description('Create a new learning project directory')
		.option('--dev', 'Use local learn-cli (for development)')
		.action(
			handleCommand(async (name: string, options: { dev?: boolean }) => {
				const projectDir = join(process.cwd(), name);

				// Check if directory already exists
				if (existsSync(projectDir)) {
					throw new CLIError(`Directory "${name}" already exists.`, { exitCode: 1 });
				}

				// Create project directory
				await mkdir(projectDir, { recursive: true });

				// Determine learn dependency: use local path in dev mode, npm package otherwise
				const isDevMode = options.dev || process.env.LEARN_DEV === '1';
				const learnDep = isDevMode ? `file:${CLI_PROJECT_ROOT}` : 'latest';

				// Create all scaffold files
				await Promise.all([
					writeFile(
						join(projectDir, 'package.json'),
						JSON.stringify(PACKAGE_JSON_TEMPLATE(name, learnDep), null, 2)
					),
					writeFile(join(projectDir, 'tsconfig.json'), JSON.stringify(TSCONFIG_TEMPLATE, null, 2)),
					writeFile(join(projectDir, 'vitest.config.ts'), VITEST_CONFIG_TEMPLATE),
					writeFile(join(projectDir, '.gitignore'), GITIGNORE_TEMPLATE),
					writeFile(join(projectDir, '.env.example'), ENV_EXAMPLE_TEMPLATE),
					writeFile(join(projectDir, 'README.md'), README_TEMPLATE(name)),
				]);

				console.log(chalk.green(`\n✨ Created ${name}/`));
				console.log(chalk.dim('\nScaffold files:'));
				console.log(chalk.dim('  - package.json'));
				console.log(chalk.dim('  - tsconfig.json'));
				console.log(chalk.dim('  - vitest.config.ts'));
				console.log(chalk.dim('  - .gitignore'));
				console.log(chalk.dim('  - .env.example'));
				console.log(chalk.dim('  - README.md'));

				console.log(chalk.bold('\nNext steps:'));
				console.log(`  cd ${name}`);
				console.log('  npm install');
				console.log('  npx learn start <topic>');

				if (isDevMode) {
					console.log(chalk.yellow('\n⚠️  Dev mode: Using local @glundgren93/learn from:'));
					console.log(chalk.yellow(`   ${CLI_PROJECT_ROOT}`));
				}
			})
		);
}
