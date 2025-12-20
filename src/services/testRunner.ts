import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

export interface TestResult {
	passed: boolean;
	failedTests: string[];
	errorMessages: string[];
}

export async function runTests(testFile: string): Promise<TestResult> {
	const testFileAbs = path.resolve(testFile);

	if (!existsSync(testFileAbs)) {
		return {
			passed: false,
			failedTests: ['Test file not found'],
			errorMessages: [`Test file does not exist: ${testFileAbs}`],
		};
	}

	return new Promise<TestResult>((promiseResolve) => {
		const failedTests: string[] = [];
		const errorMessages: string[] = [];
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

			// Parse output for failed tests (simplified parsing)
			if (!passed) {
				const lines = output.split('\n');
				for (const line of lines) {
					if (line.includes('FAIL') || line.includes('Error:')) {
						errorMessages.push(line.trim());
					}
					if (line.includes('×')) {
						const testName = line.split('×')[1]?.trim();
						if (testName) {
							failedTests.push(testName);
						}
					}
				}
			}

			promiseResolve({
				passed,
				failedTests,
				errorMessages: errorMessages.length > 0 ? errorMessages : [output],
			});
		});

		vitest.on('error', (error: Error) => {
			promiseResolve({
				passed: false,
				failedTests: ['Test execution failed'],
				errorMessages: [error.message],
			});
		});
	});
}
