import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { TranscriptProcessor, TodayManager } from '@revloop/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = resolve(__dirname, '../../../../data');

export const processCommand = new Command('process')
  .description('Process a transcript file and extract tasks')
  .argument('<file>', 'Path to transcript file')
  .option('-o, --output <file>', 'Output JSON to file instead of stdout')
  .option('-d, --data-dir <dir>', 'Data directory for history', DEFAULT_DATA_DIR)
  .option('--no-history', 'Skip checking previous today.md for deduplication')
  .action(async (file: string, options) => {
    try {
      console.log(chalk.blue('📝 Processing transcript...'));

      // Read transcript file
      const transcriptPath = resolve(process.cwd(), file);
      const rawTranscript = await readFile(transcriptPath, 'utf-8');

      console.log(chalk.gray(`   File: ${transcriptPath}`));
      console.log(chalk.gray(`   Length: ${rawTranscript.length} characters`));

      // Get previous today.md for context (deduplication)
      let previousContent: string | undefined;
      if (options.history !== false) {
        const manager = new TodayManager(options.dataDir);
        previousContent = await manager.readCurrentRaw() || undefined;
        if (previousContent) {
          console.log(chalk.gray('   Using previous today.md for deduplication'));
        }
      }

      // Process with Claude
      console.log(chalk.blue('🤖 Analyzing with Claude...'));
      const processor = new TranscriptProcessor();
      const result = await processor.process(rawTranscript, previousContent);

      // Summary
      console.log(chalk.green('\n✅ Extraction complete!\n'));
      console.log(chalk.white(`Type: ${result.type}`));
      console.log(chalk.white(`Tasks found: ${result.tasks.length}`));

      // Task breakdown
      const coding = result.tasks.filter(t => t.taskType === 'coding');
      const human = result.tasks.filter(t => t.taskType === 'human');
      const followup = result.tasks.filter(t => t.taskType === 'follow-up');

      if (coding.length > 0) {
        console.log(chalk.yellow(`\n📦 Coding tasks (→ Linear): ${coding.length}`));
        coding.forEach(t => {
          const project = t.project ? chalk.gray(` [${t.project}]`) : '';
          console.log(`   • ${t.title}${project}`);
        });
      }

      if (human.length > 0) {
        console.log(chalk.cyan(`\n👤 Human tasks (→ Notion): ${human.length}`));
        human.forEach(t => {
          console.log(`   • ${t.title}`);
        });
      }

      if (followup.length > 0) {
        console.log(chalk.magenta(`\n📅 Follow-ups (→ Notion + Date): ${followup.length}`));
        followup.forEach(t => {
          const date = t.dueDate ? chalk.gray(` (${t.dueDate})`) : '';
          console.log(`   • ${t.title}${date}`);
        });
      }

      // Output
      if (options.output) {
        const outputPath = resolve(process.cwd(), options.output);
        await writeFile(outputPath, JSON.stringify(result, null, 2));
        console.log(chalk.green(`\n📄 Output written to: ${outputPath}`));
      } else {
        console.log(chalk.gray('\n--- JSON Output ---'));
        console.log(JSON.stringify(result, null, 2));
      }

      // Save raw transcript
      const manager = new TodayManager(options.dataDir);
      const savedPath = await manager.saveTranscript(rawTranscript, result.type);
      console.log(chalk.gray(`\n📁 Transcript saved: ${savedPath}`));

    } catch (error) {
      console.error(chalk.red('Error processing transcript:'));
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
