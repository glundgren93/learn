import { LessonSchema } from "../src/schemas/lesson.schema.js";

const mockLesson = {
	stageId: "test-stage",
	theory: "Some theory content here that explains concepts.",
	keyTakeaways: ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
	testCases: [
		{
			description: "test 1",
			testCode: `import { describe, it, expect } from 'vitest';
import { Queue } from './queue';

describe('Queue', () => {
  it('works', () => {
    const q = new Queue<number>();
    expect(q.isEmpty()).toBe(true);
  });
});`,
		},
		{
			description: "test 2",
			testCode: `const q = new solution.Queue<number>();
expect(q.size()).toBe(0);`,
		},
		{
			description: "test 3",
			testCode: `expect(true).toBe(true);`,
		},
		{
			description: "test 4",
			testCode: `expect(1 + 1).toBe(2);`,
		},
		{
			description: "test 5",
			testCode: `expect("hello").toBe("hello");`,
		},
	],
	starterCode: "export class Queue {}",
	hints: ["Hint 1", "Hint 2", "Hint 3"],
};

console.log("=== Before parsing ===");
console.log("Test 1 testCode:");
console.log(mockLesson.testCases[0].testCode);
console.log();

const result = LessonSchema.safeParse(mockLesson);

if (result.success) {
	console.log("=== After parsing ===");
	console.log("Test 1 testCode:");
	console.log(result.data.testCases[0].testCode);
} else {
	console.log("Parse failed:", result.error.message);
}
