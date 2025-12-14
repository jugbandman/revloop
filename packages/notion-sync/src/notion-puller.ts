import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { NotionClient } from './notion-client.js';
import type {
  NotionClientContext,
  NotionTranscript,
  ClientContextFile,
  EmailFile,
  SyncMapping,
} from './notion-types.js';
import { EnhancedMeeting } from '@revloop/core';

export class NotionPuller {
  private client: NotionClient;
  private dataDir: string;

  constructor(client: NotionClient, dataDir: string) {
    this.client = client;
    this.dataDir = dataDir;
  }

  /**
   * Pull all client context from Notion to local files
   */
  async pullClientContext(): Promise<{ pulled: number; updated: number }> {
    const dbIds = this.client.getDatabaseIds();
    const pages = await this.client.queryDatabase(dbIds.clientContext, {
      property: 'Status',
      select: { equals: 'active' },
    });

    let pulled = 0;
    let updated = 0;

    // Group by company
    const byCompany = new Map<string, NotionClientContext[]>();

    for (const page of pages) {
      const context = this.parseClientContextPage(page);
      if (!context) continue;

      const company = this.sanitizeCompanyName(context.company);
      if (!byCompany.has(company)) {
        byCompany.set(company, []);
      }
      byCompany.get(company)!.push(context);
    }

    // Create files for each company
    for (const [company, contexts] of byCompany.entries()) {
      const companyDir = join(this.dataDir, 'clients', company);
      const emailsDir = join(companyDir, 'emails');

      await fs.mkdir(emailsDir, { recursive: true });

      const emails: EmailFile[] = [];
      let latestNotionId: string | undefined;
      let latestSync: string | undefined;
      let contact: string | undefined;
      let label: string | undefined;

      for (const context of contexts) {
        latestNotionId = context.id;
        if (context.lastSynced) {
          const syncTime = new Date(context.lastSynced).getTime();
          if (!latestSync || syncTime > new Date(latestSync).getTime()) {
            latestSync = context.lastSynced;
          }
        }
        if (context.contact && !contact) contact = context.contact;
        if (context.label && !label) label = context.label;

        // Parse email thread (could be multiple emails)
        const emailDate = context.emailDate || new Date().toISOString().split('T')[0];
        const emailFile: EmailFile = {
          date: emailDate,
          body: context.emailThread,
          label: context.label,
          notionId: context.id,
        };

        // Try to extract subject/from/to from email body if structured
        const emailMatch = context.emailThread.match(/Subject:\s*(.+?)(?:\n|$)/i);
        if (emailMatch) emailFile.subject = emailMatch[1].trim();

        const fromMatch = context.emailThread.match(/From:\s*(.+?)(?:\n|$)/i);
        if (fromMatch) emailFile.from = fromMatch[1].trim();

        const toMatch = context.emailThread.match(/To:\s*(.+?)(?:\n|$)/i);
        if (toMatch) emailFile.to = toMatch[1].trim();

        emails.push(emailFile);

        // Write individual email file
        const emailFilename = `${emailDate}-${this.sanitizeFilename(emailFile.subject || 'email')}.md`;
        const emailPath = join(emailsDir, emailFilename);
        await fs.writeFile(emailPath, this.formatEmailFile(emailFile), 'utf-8');

        pulled++;
      }

      // Create context.json metadata file
      const contextFile: ClientContextFile = {
        company,
        emails,
        metadata: {
          notionId: latestNotionId,
          lastSynced: latestSync || new Date().toISOString(),
          contact,
          label,
        },
      };

      const contextPath = join(companyDir, 'context.json');
      const existingContext = await this.readContextFile(contextPath).catch(() => null);
      
      if (existingContext) {
        // Merge with existing
        contextFile.emails = this.mergeEmails(existingContext.emails, emails);
        updated++;
      }

      await fs.writeFile(contextPath, JSON.stringify(contextFile, null, 2), 'utf-8');

      // Create README.md for quick reference
      const readmePath = join(companyDir, 'README.md');
      await fs.writeFile(readmePath, this.generateReadme(contextFile), 'utf-8');
    }

    return { pulled, updated };
  }

  /**
   * Pull all transcripts from Notion to local files
   */
  async pullTranscripts(): Promise<{ pulled: number; updated: number }> {
    const dbIds = this.client.getDatabaseIds();
    const pages = await this.client.queryDatabase(dbIds.transcripts, undefined, [
      { property: 'Date', direction: 'descending' },
    ]);

    let pulled = 0;
    let updated = 0;

    const transcriptsDir = join(this.dataDir, 'transcripts');
    await fs.mkdir(transcriptsDir, { recursive: true });

    for (const page of pages) {
      const transcript = this.parseTranscriptPage(page);
      if (!transcript) continue;

      const filename = `${transcript.date}-${this.sanitizeFilename(transcript.title)}.txt`;
      const filePath = join(transcriptsDir, filename);

      // Check if file exists and is newer
      try {
        const stats = await fs.stat(filePath);
        if (transcript.lastSynced) {
          const fileTime = stats.mtime.getTime();
          const syncTime = new Date(transcript.lastSynced).getTime();
          if (fileTime >= syncTime) {
            continue; // File is up to date
          }
        }
        updated++;
      } catch {
        pulled++;
      }

      await fs.writeFile(filePath, transcript.transcript, 'utf-8');

      // Update sync mapping
      await this.updateSyncMapping(filePath, transcript.id, 'transcript');
    }

    return { pulled, updated };
  }

