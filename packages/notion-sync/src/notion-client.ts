import { Client } from '@notionhq/client';
import type { NotionConfig } from './notion-types.js';

export class NotionClient {
  private client: Client;
  private config: NotionConfig;

  constructor(config: NotionConfig) {
    this.config = config;
    this.client = new Client({
      auth: config.apiKey,
    });
  }

  getClient() {
    return this.client;
  }

  getDatabaseIds() {
    return {
      clientContext: this.config.clientContextDbId,
      transcripts: this.config.transcriptsDbId,
      meetings: this.config.meetingsDbId,
    };
  }

  /**
   * Query a Notion database with pagination support
   */
  async queryDatabase(
    databaseId: string,
    filter?: any,
    sorts?: any[]
  ): Promise<any[]> {
    const results: any[] = [];
    let cursor: string | undefined = undefined;

    do {
      const response = await this.client.databases.query({
        database_id: databaseId,
        filter,
        sorts,
        start_cursor: cursor,
        page_size: 100,
      });

      results.push(...response.results);
      cursor = response.next_cursor || undefined;
    } while (cursor);

    return results;
  }

  /**
   * Get a single page by ID
   */
  async getPage(pageId: string) {
    return await this.client.pages.retrieve({ page_id: pageId });
  }

  /**
   * Create a page in a database
   */
  async createPage(databaseId: string, properties: any) {
    return await this.client.pages.create({
      parent: { database_id: databaseId },
      properties,
    });
  }

  /**
   * Update a page
   */
  async updatePage(pageId: string, properties: any) {
    return await this.client.pages.update({
      page_id: pageId,
      properties,
    });
  }

  /**
   * Extract text from Notion rich text array
   */
  extractRichText(richText: any[]): string {
    return richText.map((rt: any) => rt.plain_text || '').join('');
  }

  /**
   * Extract date from Notion date property
   */
  extractDate(dateProp: any): string | undefined {
    if (!dateProp || !dateProp.date) return undefined;
    return dateProp.date.start;
  }

  /**
   * Extract select value from Notion select property
   */
  extractSelect(selectProp: any): string | undefined {
    if (!selectProp || !selectProp.select) return undefined;
    return selectProp.select.name;
  }

  /**
   * Extract relation IDs from Notion relation property
   */
  extractRelations(relationProp: any): string[] {
    if (!relationProp || !relationProp.relation) return [];
    return relationProp.relation.map((r: any) => r.id);
  }

  /**
   * Create rich text property value
   */
  createRichText(text: string): any {
    return {
      rich_text: [
        {
          type: 'text',
          text: { content: text },
        },
      ],
    };
  }

  /**
   * Create title property value
   */
  createTitle(text: string): any {
    return {
      title: [
        {
          type: 'text',
          text: { content: text },
        },
      ],
    };
  }

  /**
   * Create date property value
   */
  createDate(date: string): any {
    return {
      date: { start: date },
    };
  }

  /**
   * Create select property value
   */
  createSelect(value: string): any {
    return {
      select: { name: value },
    };
  }

  /**
   * Create relation property value
   */
  createRelation(pageIds: string[]): any {
    return {
      relation: pageIds.map((id) => ({ id })),
    };
  }
}
