import type { Command } from 'commander';
import { showStatus } from './status.js';

export function registerTopicsCommand(program: Command): void {
	program
		.command('topics')
		.description('List all learning topics')
		.action(async () => {
			await showStatus();
		});
}
