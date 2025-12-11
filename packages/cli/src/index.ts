#!/usr/bin/env node

import { Command } from 'commander';
import { processCommand } from './commands/process.js';
import { todayCommand } from './commands/today.js';
import { syncCommand } from './commands/sync.js';

const program = new Command();

program
  .name('revloop')
  .description('Productivity quarterback - voice dumps to actionable tasks')
  .version('1.0.0');

// Register commands
program.addCommand(processCommand);
program.addCommand(todayCommand);
program.addCommand(syncCommand);

program.parse();
