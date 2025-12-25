import type { Command } from 'commander';
import {
	registerAskCommand,
	registerCompletionCommand,
	registerContinueCommand,
	registerCurrentCommand,
	registerHintCommand,
	registerInitCommand,
	registerRunCommand,
	registerStartCommand,
	registerStatusCommand,
	registerSwitchCommand,
	registerTopicsCommand,
} from './commands/index.js';

export function setupCommands(program: Command): void {
	registerInitCommand(program);
	registerStartCommand(program);
	registerSwitchCommand(program);
	registerContinueCommand(program);
	registerStatusCommand(program);
	registerCurrentCommand(program);
	registerRunCommand(program);
	registerHintCommand(program);
	registerAskCommand(program);
	registerTopicsCommand(program);
	registerCompletionCommand(program);
}
