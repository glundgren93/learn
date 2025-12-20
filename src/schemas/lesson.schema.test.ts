import { describe, expect, it } from 'vitest';
import { LessonSchema, TestCaseSchema } from './lesson.schema.js';

const createTestCase = (num: number) => ({
	description: `Test case ${num}`,
	testCode: `expect(${num}).toBe(${num});`,
});

describe('Lesson Schema', () => {
	it('should validate a valid lesson', () => {
		const validLesson = {
			stageId: 'stage-1',
			theory: '# Theory\n\nThis is the theory content.',
			testCases: [
				createTestCase(1),
				createTestCase(2),
				createTestCase(3),
				createTestCase(4),
				createTestCase(5),
			],
			starterCode: 'export function solution() {\n  // TODO\n}',
			hints: ['Hint 1', 'Hint 2', 'Hint 3'],
		};

		const result = LessonSchema.safeParse(validLesson);
		expect(result.success).toBe(true);
	});

	it('should reject lesson with less than 5 test cases', () => {
		const invalidLesson = {
			stageId: 'stage-1',
			theory: 'Theory',
			testCases: [createTestCase(1)],
			starterCode: 'export function solution() {}',
			hints: ['Hint 1', 'Hint 2', 'Hint 3'],
		};

		const result = LessonSchema.safeParse(invalidLesson);
		expect(result.success).toBe(false);
	});

	it('should reject lesson without exactly 3 hints', () => {
		const invalidLesson = {
			stageId: 'stage-1',
			theory: 'Theory',
			testCases: [
				createTestCase(1),
				createTestCase(2),
				createTestCase(3),
				createTestCase(4),
				createTestCase(5),
			],
			starterCode: 'export function solution() {}',
			hints: ['Hint 1', 'Hint 2'], // Only 2 hints
		};

		const result = LessonSchema.safeParse(invalidLesson);
		expect(result.success).toBe(false);
	});
});

describe('TestCaseSchema - auto-cleaning', () => {
	it('should clean testCode with import statements', () => {
		const result = TestCaseSchema.safeParse({
			description: 'test',
			testCode: `import { describe } from 'vitest';
const q = new Queue();`,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.testCode).not.toContain('import');
			expect(result.data.testCode).toContain('solution.Queue');
		}
	});

	it('should clean testCode with describe/it blocks', () => {
		const result = TestCaseSchema.safeParse({
			description: 'test',
			testCode: `import { it, expect } from 'vitest';
describe('Queue', () => {
  it('works', () => {
    const q = new Queue<number>();
    expect(q.isEmpty()).toBe(true);
  });
});`,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.testCode).not.toContain('import');
			expect(result.data.testCode).not.toContain('describe(');
			expect(result.data.testCode).not.toContain('it(');
			expect(result.data.testCode).toContain('expect(q.isEmpty()).toBe(true)');
		}
	});

	it('should preserve already-clean testCode', () => {
		const cleanCode = `const q = new solution.Queue<number>();
q.enqueue(1);
expect(q.dequeue()).toBe(1);`;

		const result = TestCaseSchema.safeParse({
			description: 'test',
			testCode: cleanCode,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.testCode).toBe(cleanCode);
		}
	});
});
