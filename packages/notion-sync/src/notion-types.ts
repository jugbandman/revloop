// ============================================
// NOTION SYNC TYPES
// ============================================

export interface NotionConfig {
  apiKey: string;
  clientContextDbId: string;
  transcriptsDbId: string;
  meetingsDbId: string;
}

export interface NotionClientContext {
  id: string;
  company: string;
  contact?: string;
  emailThread: string;
  emailDate: string;
  label: string;
  status: 'active' | 'archived';
  lastSynced?: string;
  localFilePath?: string;
  enhancedContent?: string;
  actionItems?: string[]; // Notion page IDs
}

export interface NotionTranscript {
  id: string;
  title: string;
  company?: string; // Company name or relation ID
  date: string;
  transcript: string;
  source: 'granola.ai' | 'manual' | 'other';
  lastSynced?: string;
  localFilePath?: string;
  enhancedMeeting?: string; // Notion page ID
}

export interface NotionEnhancedMeeting {
  id: string;
  title: string;
  company?: string; // Company name or relation ID
  callType: 'intro' | 'demo' | 'discovery' | 'pov' | 'followup' | 'technical' | 'pricing' | 'closing' | 'internal' | 'general';
  summary: string;
  buyerSignals?: string;
  dealHealth?: string;
  actionItems?: string[]; // Notion page IDs
  localFilePath?: string;
}

export interface SyncMapping {
  localPath: string;
  notionId: string;
  notionType: 'client-context' | 'transcript' | 'meeting';
  lastSynced: string;
  lastModified: string;
}

export interface ClientContextFile {
  company: string;
  emails: EmailFile[];
  metadata: {
    notionId?: string;
    lastSynced?: string;
    contact?: string;
    label?: string;
  };
}

export interface EmailFile {
  date: string;
  subject?: string;
  from?: string;
  to?: string;
  body: string;
  label?: string;
  notionId?: string;
}
