import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { TranscriptProcessor, TodayManager, TodayParser } from '@revloop/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = resolve(__dirname, '../../../../data');

export const todayCommand = new Command('today')
  .description('Manage today.md files');

// today new - create new today.md from transcript
todayCommand
  .command('new')
  .description('Create new today.md from a transcript')
  .argument('[file]', 'Path to transcript file (or reads from stdin)')
  .option('-d, --data-dir <dir>', 'Data directory', DEFAULT_DATA_DIR)
  .action(async (file: string | undefined, options) => {
    try {
      const manager = new TodayManager(options.dataDir);
      await manager.ensureDirectories();

      // Read transcript
      let rawTranscript: string;
      if (file) {
        const transcriptPath = resolve(process.cwd(), file);
        rawTranscript = await readFile(transcriptPath, 'utf-8');
        console.log(chalk.blue(`📝 Reading transcript from: ${transcriptPath}`));
      } else {
        // Read from stdin
        console.log(chalk.blue('📝 Reading transcript from stdin...'));
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk);
        }
        rawTranscript = Buffer.concat(chunks).toString('utf-8');
      }

      // Process transcript
      console.log(chalk.blue('🤖 Processing with Claude...'));
      const processor = new TranscriptProcessor();
      const previousContent = await manager.readCurrentRaw() || undefined;
      const processed = await processor.process(rawTranscript, previousContent);

      // Create new today.md
      console.log(chalk.blue('📄 Creating today.md...'));
      const todayData = await manager.createFromTranscript(processed);

      // Summary
      console.log(chalk.green('\n✅ Created today.md'));
      console.log(chalk.white(`   Date: ${todayData.date}`));
      console.log(chalk.white(`   Tasks: ${todayData.priorityStack.length}`));

      const primary = todayData.priorityStack.filter(t => t.type === 'primary');
      const parallel = todayData.priorityStack.filter(t => t.type === 'parallel');
      const quickWins = todayData.priorityStack.filter(t => t.type === 'quick-win');

      if (primary.length > 0) {
        console.log(chalk.yellow(`\n🎯 Primary Focus (${primary.length}):`));
        primary.forEach(t => console.log(`   • ${t.task}`));
      }
      if (parallel.length > 0) {
        console.log(chalk.cyan(`\n⏳ Parallel Work (${parallel.length}):`));
        parallel.forEach(t => console.log(`   • ${t.task}`));
      }
      if (quickWins.length > 0) {
        console.log(chalk.magenta(`\n⚡ Quick Wins (${quickWins.length}):`));
        quickWins.forEach(t => console.log(`   • ${t.task}`));
      }

      if (todayData.yesterdayReview.stillInProgress.length > 0) {
        console.log(chalk.gray(`\n📋 Carried over from yesterday: ${todayData.yesterdayReview.stillInProgress.length} items`));
      }

      console.log(chalk.green(`\n📁 File: ${manager.currentTodayPath}`));

    } catch (error) {
      console.error(chalk.red('Error creating today.md:'));
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// today update - update existing today.md with more tasks
todayCommand
  .command('update')
  .description('Update today.md with additional tasks from transcript')
  .argument('<file>', 'Path to transcript file')
  .option('-d, --data-dir <dir>', 'Data directory', DEFAULT_DATA_DIR)
  .action(async (file: string, options) => {
    try {
      const manager = new TodayManager(options.dataDir);

      // Read transcript
      const transcriptPath = resolve(process.cwd(), file);
      const rawTranscript = await readFile(transcriptPath, 'utf-8');
      console.log(chalk.blue(`📝 Reading transcript from: ${transcriptPath}`));

      // Process transcript
      console.log(chalk.blue('🤖 Processing with Claude...'));
      const processor = new TranscriptProcessor();
      const previousContent = await manager.readCurrentRaw() || undefined;
      const processed = await processor.process(rawTranscript, previousContent);

      // Update today.md
      console.log(chalk.blue('📄 Updating today.md...'));
      const todayData = await manager.updateFromTranscript(processed);

      console.log(chalk.green('\n✅ Updated today.md'));
      console.log(chalk.white(`   Tasks now: ${todayData.priorityStack.length}`));
      console.log(chalk.white(`   New tasks added: ${processed.tasks.length}`));

      console.log(chalk.green(`\n📁 File: ${manager.currentTodayPath}`));

    } catch (error) {
      console.error(chalk.red('Error updating today.md:'));
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// today show - display current today.md
todayCommand
  .command('show')
  .description('Display current today.md')
  .option('-d, --data-dir <dir>', 'Data directory', DEFAULT_DATA_DIR)
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const manager = new TodayManager(options.dataDir);
      const todayData = await manager.readCurrent();

      if (!todayData) {
        console.log(chalk.yellow('No today.md found. Run `revloop today new` to create one.'));
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(todayData, null, 2));
        return;
      }

      // Pretty print
      console.log(chalk.bold.white(`\n📅 Today - ${todayData.date}\n`));

      console.log(chalk.bold('⏰ Life Context:'));
      console.log(`   Time: ${todayData.lifeContext.timeAvailable}`);
      if (todayData.lifeContext.keyConstraints.length > 0) {
        console.log('   Constraints:');
        todayData.lifeContext.keyConstraints.forEach(c => console.log(`     • ${c}`));
      }

      const incomplete = todayData.priorityStack.filter(t => !t.completed);
      const completed = todayData.priorityStack.filter(t => t.completed);

      if (incomplete.length > 0) {
        console.log(chalk.bold('\n📋 Tasks To Do:'));
        incomplete.forEach(t => {
          const typeIcon = t.taskType === 'coding' ? '💻' : t.taskType === 'follow-up' ? '📅' : '👤';
          const typeLabel = t.type === 'primary' ? chalk.yellow('[PRIMARY]') : t.type === 'parallel' ? chalk.cyan('[PARALLEL]') : chalk.gray('[QUICK]');
          console.log(`   ${typeIcon} ${typeLabel} ${t.task}`);
        });
      }

      if (completed.length > 0) {
        console.log(chalk.bold.green('\n✅ Completed:'));
        completed.forEach(t => console.log(chalk.gray(`   ✓ ${t.task}`)));
      }

      // Stats
      const coding = todayData.priorityStack.filter(t => t.taskType === 'coding');
      const human = todayData.priorityStack.filter(t => t.taskType === 'human');

      console.log(chalk.gray(`\n--- ${coding.length} coding → Linear | ${human.length} human → Notion ---`));

    } catch (error) {
      console.error(chalk.red('Error reading today.md:'));
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// today archive - archive current and start fresh
todayCommand
  .command('archive')
  .description('Archive current today.md')
  .option('-d, --data-dir <dir>', 'Data directory', DEFAULT_DATA_DIR)
  .action(async (options) => {
    try {
      const manager = new TodayManager(options.dataDir);
      const current = await manager.readCurrent();

      if (!current) {
        console.log(chalk.yellow('No today.md to archive.'));
        return;
      }

      await manager.archiveCurrent();
      console.log(chalk.green(`✅ Archived today.md for ${current.date}`));

    } catch (error) {
      console.error(chalk.red('Error archiving:'));
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// today history - list previous today files
todayCommand
  .command('history')
  .description('List previous today.md files')
  .option('-d, --data-dir <dir>', 'Data directory', DEFAULT_DATA_DIR)
  .option('-n, --limit <number>', 'Number of files to show', '7')
  .action(async (options) => {
    try {
      const manager = new TodayManager(options.dataDir);
      const files = await manager.listHistory(parseInt(options.limit));

      if (files.length === 0) {
        console.log(chalk.yellow('No history found.'));
        return;
      }

      console.log(chalk.bold('\n📚 Today.md History:\n'));
      for (const file of files) {
        const date = file.replace('.md', '');
        const data = await manager.readByDate(date);
        const taskCount = data?.priorityStack.length || 0;
        const completed = data?.priorityStack.filter(t => t.completed).length || 0;
        console.log(`   ${date} - ${taskCount} tasks (${completed} completed)`);
      }

    } catch (error) {
      console.error(chalk.red('Error reading history:'));
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
