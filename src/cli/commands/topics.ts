import type { Command } from 'commander';
import { handleCommand } from '../errors.js';
import { showStatus } from './status.js';

export function registerTopicsCommand(program: Command): void {
	program
		.command('topics')
		.description('List all learning topics')
		.action(handleCommand(showStatus));
}
