import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

export interface FailedTest {
	name: string;
	error: string;
	expected?: string;
	received?: string;
}

export interface TestResult {
	passed: boolean;
	failedTests: FailedTest[];
}

export async function runTests(testFile: string): Promise<TestResult> {
	const testFileAbs = path.resolve(testFile);

	if (!existsSync(testFileAbs)) {
		return {
			passed: false,
			failedTests: [{ name: 'Test file not found', error: `Test file does not exist: ${testFileAbs}` }],
		};
	}

	return new Promise<TestResult>((promiseResolve) => {
		const failedTests: FailedTest[] = [];
		let output = '';

		// Run vitest with the specific test file
		const vitest: ChildProcess = spawn('npx', ['vitest', 'run', testFileAbs], {
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
			const passed = code === 0;

			// Parse output for failed tests
			if (!passed) {
				const lines = output.split('\n');
				let currentTest: FailedTest | null = null;

				for (let i = 0; i < lines.length; i++) {
					const line = lines[i];

					// Capture FAIL blocks - start of a new failed test
					if (line.includes('FAIL') && line.includes('>')) {
						// Save previous test if exists
						if (currentTest) {
							failedTests.push(currentTest);
						}
						// Extract just the test name from the FAIL line
						const testNameMatch = line.match(/>\s*(.+)$/);
						if (testNameMatch) {
							currentTest = { name: testNameMatch[1].trim(), error: '' };
						}
					}

					// Capture assertion errors
					if (currentTest && line.includes('AssertionError:')) {
						currentTest.error = line.replace(/^.*AssertionError:\s*/, '').trim();
					}

					// Capture expected/received values
					if (currentTest) {
						const expectedMatch = line.match(/Expected[:\s]+(.+)/i);
						const receivedMatch = line.match(/Received[:\s]+(.+)/i);
						if (expectedMatch) {
							currentTest.expected = expectedMatch[1].trim();
						}
						if (receivedMatch) {
							currentTest.received = receivedMatch[1].trim();
						}
					}

					// Capture other error types
					if (currentTest && !currentTest.error) {
						const errorMatch = line.match(/(TypeError|ReferenceError|Error):\s*(.+)/);
						if (errorMatch) {
							currentTest.error = `${errorMatch[1]}: ${errorMatch[2]}`;
						}
					}
				}

				// Don't forget the last test
				if (currentTest) {
					failedTests.push(currentTest);
				}
			}

			promiseResolve({
				passed,
				failedTests,
			});
		});

		vitest.on('error', (error: Error) => {
			promiseResolve({
				passed: false,
				failedTests: [{ name: 'Test execution failed', error: error.message }],
			});
		});
	});
}

