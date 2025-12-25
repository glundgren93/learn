import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getLearningDir } from '../../services/context.js';
import { getActiveTopic, loadProgress, setActiveTopic } from '../../services/progress.js';

export interface CurrentTopic {
	topic: string;
	currentStage: number;
}

export async function findCurrentTopic(topicOverride?: string): Promise<CurrentTopic | null> {
	// If topic is specified, use that
	if (topicOverride) {
		const progress = await loadProgress(topicOverride);
		if (progress) {
			return { topic: progress.topic, currentStage: progress.currentStage };
		}
		return null;
	}

	// Otherwise, use the active topic
	const activeTopic = await getActiveTopic();
	if (activeTopic) {
		const progress = await loadProgress(activeTopic);
		if (progress) {
			return { topic: progress.topic, currentStage: progress.currentStage };
		}
	}

	// Fallback: find any topic with progress
	try {
		const learningDir = getLearningDir();
		const topics = await readdir(learningDir, { withFileTypes: true });
		const topicDirs = topics.filter((dirent) => dirent.isDirectory());

		for (const topicDir of topicDirs) {
			const progressPath = join(learningDir, topicDir.name, 'progress.json');
			try {
				const progress = JSON.parse(await readFile(progressPath, 'utf-8'));
				if (progress.currentStage) {
					// Set this as active for future calls
					await setActiveTopic(progress.topic);
					return { topic: progress.topic, currentStage: progress.currentStage };
				}
			} catch {
				// Ignore errors for individual progress files
			}
		}
		return null;
	} catch {
		return null;
	}
}
