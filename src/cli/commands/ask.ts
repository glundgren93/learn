import { readFile } from 'node:fs/promises';
import * as readline from 'node:readline';
import chalk from 'chalk';
import type { Command } from 'commander';
import { model } from '../../agent/client.js';
import { getStageDir, loadRoadmap } from '../../services/filesystem.js';
import {
	handleContextError,
	loadLearningContext,
	showCompletedMessage,
} from '../middleware/index.js';

interface Message {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface StageContext {
	topic: string;
	stageNumber: number;
	stageTitle: string;
	objective: string;
	readme: string;
	solutionCode: string;
	testCode: string;
	hints: string[];
}

async function loadStageContext(topic: string, stageNumber: number): Promise<StageContext | null> {
	const roadmap = await loadRoadmap(topic);
	if (!roadmap) return null;

	const stage = roadmap.stages[stageNumber - 1];
	if (!stage) return null;

	const stageDir = getStageDir(topic, stage.id);

	try {
		const [readme, solutionCode, testCode, hintsJson] = await Promise.all([
			readFile(`${stageDir}/README.md`, 'utf-8').catch(() => ''),
			readFile(`${stageDir}/solution.ts`, 'utf-8').catch(() => ''),
			readFile(`${stageDir}/tests/solution.test.ts`, 'utf-8').catch(() => ''),
			readFile(`${stageDir}/hints.json`, 'utf-8').catch(() => '[]'),
		]);

		const hints = JSON.parse(hintsJson) as string[];

		return {
			topic,
			stageNumber,
			stageTitle: stage.title,
			objective: stage.objective,
			readme,
			solutionCode,
			testCode,
			hints,
		};
	} catch {
		return null;
	}
}

function buildSystemPrompt(context: StageContext): string {
	return `You are a helpful programming tutor assisting a student who is learning about "${context.topic}".

They are currently working on Stage ${context.stageNumber}: "${context.stageTitle}"

OBJECTIVE:
${context.objective}

LESSON CONTENT (README):
${context.readme}

CURRENT SOLUTION CODE (what the student is working with):
\`\`\`typescript
${context.solutionCode}
\`\`\`

TEST CASES (what the student needs to pass):
\`\`\`typescript
${context.testCode}
\`\`\`

HINTS (for reference, reveal progressively if they're really stuck):
${context.hints.map((h, i) => `${i + 1}. ${h}`).join('\n')}

GUIDELINES:
1. Be encouraging and supportive
2. Guide the student to discover answers rather than giving direct solutions
3. Use the Socratic method when appropriate - ask clarifying questions
4. If they share code, analyze it and provide specific feedback
5. Explain concepts in simple terms with real-world analogies
6. If they're stuck, start with gentle hints before revealing more
7. Relate new concepts to what they've learned in previous stages
8. Keep responses concise but helpful - this is a chat, not an essay
9. You can reference specific parts of the README or tests to help them
10. NEVER give them the complete solution - help them learn by doing`;
}

async function streamChatResponse(
	messages: Message[],
	onChunk: (chunk: string) => void
): Promise<string> {
	// Dynamic import to avoid issues if OpenAI isn't configured
	const { default: OpenAI } = await import('openai');
	const apiKey = process.env.OPENAI_API_KEY;

	if (!apiKey) {
		throw new Error('OPENAI_API_KEY environment variable is required');
	}

	const openai = new OpenAI({ apiKey });

	const stream = await openai.chat.completions.create({
		model,
		messages,
		stream: true,
	});

	let fullResponse = '';

	for await (const chunk of stream) {
		const content = chunk.choices[0]?.delta?.content || '';
		if (content) {
			onChunk(content);
			fullResponse += content;
		}
	}

	return fullResponse;
}

export function registerAskCommand(program: Command): void {
	program
		.command('ask [topic]')
		.description('Open an interactive chat to discuss the current stage with AI')
		.action(async (topicArg?: string) => {
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
				console.log(
					chalk.red('Failed to load stage context. Make sure you\'ve run "learn continue" first.')
				);
				return;
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
		});
}
