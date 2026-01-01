import { askModel } from '../../agent/client.js';
import type { Message } from './types.js';

export async function streamChatResponse(
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
		model: askModel,
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

