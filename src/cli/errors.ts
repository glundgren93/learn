import chalk from 'chalk';

export interface CLIErrorOptions {
	/** Exit code. If undefined, the error is "soft" and won't cause process exit. */
	exitCode?: number;
	/** Optional tip message shown after the error */
	tip?: string;
}

/**
 * Custom error class for CLI commands.
 *
 * Use this for all user-facing errors in CLI commands to ensure consistent
 * error output and exit behavior.
 *
 * @example
 * // Hard error - will exit with code 1
 * throw new CLIError('Failed to generate roadmap', { exitCode: 1 });
 *
 * // Soft error - logs but doesn't exit
 * throw new CLIError('Topic not found', { tip: 'Use "learn start <topic>" to begin.' });
 *
 * // Error with both exit code and tip
 * throw new CLIError('API key missing', {
 *   exitCode: 1,
 *   tip: 'Set OPENAI_API_KEY in your .env file'
 * });
 */
export class CLIError extends Error {
	readonly exitCode?: number;
	readonly tip?: string;

	constructor(message: string, options: CLIErrorOptions = {}) {
		super(message);
		this.name = 'CLIError';
		this.exitCode = options.exitCode;
		this.tip = options.tip;
	}

	/**
	 * Whether this error should cause the process to exit.
	 */
	get isHardError(): boolean {
		return this.exitCode !== undefined;
	}
}

/**
 * Format and print a CLI error to the console.
 */
function printCLIError(error: CLIError): void {
	console.log(chalk.red(error.message));
	if (error.tip) {
		console.log(chalk.yellow(`💡 ${error.tip}`));
	}
}

/**
 * Format and print an unexpected error to the console.
 */
function printUnexpectedError(error: unknown): void {
	const message = error instanceof Error ? error.message : String(error);
	console.log(chalk.red(`Error: ${message}`));
}

/**
 * Wraps a command action function to provide consistent error handling.
 *
 * - CLIError instances are handled according to their configuration
 * - Other errors are logged and cause exit with code 1
 *
 * @example
 * program
 *   .command('mycommand')
 *   .action(handleCommand(async () => {
 *     // command logic here
 *     throw new CLIError('Something went wrong', { exitCode: 1 });
 *   }));
 */
export function handleCommand<T extends unknown[]>(
	fn: (...args: T) => Promise<void>
): (...args: T) => Promise<void> {
	return async (...args: T) => {
		try {
			await fn(...args);
		} catch (error) {
			if (error instanceof CLIError) {
				printCLIError(error);
				if (error.isHardError) {
					process.exit(error.exitCode);
				}
			} else {
				printUnexpectedError(error);
				process.exit(1);
			}
		}
	};
}

