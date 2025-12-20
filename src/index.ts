#!/usr/bin/env node

import { Command } from 'commander';
import { setupCommands } from './cli/commands.js';

const program = new Command();

program.name('learn').description('AI-powered programming learning CLI').version('1.0.0');

setupCommands(program);

program.parse();
