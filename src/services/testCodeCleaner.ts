/**
 * Cleans up testCode that incorrectly includes imports, describe(), or it() wrappers.
 * Extracts just the inner test body code.
 */

/**
 * Extracts the innermost test body from incorrectly wrapped testCode.
 *
 * Handles cases like:
 * ```
 * import { describe, it, expect } from 'vitest';
 * import { Queue } from './queue';
 *
 * describe('...', () => {
 *   it('...', () => {
 *     const q = new Queue();  // <- we want just this
 *     expect(q.isEmpty()).toBe(true);
 *   });
 * });
 * ```
 */
export function cleanTestCode(testCode: string): string {
	let code = testCode;

	// Remove import statements
	code = code.replace(/^import\s+.*?[;\n]/gm, "");

	// Find the innermost it/test block and extract its body
	const innerBody = extractInnermostTestBody(code);
	if (innerBody) {
		code = innerBody;
	} else {
		// No it/test block found, try to remove describe wrapper
		const describeBody = extractDescribeBody(code);
		if (describeBody) {
			code = describeBody;
		}
	}

	// Clean up any remaining describe/it/test calls at the start
	code = code.replace(/^\s*(describe|it|test)\s*\([^)]*,\s*\(\)\s*=>\s*\{/gm, "");

	// Remove trailing }); that close describe/it/test blocks
	code = code.replace(/\}\s*\)\s*;?\s*$/g, "");

	// Fix solution references: Queue -> solution.Queue
	code = fixSolutionReferences(code);

	// Clean up whitespace
	code = code
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n")
		.trim();

	return code;
}

/**
 * Extracts the body of the innermost it() or test() block.
 */
function extractInnermostTestBody(code: string): string | null {
	// Match it('...', () => { ... }) or test('...', () => { ... })
	// Find the last/innermost occurrence
	const itMatches = [...code.matchAll(/\b(?:it|test)\s*\(\s*['"`].*?['"`]\s*,\s*\(\)\s*=>\s*\{/g)];

	if (itMatches.length === 0) {
		return null;
	}

	// Get the last (innermost) match
	const lastMatch = itMatches[itMatches.length - 1];
	const startIndex = lastMatch.index! + lastMatch[0].length;

	// Find the matching closing brace
	const body = extractBracedContent(code, startIndex);
	return body;
}

/**
 * Extracts the body of a describe() block.
 */
function extractDescribeBody(code: string): string | null {
	const match = code.match(/\bdescribe\s*\(\s*['"`].*?['"`]\s*,\s*\(\)\s*=>\s*\{/);
	if (!match) {
		return null;
	}

	const startIndex = match.index! + match[0].length;
	return extractBracedContent(code, startIndex);
}

/**
 * Extracts content between matched braces starting at the given index.
 */
function extractBracedContent(code: string, startIndex: number): string | null {
	let depth = 1;
	let endIndex = startIndex;

	for (let i = startIndex; i < code.length; i++) {
		if (code[i] === "{") {
			depth++;
		} else if (code[i] === "}") {
			depth--;
			if (depth === 0) {
				endIndex = i;
				break;
			}
		}
	}

	if (depth !== 0) {
		return null; // Unbalanced braces
	}

	return code.slice(startIndex, endIndex);
}

// Built-in globals that should NOT be prefixed with solution.
const BUILTIN_GLOBALS = new Set([
	"Promise",
	"Map",
	"Set",
	"WeakMap",
	"WeakSet",
	"Array",
	"Object",
	"Error",
	"TypeError",
	"RangeError",
	"SyntaxError",
	"Date",
	"RegExp",
	"URL",
	"URLSearchParams",
	"FormData",
	"Blob",
	"File",
	"Headers",
	"Request",
	"Response",
	"AbortController",
	"AbortSignal",
	"Event",
	"EventTarget",
	"CustomEvent",
	"Int8Array",
	"Uint8Array",
	"Uint8ClampedArray",
	"Int16Array",
	"Uint16Array",
	"Int32Array",
	"Uint32Array",
	"Float32Array",
	"Float64Array",
	"BigInt64Array",
	"BigUint64Array",
	"ArrayBuffer",
	"SharedArrayBuffer",
	"DataView",
	"TextEncoder",
	"TextDecoder",
]);

/**
 * Fixes references to use the solution namespace.
 * e.g., `new Queue()` -> `new solution.Queue()`
 */
function fixSolutionReferences(code: string): string {
	// Match: new ClassName< or new ClassName(
	// Only fix if not already prefixed with solution.
	const pattern = /\bnew\s+(?!solution\.)([A-Z][a-zA-Z]*)\s*[<(]/g;

	return code.replace(pattern, (match, className) => {
		// Don't prefix built-in globals
		if (BUILTIN_GLOBALS.has(className)) {
			return match;
		}
		return match.replace(className, `solution.${className}`);
	});
}

/**
 * Checks if testCode needs cleaning (contains forbidden patterns).
 */
export function needsCleaning(testCode: string): boolean {
	const forbiddenPatterns = [
		/^import\s+/m,
		/\bdescribe\s*\(/,
		/\bit\s*\(/,
		/\btest\s*\(/,
	];

	return forbiddenPatterns.some((pattern) => pattern.test(testCode));
}
