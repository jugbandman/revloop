import { Command } from 'commander';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';
import { NotionClient, NotionPuller } from '@revloop/notion-sync';
import type { NotionConfig } from '@revloop/notion-sync';

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

export const syncPullCommand = new Command('pull')
  .description('Pull client context and transcripts from Notion to local files')
  .option('-d, --data-dir <dir>', 'Data directory', DEFAULT_DATA_DIR)
  .option('--clients', 'Pull only client context')
  .option('--transcripts', 'Pull only transcripts')
  .option('--all', 'Pull everything (default)')
  .action(async (options) => {
    try {
      const config = getNotionConfig();
      const client = new NotionClient(config);
      const puller = new NotionPuller(client, options.dataDir);

      const pullClients = options.clients || options.all || (!options.transcripts);
      const pullTranscripts = options.transcripts || options.all || (!options.clients);

      if (pullClients) {
        console.log(chalk.blue('\n📥 Pulling client context from Notion...\n'));
        const result = await puller.pullClientContext();
        console.log(chalk.green(`✅ Pulled ${result.pulled} new items, updated ${result.updated} existing items`));
      }

      if (pullTranscripts) {
        console.log(chalk.blue('\n📥 Pulling transcripts from Notion...\n'));
        const result = await puller.pullTranscripts();
        console.log(chalk.green(`✅ Pulled ${result.pulled} new transcripts, updated ${result.updated} existing transcripts`));
      }

      console.log(chalk.green('\n✨ Sync complete!'));
      console.log(chalk.gray(`\nData directory: ${options.dataDir}`));
      console.log(chalk.gray('You can now use this context in your revloop workflows.'));

    } catch (error) {
      console.error(chalk.red('\n❌ Error pulling from Notion:'));
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
