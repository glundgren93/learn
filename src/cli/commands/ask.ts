import * as readline from 'node:readline';
import chalk from 'chalk';
import type { Command } from 'commander';
import {
	type Message,
	buildSystemPrompt,
	loadStageContext,
	streamChatResponse,
} from '../../services/chat/index.js';
import { CLIError, handleCommand } from '../errors.js';
import {
	handleContextError,
	loadLearningContext,
	showCompletedMessage,
} from '../middleware/index.js';

export function registerAskCommand(program: Command): void {
	program
		.command('ask [topic]')
		.description('Open an interactive chat to discuss the current stage with AI')
		.action(
			handleCommand(async (topicArg?: string) => {
				const result = await loadLearningContext(topicArg);
				if (handleContextError(result)) return;

				const { progress, currentStage, stageNumber } = result.context;

				if (!currentStage) {
					showCompletedMessage();
					console.log(chalk.dim('Nothing to ask about.'));
					return;
				}

				const context = await loadStageContext(progress.topic, stageNumber);
				if (!context) {
					throw new CLIError('Failed to load stage context.', {
						tip: 'Make sure you\'ve run "learn continue" first.',
					});
				}

				console.log(
					chalk.bold.cyan('\n┌──────────────────────────────────────────────────────────┐')
				);
				console.log(
					chalk.bold.cyan('│') +
						chalk.bold('  💬 Learn Ask - AI Chat Mode                             ') +
						chalk.bold.cyan('│')
				);
				console.log(chalk.bold.cyan('└──────────────────────────────────────────────────────────┘'));
				console.log(
					chalk.dim(`\nTopic: ${progress.topic} | Stage ${stageNumber}: ${currentStage.title}`)
				);
				console.log(
					chalk.dim('Ask questions about the current stage. Type "exit" or "quit" to leave.\n')
				);

				const messages: Message[] = [{ role: 'system', content: buildSystemPrompt(context) }];

				const rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});

				const askQuestion = (): void => {
					rl.question(chalk.green('You: '), async (input) => {
						const trimmedInput = input.trim();

						if (!trimmedInput) {
							askQuestion();
							return;
						}

						if (trimmedInput.toLowerCase() === 'exit' || trimmedInput.toLowerCase() === 'quit') {
							console.log(chalk.dim('\nGoodbye! Happy learning! 🚀\n'));
							rl.close();
							return;
						}

						messages.push({ role: 'user', content: trimmedInput });

						process.stdout.write(chalk.blue('\nAI: '));

						try {
							const response = await streamChatResponse(messages, (chunk) => {
								process.stdout.write(chunk);
							});

							messages.push({ role: 'assistant', content: response });
							console.log('\n');
						} catch (error) {
							console.log(
								chalk.red(`\n\nError: ${error instanceof Error ? error.message : String(error)}\n`)
							);
						}

						askQuestion();
					});
				};

				askQuestion();
			})
		);
}
