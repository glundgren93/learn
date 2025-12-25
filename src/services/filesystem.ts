import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Lesson, Roadmap } from '../types/index.js';
import { getLearningDir } from './context.js';

export function getTopicDir(topic: string): string {
	return join(getLearningDir(), topic);
}

export function getStageDir(topic: string, stageId: string): string {
	return join(getTopicDir(topic), 'stages', stageId);
}

export async function saveRoadmap(topic: string, roadmap: Roadmap): Promise<void> {
	const dir = getTopicDir(topic);
	await mkdir(dir, { recursive: true });

	const path = join(dir, 'roadmap.json');
	await writeFile(path, JSON.stringify(roadmap, null, 2), 'utf-8');
}

export async function loadRoadmap(topic: string): Promise<Roadmap | null> {
	try {
		const path = join(getTopicDir(topic), 'roadmap.json');
		const content = await readFile(path, 'utf-8');
		return JSON.parse(content) as Roadmap;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return null;
		}
		throw error;
	}
}

export async function saveLesson(topic: string, stageId: string, lesson: Lesson): Promise<void> {
	const stageDir = getStageDir(topic, stageId);
	await mkdir(stageDir, { recursive: true });

	// Save README.md with theory
	const readmePath = join(stageDir, 'README.md');
	await writeFile(readmePath, lesson.theory, 'utf-8');

	// Save test file
	const testDir = join(stageDir, 'tests');
	await mkdir(testDir, { recursive: true });

	const testContent = generateTestFile(lesson);
	const testPath = join(testDir, 'solution.test.ts');
	await writeFile(testPath, testContent, 'utf-8');

	// Save starter code
	const solutionPath = join(stageDir, 'solution.ts');
	await writeFile(solutionPath, lesson.starterCode, 'utf-8');

	// Save hints
	const hintsPath = join(stageDir, 'hints.json');
	await writeFile(hintsPath, JSON.stringify(lesson.hints, null, 2), 'utf-8');
}

function generateTestFile(lesson: Lesson): string {
	const imports = `import { describe, it, expect } from 'vitest';
import * as solution from '../solution.js';
`;

	const testCases = lesson.testCases
		.map((testCase) => {
			// Indent test code properly
			const indentedCode = testCase.testCode
				.split('\n')
				.map((line) => (line.trim() ? `    ${line}` : line))
				.join('\n');

			// Detect if testCode uses await and make the callback async
			const isAsync = /\bawait\s/.test(testCase.testCode);
			const callbackSignature = isAsync ? 'async () =>' : '() =>';

			return `
  it('${testCase.description}', ${callbackSignature} {
${indentedCode}
  });`;
		})
		.join('\n');

	return `${imports}
describe('Stage ${lesson.stageId}', () => {${testCases}
});
`;
}

export async function loadLesson(topic: string, stageId: string): Promise<Lesson | null> {
	try {
		const stageDir = getStageDir(topic, stageId);

		const readmePath = join(stageDir, 'README.md');
		const hintsPath = join(stageDir, 'hints.json');
		const solutionPath = join(stageDir, 'solution.ts');
		const testPath = join(stageDir, 'tests', 'solution.test.ts');

		const [theory, hintsJson, starterCode, testContent] = await Promise.all([
			readFile(readmePath, 'utf-8'),
			readFile(hintsPath, 'utf-8'),
			readFile(solutionPath, 'utf-8'),
			readFile(testPath, 'utf-8'),
		]);

		const hints = JSON.parse(hintsJson) as string[];

		// Parse test cases from test file (simplified - assumes format)
		const testCases = parseTestCases(testContent);

		return {
			stageId,
			theory,
			testCases,
			starterCode,
			hints,
		};
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return null;
		}
		throw error;
	}
}

function parseTestCases(testContent: string): Array<{ description: string; testCode: string }> {
	// Simple parser - extract test descriptions and code
	// This is a simplified version; in production you might use AST parsing
	const testCases: Array<{ description: string; testCode: string }> = [];
	const itRegex = /it\(['"]([^'"]+)['"],\s*\(\)\s*=>\s*\{([^}]+)\}\)/g;

	let match = itRegex.exec(testContent);
	while (match !== null) {
		testCases.push({
			description: match[1],
			testCode: match[2].trim(),
		});
		match = itRegex.exec(testContent);
	}

	return testCases;
}

export function getSolutionPath(topic: string, stageId: string): string {
	return join(getStageDir(topic, stageId), 'solution.ts');
}

export function getTestPath(topic: string, stageId: string): string {
	return join(getStageDir(topic, stageId), 'tests', 'solution.test.ts');
}
