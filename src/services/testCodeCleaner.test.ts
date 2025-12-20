import { describe, expect, it } from 'vitest';
import { cleanTestCode, needsCleaning } from './testCodeCleaner.js';

describe('testCodeCleaner', () => {
	describe('needsCleaning', () => {
		it('returns true for code with imports', () => {
			const code = `import { Queue } from './queue';
const q = new Queue();`;
			expect(needsCleaning(code)).toBe(true);
		});

		it('returns true for code with describe', () => {
			const code = `describe('test', () => { expect(true).toBe(true); });`;
			expect(needsCleaning(code)).toBe(true);
		});

		it('returns true for code with it', () => {
			const code = `it('test', () => { expect(true).toBe(true); });`;
			expect(needsCleaning(code)).toBe(true);
		});

		it('returns false for clean code', () => {
			const code = `const q = new solution.Queue();
expect(q.isEmpty()).toBe(true);`;
			expect(needsCleaning(code)).toBe(false);
		});
	});

	describe('cleanTestCode', () => {
		it('removes import statements', () => {
			const code = `import { describe, it, expect } from 'vitest';
import { Queue } from './queue';
const q = new Queue();
expect(q.isEmpty()).toBe(true);`;

			const cleaned = cleanTestCode(code);
			expect(cleaned).not.toContain('import');
			expect(cleaned).toContain('expect(q.isEmpty()).toBe(true)');
		});

		it('extracts body from nested describe/it blocks', () => {
			const code = `import { describe, it, expect } from 'vitest';
import { Queue } from './queue';

describe('Queue', () => {
  it('should be empty', () => {
    const q = new Queue<number>();
    expect(q.isEmpty()).toBe(true);
    expect(q.size()).toBe(0);
  });
});`;

			const cleaned = cleanTestCode(code);
			expect(cleaned).not.toContain('import');
			expect(cleaned).not.toContain('describe(');
			expect(cleaned).not.toContain('it(');
			expect(cleaned).toContain('expect(q.isEmpty()).toBe(true)');
			expect(cleaned).toContain('expect(q.size()).toBe(0)');
		});

		it('fixes Queue -> solution.Queue references', () => {
			const code = `const q = new Queue<number>();
q.enqueue(1);`;

			const cleaned = cleanTestCode(code);
			expect(cleaned).toContain('new solution.Queue<number>()');
		});

		it('does not double-prefix solution.Queue', () => {
			const code = `const q = new solution.Queue<number>();
q.enqueue(1);`;

			const cleaned = cleanTestCode(code);
			expect(cleaned).toContain('new solution.Queue<number>()');
			expect(cleaned).not.toContain('solution.solution.');
		});

		it('handles real-world bad testCode from AI', () => {
			const code = `import { describe, it, expect } from 'vitest';
import { Queue } from './queue';

describe('Stage 1: Array-based FIFO Queue', () => {
  it('starts empty with size 0', () => {
    const q = new Queue<number>();
    expect(q.isEmpty()).toBe(true);
    expect(q.size()).toBe(0);
  });

  it('enqueue increases size', () => {
    const q = new Queue<string>();
    q.enqueue('a');
    expect(q.size()).toBe(1);
  });
});`;

			const cleaned = cleanTestCode(code);
			expect(cleaned).not.toContain('import');
			expect(cleaned).not.toContain('describe(');
			// Should get content from innermost it block
			expect(cleaned).toContain('solution.Queue');
		});

		it('preserves already-clean code', () => {
			const code = `const q = new solution.Queue<number>();
q.enqueue(1);
q.enqueue(2);
expect(q.dequeue()).toBe(1);
expect(q.dequeue()).toBe(2);`;

			const cleaned = cleanTestCode(code);
			expect(cleaned).toBe(code);
		});

		it('does not prefix built-in globals like Promise, Map, Set', () => {
			const code = `const p = new Promise((resolve) => setTimeout(resolve, 100));
const m = new Map<string, number>();
const s = new Set<string>();
await p;`;

			const cleaned = cleanTestCode(code);
			expect(cleaned).toContain('new Promise(');
			expect(cleaned).toContain('new Map<');
			expect(cleaned).toContain('new Set<');
			expect(cleaned).not.toContain('solution.Promise');
			expect(cleaned).not.toContain('solution.Map');
			expect(cleaned).not.toContain('solution.Set');
		});

		it('prefixes user classes but not built-in globals in the same code', () => {
			const code = `const q = new Queue<number>();
const p = new Promise((r) => setTimeout(r, 50));
await p;`;

			const cleaned = cleanTestCode(code);
			expect(cleaned).toContain('new solution.Queue<number>()');
			expect(cleaned).toContain('new Promise(');
			expect(cleaned).not.toContain('solution.Promise');
		});
	});
});
