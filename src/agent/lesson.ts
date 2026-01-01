import { readFile } from 'node:fs/promises';
import { LessonSchema } from '../schemas/lesson.schema.js';
import { getSolutionPath, loadRoadmap } from '../services/filesystem.js';
import type { Lesson, LessonContext } from '../types/index.js';
import { callWithStructuredOutput, type TokenUsage } from './client.js';
import { LESSON_SYSTEM_PROMPT, LESSON_USER_PROMPT } from './prompts/lesson.js';

export interface GenerateLessonResult {
	lesson: Lesson;
	usage: TokenUsage;
}

export async function generateLesson(
	topic: string,
	stageId: string,
	stageNumber: number
): Promise<GenerateLessonResult> {
	const roadmap = await loadRoadmap(topic);
	if (!roadmap) {
		throw new Error(`Roadmap not found for topic: ${topic}`);
	}

	const stage = roadmap.stages.find((s) => s.id === stageId);
	if (!stage) {
		throw new Error(`Stage ${stageId} not found in roadmap`);
	}

	// Build context from previous stages
	const previousStages = roadmap.stages.slice(0, stageNumber - 1).map((s) => ({
		title: s.title,
		objective: s.objective,
	}));

	const previousConcepts = previousStages.map((s) => s.title);

	// Load previous solution if this stage requires it
	let previousSolution: { stageId: string; code: string } | undefined;
	if (stage.requiresPreviousSolution && stageNumber > 1) {
		const previousStage = roadmap.stages[stageNumber - 2];
		const solutionPath = getSolutionPath(topic, previousStage.id);
		try {
			const code = await readFile(solutionPath, 'utf-8');
			previousSolution = { stageId: previousStage.id, code };
		} catch {
			// Solution file doesn't exist yet, continue without it
		}
	}

	const context: LessonContext = {
		stageNumber,
		stageTitle: stage.title,
		topic: roadmap.topic,
		objective: stage.objective,
		previousStages,
		previousConcepts,
		previousSolution,
	};

	const { data: lesson, usage } = await callWithStructuredOutput(
		LessonSchema,
		LESSON_SYSTEM_PROMPT,
		LESSON_USER_PROMPT(context)
	);

	return { lesson: lesson as Lesson, usage };
}
