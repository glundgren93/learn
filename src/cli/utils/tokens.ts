import chalk from 'chalk';
import type { TokenUsage } from '../../agent/client.js';

function formatNumber(num: number): string {
	return num.toLocaleString();
}

export function formatTokenUsage(usage: Record<string, TokenUsage>): string {
	const entries = Object.entries(usage);

	// Calculate totals
	const totalInput = entries.reduce((sum, [, u]) => sum + u.inputTokens, 0);
	const totalOutput = entries.reduce((sum, [, u]) => sum + u.outputTokens, 0);
	const total = totalInput + totalOutput;

	// Find max label length for alignment
	const maxLabelLen = Math.max(...entries.map(([label]) => label.length), 'Total'.length);

	const lines: string[] = [chalk.bold('\n📊 Token Usage')];

	// Individual entries
	for (const [label, u] of entries) {
		const paddedLabel = label.padEnd(maxLabelLen);
		lines.push(
			`   ${paddedLabel}: ${chalk.cyan(formatNumber(u.inputTokens).padStart(6))} in / ${chalk.yellow(formatNumber(u.outputTokens).padStart(6))} out`
		);
	}

	// Separator and total
	const separatorLen = maxLabelLen + 30;
	lines.push(`   ${'─'.repeat(separatorLen)}`);
	lines.push(
		`   ${'Total'.padEnd(maxLabelLen)}: ${chalk.cyan(formatNumber(totalInput).padStart(6))} in / ${chalk.yellow(formatNumber(totalOutput).padStart(6))} out ${chalk.gray(`(${formatNumber(total)} tokens)`)}`
	);

	return lines.join('\n');
}

