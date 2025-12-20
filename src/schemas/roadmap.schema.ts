import { z } from 'zod';

export const StageSchema = z.object({
	id: z.string().describe("Unique kebab-case ID, e.g., 'basic-queue-impl'"),
	title: z.string().describe("Short title, e.g., 'Implementing a Basic Queue'"),
	objective: z.string().describe('One sentence: what the learner will build/prove'),
	difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
	prerequisites: z.array(z.string()).describe('IDs of stages that must be completed first'),
	estimatedMinutes: z.number().min(15).max(60),
	isRealWorldProject: z.boolean().describe('True only for the final capstone stage'),
});

export const RoadmapSchema = z.object({
	topic: z.string(),
	description: z.string(),
	stages: z
		.array(StageSchema)
		.min(6)
		.max(10)
		.describe('Minimum 6 stages to ensure real-world final stage'),
});

export type StageInput = z.infer<typeof StageSchema>;
export type RoadmapInput = z.infer<typeof RoadmapSchema>;
