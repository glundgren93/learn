import { describe, expect, it } from 'vitest';
import { RoadmapSchema, StageSchema } from './roadmap.schema.js';

const createStage = (id: number, isRealWorldProject = false) => ({
	id: `stage-${id}`,
	title: `Stage ${id}`,
	objective: `Objective for stage ${id}`,
	difficulty: id <= 2 ? 'beginner' : id <= 4 ? 'intermediate' : ('advanced' as const),
	prerequisites: id > 1 ? [`stage-${id - 1}`] : [],
	estimatedMinutes: 20,
	isRealWorldProject,
});

describe('Roadmap Schema', () => {
	it('should validate a valid roadmap with 6 stages', () => {
		const validRoadmap = {
			topic: 'queues',
			description: 'Learn about queues',
			stages: [
				createStage(1),
				createStage(2),
				createStage(3),
				createStage(4),
				createStage(5),
				createStage(6, true),
			],
		};

		const result = RoadmapSchema.safeParse(validRoadmap);
		expect(result.success).toBe(true);
	});

	it('should reject roadmap with less than 6 stages', () => {
		const invalidRoadmap = {
			topic: 'queues',
			description: 'Learn about queues',
			stages: [createStage(1)],
		};

		const result = RoadmapSchema.safeParse(invalidRoadmap);
		expect(result.success).toBe(false);
	});

	it('should validate stage with all required fields', () => {
		const validStage = {
			id: 'test-stage',
			title: 'Test Stage',
			objective: 'Test objective',
			difficulty: 'beginner' as const,
			prerequisites: [],
			estimatedMinutes: 25,
			isRealWorldProject: false,
		};

		const result = StageSchema.safeParse(validStage);
		expect(result.success).toBe(true);
	});

	it('should reject stage with estimatedMinutes outside range', () => {
		const invalidStage = {
			id: 'test-stage',
			title: 'Test Stage',
			objective: 'Test objective',
			difficulty: 'beginner' as const,
			prerequisites: [],
			estimatedMinutes: 10, // Below minimum of 15
			isRealWorldProject: false,
		};

		const result = StageSchema.safeParse(invalidStage);
		expect(result.success).toBe(false);
	});
});
