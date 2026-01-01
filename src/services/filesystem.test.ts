import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Roadmap } from '../types/index.js';
import { getTopicDir, loadRoadmap, saveRoadmap, saveTopicOverview } from './filesystem.js';

const TEST_LEARNING_DIR = './test-learning-fs';

describe('Filesystem Service', () => {
	beforeEach(async () => {
		process.env.LEARNING_DIR = TEST_LEARNING_DIR;
		await mkdir(TEST_LEARNING_DIR, { recursive: true });
	});

	afterEach(async () => {
		await rm(TEST_LEARNING_DIR, { recursive: true, force: true });
		delete process.env.LEARNING_DIR;
	});

	describe('saveTopicOverview', () => {
		it('should save LEARN.md file with overview content', async () => {
			const topic = 'test-topic';
			const overview = '# Test Topic\n\nThis is an overview of the test topic.';

			await saveTopicOverview(topic, overview);

			const savedContent = await readFile(join(getTopicDir(topic), 'LEARN.md'), 'utf-8');
			expect(savedContent).toBe(overview);
		});

		it('should create topic directory if it does not exist', async () => {
			const topic = 'new-topic';
			const overview = '# New Topic Overview';

			await saveTopicOverview(topic, overview);

			const savedContent = await readFile(join(getTopicDir(topic), 'LEARN.md'), 'utf-8');
			expect(savedContent).toBe(overview);
		});

		it('should handle multi-word topic names', async () => {
			const topic = 'effective maintenance';
			const overview = '# Effective Maintenance\n\nLearn about maintenance.';

			await saveTopicOverview(topic, overview);

			const savedContent = await readFile(join(getTopicDir(topic), 'LEARN.md'), 'utf-8');
			expect(savedContent).toBe(overview);
		});
	});

	describe('saveRoadmap and loadRoadmap', () => {
		const createTestRoadmap = (topic: string): Roadmap => ({
			topic,
			description: `Learn about ${topic}`,
			stages: Array.from({ length: 6 }, (_, i) => ({
				id: `stage-${i + 1}`,
				title: `Stage ${i + 1}`,
				objective: `Objective for stage ${i + 1}`,
				difficulty: i < 2 ? 'beginner' : i < 4 ? 'intermediate' : 'advanced',
				prerequisites: i > 0 ? [`stage-${i}`] : [],
				isRealWorldProject: i === 5,
				requiresPreviousSolution: i > 0,
			})),
		});

		it('should save and load roadmap', async () => {
			const roadmap = createTestRoadmap('test-topic');

			await saveRoadmap('test-topic', roadmap);
			const loaded = await loadRoadmap('test-topic');

			expect(loaded).toEqual(roadmap);
		});

		it('should return null for non-existent roadmap', async () => {
			const loaded = await loadRoadmap('non-existent');
			expect(loaded).toBeNull();
		});
	});
});
