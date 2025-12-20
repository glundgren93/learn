#!/usr/bin/env npx tsx
/**
 * Script to fix a malformed test file that has nested imports/describe/it blocks.
 *
 * Usage: npx tsx scripts/fixTestFile.ts <path-to-test-file>
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { cleanTestCode } from '../src/services/testCodeCleaner.js';

const testFilePath = process.argv[2];

if (!testFilePath) {
	console.error('Usage: npx tsx scripts/fixTestFile.ts <path-to-test-file>');
	process.exit(1);
}

const content = readFileSync(testFilePath, 'utf-8');

// Parse the test file to extract and fix each it() block
const fixed = fixTestFile(content);

writeFileSync(testFilePath, fixed, 'utf-8');
console.log(`✅ Fixed: ${testFilePath}`);

function fixTestFile(content: string): string {
	// Match it('description', () => { ... });
	// We need to extract each it block's body and clean it

	const lines = content.split('\n');
	const result: string[] = [];

	let i = 0;
	while (i < lines.length) {
		const line = lines[i];

		// Check if this is an it() line
		const itMatch = line.match(/^(\s*)it\(['"`](.*?)['"`],\s*\(\)\s*=>\s*\{/);

		if (itMatch) {
			const indent = itMatch[1];
			const description = itMatch[2];

			// Collect the body of this it block
			let depth = 1;
			const bodyLines: string[] = [];
			i++;

			while (i < lines.length && depth > 0) {
				const bodyLine = lines[i];

				// Count braces
				for (const char of bodyLine) {
					if (char === '{') depth++;
					if (char === '}') depth--;
				}

				if (depth > 0) {
					bodyLines.push(bodyLine);
				} else {
					// This line closes the it block, but may have content before the }
					const closingMatch = bodyLine.match(/^(.*?)\}\s*\)\s*;?\s*$/);
					if (closingMatch?.[1].trim()) {
						bodyLines.push(closingMatch[1]);
					}
				}
				i++;
			}

			// Clean the body
			const rawBody = bodyLines.join('\n');
			const cleanedBody = cleanTestCode(rawBody);

			// Rebuild the it block with proper indentation
			const bodyIndent = `${indent}    `;
			const indentedBody = cleanedBody
				.split('\n')
				.map((l) => (l.trim() ? bodyIndent + l : l))
				.join('\n');

			// Detect if the body uses await and make callback async
			const isAsync = /\bawait\s/.test(cleanedBody);
			const callbackSignature = isAsync ? 'async () =>' : '() =>';

			result.push(`${indent}it('${description}', ${callbackSignature} {`);
			result.push(indentedBody);
			result.push(`${indent}});`);
			result.push('');
		} else {
			result.push(line);
			i++;
		}
	}

	return result.join('\n');
}