  /**
   * Parse a Notion page into ClientContext
   */
  private parseClientContextPage(page: any): NotionClientContext | null {
    try {
      const props = page.properties;
      const company = this.client.extractRichText(props.Company?.title || []);
      if (!company) return null;

      return {
        id: page.id,
        company,
        contact: props.Contact?.people?.[0]?.name || props.Contact?.rich_text?.[0]?.plain_text,
        emailThread: this.client.extractRichText(props['Email Thread']?.rich_text || []),
        emailDate: this.client.extractDate(props['Email Date']) || new Date().toISOString().split('T')[0],
        label: this.client.extractSelect(props.Label) || '',
        status: (this.client.extractSelect(props.Status) as 'active' | 'archived') || 'active',
        lastSynced: this.client.extractDate(props['Last Synced']),
        localFilePath: this.client.extractRichText(props['Local File Path']?.rich_text || []),
        enhancedContent: this.client.extractRichText(props['Enhanced Content']?.rich_text || []),
        actionItems: this.client.extractRelations(props['Action Items']),
      };
    } catch (error) {
      console.error(`Error parsing client context page ${page.id}:`, error);
      return null;
    }
  }

  /**
   * Parse a Notion page into Transcript
   */
  private parseTranscriptPage(page: any): NotionTranscript | null {
    try {
      const props = page.properties;
      const title = this.client.extractRichText(props.Title?.title || []);
      if (!title) return null;

      return {
        id: page.id,
        title,
        company: this.client.extractRichText(props.Company?.title || []) || 
                 this.client.extractRelations(props.Company)?.[0],
        date: this.client.extractDate(props.Date) || new Date().toISOString().split('T')[0],
        transcript: this.client.extractRichText(props.Transcript?.rich_text || []),
        source: (this.client.extractSelect(props.Source) as any) || 'manual',
        lastSynced: this.client.extractDate(props['Last Synced']),
        localFilePath: this.client.extractRichText(props['Local File Path']?.rich_text || []),
        enhancedMeeting: this.client.extractRelations(props['Enhanced Meeting'])?.[0],
      };
    } catch (error) {
      console.error(`Error parsing transcript page ${page.id}:`, error);
      return null;
    }
  }

  /**
   * Sanitize company name for filesystem
   */
  private sanitizeCompanyName(company: string): string {
    return company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Format email file content
   */
  private formatEmailFile(email: EmailFile): string {
    let content = `# Email\n\n`;
    if (email.subject) content += `**Subject:** ${email.subject}\n\n`;
    if (email.from) content += `**From:** ${email.from}\n\n`;
    if (email.to) content += `**To:** ${email.to}\n\n`;
    if (email.date) content += `**Date:** ${email.date}\n\n`;
    if (email.label) content += `**Label:** ${email.label}\n\n`;
    if (email.notionId) content += `**Notion ID:** ${email.notionId}\n\n`;
    content += `---\n\n${email.body}`;
    return content;
  }

  /**
   * Generate README for company directory
   */
  private generateReadme(context: ClientContextFile): string {
    let content = `# ${context.company}\n\n`;
    if (context.metadata.contact) content += `**Contact:** ${context.metadata.contact}\n\n`;
    if (context.metadata.label) content += `**Label:** ${context.metadata.label}\n\n`;
    if (context.metadata.lastSynced) content += `**Last Synced:** ${context.metadata.lastSynced}\n\n`;
    content += `## Emails (${context.emails.length})\n\n`;
    for (const email of context.emails) {
      content += `- [${email.date}] ${email.subject || 'Email'}\n`;
    }
    return content;
  }

  /**
   * Read existing context file
   */
  private async readContextFile(path: string): Promise<ClientContextFile> {
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Merge emails, avoiding duplicates
   */
  private mergeEmails(existing: EmailFile[], newEmails: EmailFile[]): EmailFile[] {
    const byNotionId = new Map<string, EmailFile>();
    
    for (const email of existing) {
      if (email.notionId) {
        byNotionId.set(email.notionId, email);
      }
    }

    for (const email of newEmails) {
      if (email.notionId) {
        byNotionId.set(email.notionId, email);
      } else {
        // Add new email without notionId
        byNotionId.set(`${email.date}-${email.subject || 'email'}`, email);
      }
    }

    return Array.from(byNotionId.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
  }

  /**
   * Update sync mapping file
   */
  private async updateSyncMapping(localPath: string, notionId: string, type: 'client-context' | 'transcript' | 'meeting') {
    const mappingPath = join(this.dataDir, 'sync-mapping.json');
    let mappings: SyncMapping[] = [];

    try {
      const content = await fs.readFile(mappingPath, 'utf-8');
      mappings = JSON.parse(content);
    } catch {
      // File doesn't exist, start fresh
    }

    const existing = mappings.findIndex(m => m.localPath === localPath);
    const mapping: SyncMapping = {
      localPath,
      notionId,
      notionType: type,
      lastSynced: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    if (existing >= 0) {
      mappings[existing] = mapping;
    } else {
      mappings.push(mapping);
    }

    await fs.writeFile(mappingPath, JSON.stringify(mappings, null, 2), 'utf-8');
  }
}
