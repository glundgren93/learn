import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

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

		// Run vitest with verbose reporter to see all test results (passed and failed)
		const vitest: ChildProcess = spawn('npx', ['vitest', 'run', '--reporter=verbose', testFileAbs], {
			cwd: PROJECT_ROOT,
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

			// Debug: log full output if no tests found
			// console.log('Vitest output:', output);

			// First pass: collect passed tests from verbose output
			// Format: " ✓ path/to/file.ts > Suite > test name" or with checkmark symbol
			for (const line of lines) {
				// Match passed tests - look for checkmark variants
				if ((line.includes('✓') || line.includes('√') || /\s+✔/.test(line)) && line.includes('>')) {
					// Extract just the test name (after the last >)
					const testNameMatch = line.match(/>\s*([^>]+?)\s*(?:\d+\s*ms)?$/);
					if (testNameMatch) {
						const cleanName = testNameMatch[1].trim().replace(/\s+\d+\s*ms$/, '');
						if (cleanName) {
							tests.push({ name: cleanName, passed: true });
						}
					}
				}
			}

			// Second pass: collect failed tests
			// Look for ✕, ×, x markers for failed tests
			let currentFailedTest: TestCase | null = null;

			for (const line of lines) {
				// Capture failed test lines - multiple possible markers
				const isFailedTestLine = (line.includes('✕') || line.includes('×') || line.includes('✗') || 
					(line.includes('FAIL') && line.includes('>'))) && line.includes('>');
				
				if (isFailedTestLine) {
					// Save previous test if exists
					if (currentFailedTest) {
						tests.push(currentFailedTest);
					}
					// Extract just the test name from the failed test line
					const testNameMatch = line.match(/>\s*([^>]+?)\s*(?:\d+\s*ms)?$/);
					if (testNameMatch) {
						const cleanName = testNameMatch[1].trim().replace(/\s+\d+\s*ms$/, '');
						if (cleanName) {
							currentFailedTest = { name: cleanName, passed: false };
						}
					}
				}

				// Capture inline error messages (→ error message format from vitest verbose)
				if (currentFailedTest && !currentFailedTest.error && line.includes('→')) {
					const arrowMatch = line.match(/→\s*(.+)/);
					if (arrowMatch) {
						currentFailedTest.error = arrowMatch[1].trim();
					}
				}

				// Capture assertion errors
				if (currentFailedTest && line.includes('AssertionError:')) {
					currentFailedTest.error = line.replace(/^.*AssertionError:\s*/, '').trim();
				}

				// Capture expected/received values (vitest format)
				if (currentFailedTest) {
					// Match "- Expected" / "+ Received" format from vitest diff
					const expectedLineMatch = line.match(/^-\s*(.+)/);
					const receivedLineMatch = line.match(/^\+\s*(.+)/);
					if (expectedLineMatch && !currentFailedTest.expected) {
						currentFailedTest.expected = expectedLineMatch[1].trim();
					}
					if (receivedLineMatch && !currentFailedTest.received) {
						currentFailedTest.received = receivedLineMatch[1].trim();
					}
				}

				// Capture other error types
				if (currentFailedTest && !currentFailedTest.error) {
					const errorMatch = line.match(/(TypeError|ReferenceError|Error|expect\(.+\)):\s*(.+)/);
					if (errorMatch) {
						currentFailedTest.error = `${errorMatch[1]}: ${errorMatch[2]}`;
					}
				}
			}

			// Don't forget the last failed test
			if (currentFailedTest) {
				tests.push(currentFailedTest);
			}

			// If no tests were parsed but code indicates failure, add a generic entry
			if (tests.length === 0 && !allPassed) {
				// Try to extract error from output
				const errorLines = lines.filter(l => l.includes('Error') || l.includes('error'));
				tests.push({
					name: 'Test execution',
					passed: false,
					error: errorLines.length > 0 ? errorLines[0].trim() : 'Tests failed - check console for details'
				});
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

