import { RoadmapSchema } from '../schemas/roadmap.schema.js';
import type { Roadmap } from '../types/index.js';
import { type TokenUsage, callWithStructuredOutput, callWithTextOutput } from './client.js';
import {
	ROADMAP_SYSTEM_PROMPT,
	ROADMAP_USER_PROMPT,
	TOPIC_OVERVIEW_SYSTEM_PROMPT,
	TOPIC_OVERVIEW_USER_PROMPT,
} from './prompts/roadmap.js';

export interface GenerateRoadmapResult {
	roadmap: Roadmap;
	usage: TokenUsage;
}

export async function generateRoadmap(topic: string): Promise<GenerateRoadmapResult> {
	const { data: roadmap, usage } = await callWithStructuredOutput(
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

	return { roadmap: roadmap as Roadmap, usage };
}

export interface GenerateOverviewResult {
	overview: string;
	usage: TokenUsage;
}

export async function generateTopicOverview(roadmap: Roadmap): Promise<GenerateOverviewResult> {
	const stageTitles = roadmap.stages.map((s) => `${s.title} - ${s.objective}`);

	const { content: overview, usage } = await callWithTextOutput(
		TOPIC_OVERVIEW_SYSTEM_PROMPT,
		TOPIC_OVERVIEW_USER_PROMPT(roadmap.topic, stageTitles)
	);

	return { overview, usage };
}
