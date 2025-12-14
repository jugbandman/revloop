import { promises as fs } from 'fs';
import { join } from 'path';
import { NotionClient } from './notion-client.js';
import type { EnhancedMeeting, ActionItem } from '@revloop/core';

export class NotionPusher {
  private client: NotionClient;
  private dataDir: string;

  constructor(client: NotionClient, dataDir: string) {
    this.client = client;
    this.dataDir = dataDir;
  }

  /**
   * Push enhanced meeting notes to Notion
   */
  async pushEnhancedMeeting(
    meeting: EnhancedMeeting,
    localFilePath: string
  ): Promise<string | null> {
    const dbIds = this.client.getDatabaseIds();
    const companyName = meeting.metadata.company;

    // Find or create company page in client-context database
    let companyPageId: string | undefined;
    if (companyName) {
      companyPageId = await this.findOrCreateCompanyPage(companyName);
    }

    // Prepare properties
    const properties: any = {
      Title: this.client.createTitle(meeting.metadata.title),
      'Call Type': this.client.createSelect(meeting.metadata.callType),
      Summary: this.client.createRichText(meeting.summary),
      'Local File Path': this.client.createRichText(localFilePath),
    };

    if (companyPageId) {
      properties.Company = this.client.createRelation([companyPageId]);
    }

    if (meeting.buyerSignals) {
      const signalsText = this.formatBuyerSignals(meeting.buyerSignals);
      properties['Buyer Signals'] = this.client.createRichText(signalsText);
    }

    if (meeting.dealHealth) {
      const healthText = this.formatDealHealth(meeting.dealHealth);
      properties['Deal Health'] = this.client.createRichText(healthText);
    }

    // Create action items if any
    if (meeting.actionItems && meeting.actionItems.length > 0) {
      // For now, we'll store action items as text
      // In a full implementation, you might create separate action item pages
      const actionItemsText = meeting.actionItems
        .map((ai) => `- ${ai.person}: ${ai.commitment}${ai.deadline ? ` (by ${ai.deadline})` : ''}`)
        .join('\n');
      properties['Action Items'] = this.client.createRichText(actionItemsText);
    }

    try {
      const page = await this.client.createPage(dbIds.meetings, properties);
      return page.id;
    } catch (error) {
      console.error('Error creating enhanced meeting in Notion:', error);
      return null;
    }
  }

  /**
   * Update client context with enhanced content
   */
  async updateClientContext(
    companyName: string,
    enhancedContent: string
  ): Promise<boolean> {
    const dbIds = this.client.getDatabaseIds();
    
    // Find the company page
    const pages = await this.client.queryDatabase(dbIds.clientContext, {
      property: 'Company',
      title: { equals: companyName },
    });

    if (pages.length === 0) {
      console.warn(`No client context found for company: ${companyName}`);
      return false;
    }

    // Update the most recent active page
    const activePages = pages.filter((p: any) => {
      const status = this.client.extractSelect(p.properties.Status);
      return status === 'active';
    });

    const pageToUpdate = activePages[0] || pages[0];

    try {
      await this.client.updatePage(pageToUpdate.id, {
        'Enhanced Content': this.client.createRichText(enhancedContent),
        'Last Synced': this.client.createDate(new Date().toISOString()),
      });
      return true;
    } catch (error) {
      console.error(`Error updating client context for ${companyName}:`, error);
      return false;
    }
  }

  /**
   * Push action items to Notion
   */
  async pushActionItems(
    actionItems: ActionItem[],
    meetingTitle: string,
    companyName?: string
  ): Promise<string[]> {
    const createdIds: string[] = [];

    // For now, we'll attach action items to the enhanced meeting
    // In a full implementation, you might create a separate action items database
    for (const item of actionItems) {
      const actionText = `${item.person}: ${item.commitment}${item.deadline ? ` (by ${item.deadline})` : ''}`;
      
      // This is a simplified implementation
      // In production, you'd create proper action item pages
      createdIds.push(actionText); // Placeholder
    }

    return createdIds;
  }

  /**
   * Find or create a company page in client-context database
   */
  private async findOrCreateCompanyPage(companyName: string): Promise<string | undefined> {
    const dbIds = this.client.getDatabaseIds();
    
    // Try to find existing company page
    const pages = await this.client.queryDatabase(dbIds.clientContext, {
      property: 'Company',
      title: { equals: companyName },
    });

    if (pages.length > 0) {
      return pages[0].id;
    }

    // Create new company page
    try {
      const page = await this.client.createPage(dbIds.clientContext, {
        Company: this.client.createTitle(companyName),
        Status: this.client.createSelect('active'),
      });
      return page.id;
    } catch (error) {
      console.error(`Error creating company page for ${companyName}:`, error);
      return undefined;
    }
  }

  /**
   * Format buyer signals for Notion
   */
  private formatBuyerSignals(signals: any): string {
    const parts: string[] = [];
    if (signals.metrics) parts.push(`Metrics: ${signals.metrics}`);
    if (signals.economicBuyer) parts.push(`Economic Buyer: ${signals.economicBuyer}`);
    if (signals.decisionCriteria) parts.push(`Decision Criteria: ${signals.decisionCriteria}`);
    if (signals.decisionProcess) parts.push(`Decision Process: ${signals.decisionProcess}`);
    if (signals.pain) parts.push(`Pain: ${signals.pain}`);
    if (signals.champion) parts.push(`Champion: ${signals.champion}`);
    return parts.join('\n\n');
  }

  /**
   * Format deal health for Notion
   */
  private formatDealHealth(health: any): string {
    const parts: string[] = [];
    if (health.sentiment) parts.push(`Sentiment: ${health.sentiment}`);
    if (health.sentimentContext) parts.push(`Context: ${health.sentimentContext}`);
    if (health.momentum) parts.push(`Momentum: ${health.momentum}`);
    if (health.riskFactors && health.riskFactors.length > 0) {
      parts.push(`Risk Factors:\n${health.riskFactors.map((rf: string) => `- ${rf}`).join('\n')}`);
    }
    return parts.join('\n\n');
  }

  /**
   * Update sync mapping after push
   */
  async updateSyncMappingAfterPush(
    localPath: string,
    notionId: string,
    type: 'client-context' | 'transcript' | 'meeting'
  ) {
    const mappingPath = join(this.dataDir, 'sync-mapping.json');
    let mappings: any[] = [];

    try {
      const content = await fs.readFile(mappingPath, 'utf-8');
      mappings = JSON.parse(content);
    } catch {
      // File doesn't exist, start fresh
    }

    const existing = mappings.findIndex((m: any) => m.localPath === localPath);
    const mapping = {
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
