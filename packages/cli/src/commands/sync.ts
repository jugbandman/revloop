import { Command } from 'commander';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { TodayManager } from '@revloop/core';
import type { PriorityTask, NotionTask, LinearIssue } from '@revloop/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = resolve(__dirname, '../../../../data');

export const syncCommand = new Command('sync')
  .description('Sync tasks to Linear and Notion');

// sync notion - push human tasks to Notion
syncCommand
  .command('notion')
  .description('Push human tasks to Notion')
  .option('-d, --data-dir <dir>', 'Data directory', DEFAULT_DATA_DIR)
  .option('--dry-run', 'Show what would be synced without actually syncing')
  .action(async (options) => {
    try {
      const manager = new TodayManager(options.dataDir);
      const todayData = await manager.readCurrent();

      if (!todayData) {
        console.log(chalk.yellow('No today.md found. Run `revloop today new` first.'));
        return;
      }

      // Filter tasks for Notion (human + follow-up)
      const notionTasks = todayData.priorityStack.filter(
        t => (t.taskType === 'human' || t.taskType === 'follow-up') && !t.notionTaskId
      );

      if (notionTasks.length === 0) {
        console.log(chalk.green('✅ All human tasks already synced to Notion.'));
        return;
      }

      console.log(chalk.blue(`\n📋 Found ${notionTasks.length} tasks to sync to Notion:\n`));

      // Convert to Notion format and display
      const notionPayloads: NotionTask[] = notionTasks.map(t => ({
        name: t.task,
        description: t.successCriteria,
        status: 'Ready to Pull',
        priority: mapPriorityToNotion(t),
        focus: 'TODAY',
        estimate: t.estimated || 'Quick Task',
        tags: t.taskType === 'follow-up' ? ['follow-up'] : undefined,
      }));

      notionPayloads.forEach((task, i) => {
        console.log(chalk.white(`${i + 1}. ${task.name}`));
        console.log(chalk.gray(`   Priority: ${task.priority} | Focus: ${task.focus} | Estimate: ${task.estimate}`));
        if (task.tags) console.log(chalk.gray(`   Tags: ${task.tags.join(', ')}`));
      });

      if (options.dryRun) {
        console.log(chalk.yellow('\n[DRY RUN] Would create these tasks in Notion'));
        console.log(chalk.gray('\nTo actually sync, run without --dry-run'));
        return;
      }

      // TODO: Actually call Notion API via MCP
      console.log(chalk.yellow('\n⚠️  Notion API integration coming soon.'));
      console.log(chalk.gray('For now, copy tasks manually or use the Notion MCP in Claude.\n'));

      // Print as copyable format
      console.log(chalk.blue('📋 Copy-paste format for Notion:\n'));
      notionPayloads.forEach(task => {
        console.log(`- [ ] ${task.name}`);
      });

    } catch (error) {
      console.error(chalk.red('Error syncing to Notion:'));
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// sync linear - push coding tasks to Linear
syncCommand
  .command('linear')
  .description('Push coding tasks to Linear')
  .option('-d, --data-dir <dir>', 'Data directory', DEFAULT_DATA_DIR)
  .option('--dry-run', 'Show what would be synced without actually syncing')
  .action(async (options) => {
    try {
      const manager = new TodayManager(options.dataDir);
      const todayData = await manager.readCurrent();

      if (!todayData) {
        console.log(chalk.yellow('No today.md found. Run `revloop today new` first.'));
        return;
      }

      // Filter tasks for Linear (coding only, not already synced)
      const linearTasks = todayData.priorityStack.filter(
        t => t.taskType === 'coding' && !t.linearIssueId
      );

      if (linearTasks.length === 0) {
        console.log(chalk.green('✅ All coding tasks already synced to Linear.'));
        return;
      }

      console.log(chalk.blue(`\n💻 Found ${linearTasks.length} tasks to sync to Linear:\n`));

      // Convert to Linear format and display
      const linearPayloads = linearTasks.map(t => ({
        title: t.task,
        description: t.successCriteria,
        project: t.project || 'RevLoop',
        priority: mapPriorityToLinear(t),
        estimate: mapEstimateToLinear(t.estimated),
        labels: ['from-today'],
      }));

      linearPayloads.forEach((task, i) => {
        console.log(chalk.white(`${i + 1}. ${task.title}`));
        console.log(chalk.gray(`   Project: ${task.project} | Priority: ${task.priority} | Estimate: ${task.estimate || 'None'}`));
      });

      if (options.dryRun) {
        console.log(chalk.yellow('\n[DRY RUN] Would create these issues in Linear'));
        console.log(chalk.gray('\nTo actually sync, run without --dry-run'));
        return;
      }

      // TODO: Actually call Linear API
      console.log(chalk.yellow('\n⚠️  Linear API integration coming soon.'));
      console.log(chalk.gray('For now, copy tasks manually or use Linear directly.\n'));

      // Print as copyable format
      console.log(chalk.blue('📋 Copy-paste format for Linear:\n'));
      linearPayloads.forEach(task => {
        console.log(`[${task.project}] ${task.title}`);
        if (task.description) console.log(chalk.gray(`  ${task.description}`));
      });

    } catch (error) {
      console.error(chalk.red('Error syncing to Linear:'));
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// sync all - sync to both Linear and Notion
syncCommand
  .command('all')
  .description('Sync all tasks to both Linear and Notion')
  .option('-d, --data-dir <dir>', 'Data directory', DEFAULT_DATA_DIR)
  .option('--dry-run', 'Show what would be synced without actually syncing')
  .action(async (options) => {
    console.log(chalk.blue('🔄 Syncing to Linear...\n'));
    await syncCommand.commands.find(c => c.name() === 'linear')?.parseAsync(['node', 'sync', 'linear', ...(options.dryRun ? ['--dry-run'] : []), '-d', options.dataDir]);

    console.log(chalk.blue('\n🔄 Syncing to Notion...\n'));
    await syncCommand.commands.find(c => c.name() === 'notion')?.parseAsync(['node', 'sync', 'notion', ...(options.dryRun ? ['--dry-run'] : []), '-d', options.dataDir]);
  });

// sync status - show sync status
syncCommand
  .command('status')
  .description('Show sync status for all tasks')
  .option('-d, --data-dir <dir>', 'Data directory', DEFAULT_DATA_DIR)
  .action(async (options) => {
    try {
      const manager = new TodayManager(options.dataDir);
      const todayData = await manager.readCurrent();

      if (!todayData) {
        console.log(chalk.yellow('No today.md found.'));
        return;
      }

      const coding = todayData.priorityStack.filter(t => t.taskType === 'coding');
      const human = todayData.priorityStack.filter(t => t.taskType === 'human');
      const followup = todayData.priorityStack.filter(t => t.taskType === 'follow-up');

      const codingSynced = coding.filter(t => t.linearIssueId).length;
      const humanSynced = human.filter(t => t.notionTaskId).length;
      const followupSynced = followup.filter(t => t.notionTaskId).length;

      console.log(chalk.bold('\n📊 Sync Status\n'));
      console.log(chalk.yellow(`💻 Linear (coding): ${codingSynced}/${coding.length} synced`));
      console.log(chalk.cyan(`👤 Notion (human): ${humanSynced}/${human.length} synced`));
      console.log(chalk.magenta(`📅 Notion (follow-up): ${followupSynced}/${followup.length} synced`));

      const totalTasks = todayData.priorityStack.length;
      const totalSynced = codingSynced + humanSynced + followupSynced;
      const needsSync = totalTasks - totalSynced;

      if (needsSync > 0) {
        console.log(chalk.yellow(`\n⚠️  ${needsSync} tasks need syncing. Run \`revloop sync all\``));
      } else {
        console.log(chalk.green('\n✅ All tasks synced!'));
      }

    } catch (error) {
      console.error(chalk.red('Error checking status:'));
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Helper functions
function mapPriorityToNotion(task: PriorityTask): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (task.type === 'primary') return 'HIGH';
  if (task.type === 'parallel') return 'MEDIUM';
  return 'LOW';
}

function mapPriorityToLinear(task: PriorityTask): 1 | 2 | 3 | 4 {
  if (task.type === 'primary') return 2; // High
  if (task.type === 'parallel') return 3; // Medium
  return 4; // Low
}

function mapEstimateToLinear(estimate?: string): number | undefined {
  if (!estimate) return undefined;
  const lower = estimate.toLowerCase();
  if (lower.includes('quick')) return 1;
  if (lower.includes('short')) return 2;
  if (lower.includes('medium')) return 4;
  if (lower.includes('deep')) return 8;
  return undefined;
}
