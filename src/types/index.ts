export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Stage {
	id: string;
	title: string;
	objective: string;
	difficulty: Difficulty;
	prerequisites: string[];
	estimatedMinutes: number;
	isRealWorldProject: boolean;
}

export interface Roadmap {
	topic: string;
	description: string;
	stages: Stage[];
}

export interface TestCase {
	description: string;
	testCode: string;
}

export interface Lesson {
	stageId: string;
	theory: string;
	keyTakeaways: string[];
	testCases: TestCase[];
	starterCode: string;
	hints: string[];
}

export interface LessonContext {
	stageNumber: number;
	stageTitle: string;
	topic: string;
	objective: string;
	previousStages: Array<{ title: string; objective: string }>;
	previousConcepts: string[];
}

export interface StageProgress {
	status: 'locked' | 'in_progress' | 'completed';
	completedAt?: string;
	attempts?: number;
}

export interface Progress {
	topic: string;
	currentStage: number;
	stages: Record<string, StageProgress>;
}
