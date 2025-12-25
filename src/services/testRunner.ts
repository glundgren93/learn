import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { getLearningDir } from './context.js';

export interface TestCase {
	name: string;
	passed: boolean;
	error?: string;
	expected?: string;
	received?: string;
}

export interface TestResult {
	passed: boolean;
	tests: TestCase[];
}

export async function runTests(testFile: string): Promise<TestResult> {
	const testFileAbs = path.resolve(testFile);

	if (!existsSync(testFileAbs)) {
		return {
			passed: false,
			tests: [{ name: 'Test file not found', passed: false, error: `Test file does not exist: ${testFileAbs}` }],
		};
	}

	return new Promise<TestResult>((promiseResolve) => {
		const tests: TestCase[] = [];
		let output = '';

		// Run vitest from the learning directory (where vitest.config.ts lives)
		const cwd = path.resolve(getLearningDir());
		const vitest: ChildProcess = spawn('npx', ['vitest', 'run', '--reporter=verbose', testFileAbs], {
			cwd,
			stdio: ['ignore', 'pipe', 'pipe'],
			shell: true,
		});

		vitest.stdout?.on('data', (data: Buffer) => {
			output += data.toString();
		});

		vitest.stderr?.on('data', (data: Buffer) => {
			output += data.toString();
		});

		vitest.on('close', (code: number | null) => {
			const allPassed = code === 0;
			const lines = output.split('\n');

			// First pass: collect passed tests from verbose output
			// Format: " ✓ path/to/file.ts > Suite > test name"
			for (const line of lines) {
				if (line.includes('✓') && line.includes('>')) {
					// Extract just the test name (after the last >)
					const testNameMatch = line.match(/>\s*([^>]+)$/);
					if (testNameMatch) {
						const cleanName = testNameMatch[1].trim();
						tests.push({ name: cleanName, passed: true });
					}
				}
			}

			// Second pass: collect error details for failed tests
			let currentFailedTest: TestCase | null = null;

			for (const line of lines) {
				// Capture FAIL blocks - start of a new failed test's details
				if (line.includes('FAIL') && line.includes('>')) {
					// Save previous test if exists
					if (currentFailedTest) {
						tests.push(currentFailedTest);
					}
					// Extract just the test name from the FAIL line
					const testNameMatch = line.match(/>\s*(.+)$/);
					if (testNameMatch) {
						currentFailedTest = { name: testNameMatch[1].trim(), passed: false };
					}
				}

				// Capture assertion errors
				if (currentFailedTest && line.includes('AssertionError:')) {
					currentFailedTest.error = line.replace(/^.*AssertionError:\s*/, '').trim();
				}

				// Capture expected/received values
				if (currentFailedTest) {
					const expectedMatch = line.match(/Expected[:\s]+(.+)/i);
					const receivedMatch = line.match(/Received[:\s]+(.+)/i);
					if (expectedMatch) {
						currentFailedTest.expected = expectedMatch[1].trim();
					}
					if (receivedMatch) {
						currentFailedTest.received = receivedMatch[1].trim();
					}
				}

				// Capture other error types
				if (currentFailedTest && !currentFailedTest.error) {
					const errorMatch = line.match(/(TypeError|ReferenceError|Error):\s*(.+)/);
					if (errorMatch) {
						currentFailedTest.error = `${errorMatch[1]}: ${errorMatch[2]}`;
					}
				}
			}

			// Don't forget the last failed test
			if (currentFailedTest) {
				tests.push(currentFailedTest);
			}

			promiseResolve({
				passed: allPassed,
				tests,
			});
		});

		vitest.on('error', (error: Error) => {
			promiseResolve({
				passed: false,
				tests: [{ name: 'Test execution failed', passed: false, error: error.message }],
			});
		});
	});
}

