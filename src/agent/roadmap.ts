import { RoadmapSchema } from '../schemas/roadmap.schema.js';
import type { Roadmap } from '../types/index.js';
import { callWithStructuredOutput } from './client.js';
import { ROADMAP_SYSTEM_PROMPT, ROADMAP_USER_PROMPT } from './prompts/roadmap.js';

export async function generateRoadmap(topic: string): Promise<Roadmap> {
	const roadmap = await callWithStructuredOutput(
		RoadmapSchema,
		ROADMAP_SYSTEM_PROMPT,
		ROADMAP_USER_PROMPT(topic)
	);

	// Validate that the final stage is marked as real-world project
	const stages = roadmap.stages;
	const finalStage = stages[stages.length - 1];
	if (!finalStage.isRealWorldProject) {
		// If AI didn't mark it, we'll mark it ourselves
		finalStage.isRealWorldProject = true;
	}

	return roadmap as Roadmap;
}
