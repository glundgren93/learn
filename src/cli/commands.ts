import type { Command } from 'commander';
import {
	registerCompletionCommand,
	registerContinueCommand,
	registerCurrentCommand,
	registerFilesCommand,
	registerHintCommand,
	registerRunCommand,
	registerStartCommand,
	registerStatusCommand,
	registerSwitchCommand,
	registerTopicsCommand,
} from './commands/index.js';

export function setupCommands(program: Command): void {
	registerStartCommand(program);
	registerSwitchCommand(program);
	registerContinueCommand(program);
	registerStatusCommand(program);
	registerCurrentCommand(program);
	registerFilesCommand(program);
	registerRunCommand(program);
	registerHintCommand(program);
	registerTopicsCommand(program);
	registerCompletionCommand(program);
}
