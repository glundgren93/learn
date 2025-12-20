import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Progress, StageProgress } from '../types/index.js';

function getLearningDir(): string {
	return process.env.LEARNING_DIR || './learning';
}

function getActiveTopicFile(): string {
	return join(getLearningDir(), '.active-topic');
}

export async function getProgressPath(topic: string): Promise<string> {
	return join(getLearningDir(), topic, 'progress.json');
}

export async function loadProgress(topic: string): Promise<Progress | null> {
	try {
		const path = await getProgressPath(topic);
		const content = await readFile(path, 'utf-8');
		return JSON.parse(content) as Progress;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return null;
		}
		throw error;
	}
}

export async function saveProgress(progress: Progress): Promise<void> {
	const path = await getProgressPath(progress.topic);
	const dir = join(getLearningDir(), progress.topic);

	await mkdir(dir, { recursive: true });
	await writeFile(path, JSON.stringify(progress, null, 2), 'utf-8');
}

export async function initializeProgress(topic: string, totalStages: number): Promise<Progress> {
	const stages: Record<string, StageProgress> = {};

	// First stage is unlocked, rest are locked
	stages['1'] = { status: 'in_progress', attempts: 0 };
	for (let i = 2; i <= totalStages; i++) {
		stages[i.toString()] = { status: 'locked' };
	}

	const progress: Progress = {
		topic,
		currentStage: 1,
		stages,
	};

	await saveProgress(progress);
	return progress;
}

export async function markStageComplete(topic: string, stageNumber: number): Promise<void> {
	const progress = await loadProgress(topic);
	if (!progress) {
		throw new Error(`No progress found for topic: ${topic}`);
	}

	const stageKey = stageNumber.toString();
	progress.stages[stageKey] = {
		status: 'completed',
		completedAt: new Date().toISOString(),
	};

	// Unlock next stage if exists
	const nextStageKey = (stageNumber + 1).toString();
	if (progress.stages[nextStageKey] && progress.stages[nextStageKey].status === 'locked') {
		progress.stages[nextStageKey] = {
			status: 'in_progress',
			attempts: 0,
		};
		progress.currentStage = stageNumber + 1;
	}

	await saveProgress(progress);
}

export async function incrementAttempts(topic: string, stageNumber: number): Promise<void> {
	const progress = await loadProgress(topic);
	if (!progress) {
		throw new Error(`No progress found for topic: ${topic}`);
	}

	const stageKey = stageNumber.toString();
	const stage = progress.stages[stageKey];
	if (stage && stage.status === 'in_progress') {
		stage.attempts = (stage.attempts || 0) + 1;
		await saveProgress(progress);
	}
}

export async function getCurrentStage(topic: string): Promise<number | null> {
	const progress = await loadProgress(topic);
	return progress?.currentStage || null;
}

export async function setActiveTopic(topic: string): Promise<void> {
	await mkdir(getLearningDir(), { recursive: true });
	await writeFile(getActiveTopicFile(), topic, 'utf-8');
}

export async function getActiveTopic(): Promise<string | null> {
	try {
		const topic = await readFile(getActiveTopicFile(), 'utf-8');
		return topic.trim();
	} catch {
		return null;
	}
}

export async function getAllTopicsProgress(): Promise<Progress[]> {
	try {
		const entries = await readdir(getLearningDir(), { withFileTypes: true });
		const topicDirs = entries.filter((e) => e.isDirectory());

		const progressList: Progress[] = [];

		for (const dir of topicDirs) {
			const progress = await loadProgress(dir.name);
			if (progress) {
				progressList.push(progress);
			}
		}

		return progressList;
	} catch {
		return [];
	}
}
