import dotenv from 'dotenv';
import OpenAI from 'openai';
import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
	throw new Error('OPENAI_API_KEY environment variable is required');
}

export const openai = new OpenAI({
	apiKey,
});

export const model = process.env.OPENAI_MODEL || 'gpt-4o';

/**
 * Call OpenAI with structured output using Zod schema
 */
export async function callWithStructuredOutput<T>(
	schema: z.ZodType<T>,
	systemPrompt: string,
	userPrompt: string
): Promise<T> {
	// Convert Zod schema to JSON Schema
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const fullSchema = zodToJsonSchema(schema as any, {
		name: 'response',
		$refStrategy: 'none',
	});

	// Extract the actual schema (zodToJsonSchema wraps it)
	const jsonSchema =
		'definitions' in fullSchema ? (fullSchema.definitions?.response ?? fullSchema) : fullSchema;

	// Ensure the schema has additionalProperties: false for strict mode
	const schemaWithStrict = {
		...jsonSchema,
		additionalProperties: false,
	};

	const response = await openai.chat.completions.create({
		model,
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt },
		],
		response_format: {
			type: 'json_schema',
			json_schema: {
				name: 'response',
				strict: true,
				schema: schemaWithStrict as Record<string, unknown>,
			},
		},
	});

	const content = response.choices[0]?.message?.content;
	if (!content) {
		throw new Error('Failed to get content from OpenAI');
	}

	// Parse JSON response
	const parsed = JSON.parse(content);

	// Validate with Zod schema
	const result = schema.safeParse(parsed);
	if (!result.success) {
		throw new Error(`Validation failed: ${result.error.message}`);
	}

	return result.data;
}
