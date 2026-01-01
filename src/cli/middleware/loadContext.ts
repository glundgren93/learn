import chalk from 'chalk';
import { loadRoadmap } from '../../services/filesystem.js';
import { loadProgress } from '../../services/progress.js';
import type { Progress, Roadmap, Stage } from '../../types/index.js';
import { CLIError } from '../errors.js';
import { findCurrentTopic } from '../utils/index.js';

/**
 * Unified context object containing all resolved learning state.
 * Avoids repeated topic resolution + roadmap loading + validation across commands.
 */
export interface LearningContext {
	/** The resolved topic progress (minimal: topic + currentStage) */
	progress: { topic: string; currentStage: number };
	/** The full progress object with stages (for stats calculation) */
	fullProgress: Progress;
	/** The full roadmap for the topic */
	roadmap: Roadmap;
	/** Current stage (null if all stages completed) */
	currentStage: Stage | null;
	/** 1-based stage number */
	stageNumber: number;
	/** Whether all stages are completed */
	isCompleted: boolean;
}

export type ContextErrorType = 'no-topic' | 'no-roadmap';

export interface ContextError {
	type: ContextErrorType;
	message: string;
}

export type ContextResult =
	| { ok: true; context: LearningContext }
	| { ok: false; error: ContextError };

/**
 * Load the learning context for a topic.
 * Handles topic resolution, roadmap loading, and stage lookup.
 *
 * @param topicArg - Optional topic override. If not provided, uses active topic.
 * @returns ContextResult with either the context or an error.
 */
export async function loadLearningContext(topicArg?: string): Promise<ContextResult> {
	const progress = await findCurrentTopic(topicArg);
	if (!progress) {
		return {
			ok: false,
			error: {
				type: 'no-topic',
				message: 'No active learning path found. Use "learn start <topic>" to begin.',
			},
		};
	}

	const [roadmap, fullProgress] = await Promise.all([
		loadRoadmap(progress.topic),
		loadProgress(progress.topic),
	]);

	if (!roadmap) {
		return {
			ok: false,
			error: {
				type: 'no-roadmap',
				message: `Roadmap not found for topic: ${progress.topic}`,
			},
		};
	}

	// fullProgress should always exist if progress exists, but handle edge case
	if (!fullProgress) {
		return {
			ok: false,
			error: {
				type: 'no-topic',
				message: `Progress data not found for topic: ${progress.topic}`,
			},
		};
	}

	const stageNumber = progress.currentStage;
	const currentStage = roadmap.stages[stageNumber - 1] ?? null;

	return {
		ok: true,
		context: {
			progress,
			fullProgress,
			roadmap,
			currentStage,
			stageNumber,
			isCompleted: currentStage === null,
		},
	};
}

/**
 * Handle context errors with consistent output.
 * Returns true if there was an error (caller should return early).
 */
export function handleContextError(
	result: ContextResult
): result is { ok: false; error: ContextError } {
	if (!result.ok) {
		console.log(chalk.red(result.error.message));
		return true;
	}
	return false;
}

/**
 * Load learning context or throw CLIError.
 * Use this instead of loadLearningContext + handleContextError when you want
 * errors to be thrown rather than checked.
 *
 * @throws {CLIError} If context cannot be loaded.
 */
export async function requireLearningContext(topicArg?: string): Promise<LearningContext> {
	const result = await loadLearningContext(topicArg);
	if (!result.ok) {
		const tip =
			result.error.type === 'no-topic' ? 'Use "learn start <topic>" to begin.' : undefined;
		throw new CLIError(result.error.message, { tip });
	}
	return result.context;
}

/**
 * Print the "all stages completed" message.
 */
export function showCompletedMessage(): void {
	console.log(chalk.green('🎉 All stages completed!'));
}
