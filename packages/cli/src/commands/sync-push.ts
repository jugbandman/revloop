import { Command } from 'commander';
import { promises as fs } from 'fs';
import { readdir, stat } from 'fs/promises';
import { resolve, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';
import { NotionClient, NotionPusher } from '@revloop/notion-sync';
import type { NotionConfig, EnhancedMeeting } from '@revloop/notion-sync';
import type { EnhancedMeeting as CoreEnhancedMeeting } from '@revloop/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = resolve(__dirname, '../../../../data');

function getNotionConfig(): NotionConfig {
  const apiKey = process.env.NOTION_API_KEY;
  const clientContextDbId = process.env.NOTION_CLIENT_CONTEXT_DB_ID;
  const transcriptsDbId = process.env.NOTION_TRANSCRIPTS_DB_ID;
  const meetingsDbId = process.env.NOTION_MEETINGS_DB_ID;

  if (!apiKey || !clientContextDbId || !transcriptsDbId || !meetingsDbId) {
    throw new Error(
      'Missing Notion configuration. Please set:\n' +
      '  NOTION_API_KEY\n' +
      '  NOTION_CLIENT_CONTEXT_DB_ID\n' +
      '  NOTION_TRANSCRIPTS_DB_ID\n' +
      '  NOTION_MEETINGS_DB_ID\n' +
      '\nSee README.md for setup instructions.'
    );
  }

  return {
    apiKey,
    clientContextDbId,
    transcriptsDbId,
    meetingsDbId,
  };
}

async function loadEnhancedMeeting(filePath: string): Promise<CoreEnhancedMeeting | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(chalk.yellow(`Warning: Could not parse ${filePath}:`, error));
    return null;
  }
}

export const syncPushCommand = new Command('push')
  .description('Push enhanced meetings and updates to Notion')
  .option('-d, --data-dir <dir>', 'Data directory', DEFAULT_DATA_DIR)
  .option('--meetings', 'Push only enhanced meetings')
  .option('--action-items', 'Push only action items')
  .option('--all', 'Push everything (default)')
  .option('--dry-run', 'Show what would be pushed without actually pushing')
  .action(async (options) => {
    try {
      const config = getNotionConfig();
      const client = new NotionClient(config);
      const pusher = new NotionPusher(client, options.dataDir);

      const pushMeetings = options.meetings || options.all || (!options.actionItems);
      const pushActionItems = options.actionItems || options.all || (!options.meetings);

      if (pushMeetings) {
        console.log(chalk.blue('\n📤 Pushing enhanced meetings to Notion...\n'));
        
        const meetingsDir = join(options.dataDir, 'meetings');
        let pushed = 0;
        let skipped = 0;

        try {
          const files = await readdir(meetingsDir);
          const meetingFiles = files.filter(f => extname(f) === '.json');

          for (const file of meetingFiles) {
            const filePath = join(meetingsDir, file);
            const meeting = await loadEnhancedMeeting(filePath);

            if (!meeting) {
              skipped++;
              continue;
            }

            if (options.dryRun) {
              console.log(chalk.gray(`[DRY RUN] Would push: ${meeting.metadata.title}`));
              if (meeting.metadata.company) {
                console.log(chalk.gray(`  Company: ${meeting.metadata.company}`));
              }
              pushed++;
            } else {
              const notionId = await pusher.pushEnhancedMeeting(
                meeting as any,
                filePath
              );

              if (notionId) {
                console.log(chalk.green(`✅ Pushed: ${meeting.metadata.title}`));
                await pusher.updateSyncMappingAfterPush(filePath, notionId, 'meeting');
                pushed++;
              } else {
                console.log(chalk.yellow(`⚠️  Failed to push: ${meeting.metadata.title}`));
                skipped++;
              }
            }
          }

          console.log(chalk.green(`\n✅ Pushed ${pushed} meetings${skipped > 0 ? `, skipped ${skipped}` : ''}`));
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            console.log(chalk.yellow('No meetings directory found. Run workflows to create enhanced meetings first.'));
          } else {
            throw error;
          }
        }
      }

      if (pushActionItems) {
        console.log(chalk.blue('\n📤 Action items are included in enhanced meetings.\n'));
        console.log(chalk.gray('Action items are pushed as part of enhanced meeting notes.'));
      }

      if (!options.dryRun) {
        console.log(chalk.green('\n✨ Push complete!'));
        console.log(chalk.gray('Your enhanced content is now available in Notion.'));
      } else {
        console.log(chalk.yellow('\n[DRY RUN] No changes were made. Run without --dry-run to push.'));
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Error pushing to Notion:'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
        if (error.stack && process.env.DEBUG) {
          console.error(chalk.gray(error.stack));
        }
      } else {
        console.error(error);
      }
      process.exit(1);
    }
  });
