import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Detects if the given directory is a learning project.
 * A learning project either:
 * - Has a package.json with learn-cli as a dependency
 * - Has an .active-topic file (indicating it's being used for learning)
 */
export function isLearningProject(dir: string = process.cwd()): boolean {
	const pkgPath = join(dir, 'package.json');
	if (existsSync(pkgPath)) {
		try {
			const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
			const deps = { ...pkg.dependencies, ...pkg.devDependencies };
			if (deps['learn-cli']) {
				return true;
			}
		} catch {
			// Ignore parse errors
		}
	}
	// Fallback: check for .active-topic file
	return existsSync(join(dir, '.active-topic'));
}

/**
 * Returns the learning directory path.
 * - If LEARNING_DIR env var is set, use that
 * - If we're in a learning project (detected via isLearningProject), use '.'
 * - Otherwise use './learning' (legacy/dev mode)
 */
export function getLearningDir(): string {
	if (process.env.LEARNING_DIR) {
		return process.env.LEARNING_DIR;
	}

	// If we're in a learning project, use current directory
	if (isLearningProject()) {
		return '.';
	}

	// Otherwise use ./learning (legacy/dev mode)
	return './learning';
}

