export interface Message {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface StageContext {
	topic: string;
	stageNumber: number;
	stageTitle: string;
	objective: string;
	readme: string;
	solutionCode: string;
	testCode: string;
	hints: string[];
}

