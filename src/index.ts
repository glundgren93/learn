#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { setupCommands } from './cli/commands.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
	.name('learn')
	.description('AI-powered programming learning CLI')
	.version(pkg.version)
	.addHelpText(
		'after',
		`
Examples:
  $ learn start queues      Start learning about queues
  $ learn continue          Get the next lesson
  $ learn run               Run tests for current stage
  $ learn run -s stage-2    Rerun tests for a specific stage
  $ learn hint              Get a hint if stuck
  $ learn status            See progress across all topics

Learn any programming topic through progressive, test-driven lessons.
Work through stages by making tests pass, and get hints when stuck.`
	);

setupCommands(program);

program.parse();
