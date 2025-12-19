import { cleanTestCode, needsCleaning } from "../src/services/testCodeCleaner.js";

const badCode = `import { describe, it, expect } from 'vitest';
import { LinkedListQueue } from './LinkedListQueue';

describe('LinkedListQueue', () => {
  it('peeks the first item after enqueues without removing it', () => {
    const q = new LinkedListQueue<number>();
    q.enqueue(10);
    q.enqueue(20);

    expect(q.peek()).toBe(10);
    expect(q.size()).toBe(2);
  });
});`;

console.log("Needs cleaning:", needsCleaning(badCode));
console.log("\n--- Cleaned output ---\n");
console.log(cleanTestCode(badCode));
