import { readFile } from 'node:fs/promises';
import { getStageDir, loadRoadmap } from '../filesystem.js';
import type { StageContext } from './types.js';

export async function loadStageContext(
	topic: string,
	stageNumber: number
): Promise<StageContext | null> {
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

