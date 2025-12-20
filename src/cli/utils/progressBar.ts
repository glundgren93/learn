import chalk from "chalk";

export function createProgressBar(
	percentage: number,
	width: number,
	isActive = false,
): string {
	const filled = Math.round((percentage / 100) * width);
	const empty = width - filled;
	const color = isActive ? chalk.cyan : chalk.green;
	const filledBar = color("█".repeat(filled));
	const emptyBar = chalk.gray("░".repeat(empty));
	return `[${filledBar}${emptyBar}]`;
}
