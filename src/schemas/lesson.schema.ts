import { z } from "zod";
import { cleanTestCode, needsCleaning } from "../services/testCodeCleaner.js";

export const TestCaseSchema = z.object({
	description: z
		.string()
		.describe(
			"Short test name, e.g., 'should return null when queue is empty'",
		),
	testCode: z
		.string()
		.transform((code) => {
			// Auto-fix testCode if it contains forbidden patterns
			if (needsCleaning(code)) {
				console.log("[testCodeCleaner] Cleaning testCode...");
				const cleaned = cleanTestCode(code);
				console.log("[testCodeCleaner] Before:", code.substring(0, 100));
				console.log("[testCodeCleaner] After:", cleaned.substring(0, 100));
				return cleaned;
			}
			return code;
		})
		.describe(
			"ONLY the test body code. NO imports, NO describe(), NO it(). Example: const q = new solution.Queue(); q.enqueue(1); expect(q.dequeue()).toBe(1);",
		),
});

export const LessonSchema = z.object({
	stageId: z.string(),
	theory: z
		.string()
		.describe("Markdown content explaining concepts, 300-500 words"),
	keyTakeaways: z.array(z.string()).min(3).max(5),
	testCases: z
		.array(TestCaseSchema)
		.min(5)
		.max(8)
		.describe("Vitest test cases that guide the learner"),
	starterCode: z
		.string()
		.describe(
			"Skeleton code with type signatures and TODO comments, NOT the solution",
		),
	hints: z
		.array(z.string())
		.length(3)
		.describe("3 progressive hints from vague to specific"),
});

export type LessonInput = z.infer<typeof LessonSchema>;
export type TestCaseInput = z.infer<typeof TestCaseSchema>;
