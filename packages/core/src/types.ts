// ============================================
// TODAY.MD TYPES
// ============================================

export interface TodayData {
  date: string;
  lifeContext: LifeContext;
  projects: ProjectStatus[];
  linearIssues: LinearIssueRef[];
  priorityStack: PriorityTask[];
  workBlocks: WorkBlock[];
  yesterdayReview: YesterdayReview;
  endOfDay: EndOfDayReview;
}

export interface LifeContext {
  timeAvailable: string;
  energyLevel?: number;
  keyConstraints: string[];
}

export interface ProjectStatus {
  name: string;
  repo?: string;
  branch?: string;
  status: string;
  hasUncommittedChanges?: boolean;
  hasFailingTests?: boolean;
}

export interface LinearIssueRef {
  id: string;
  title: string;
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'none';
  project?: string;
  url?: string;
}

export interface PriorityTask {
  id?: string;
  type: 'primary' | 'parallel' | 'quick-win';
  task: string;
  taskType: 'coding' | 'human' | 'follow-up';
  estimated?: string;
  successCriteria?: string;
  completed: boolean;
  linearIssueId?: string;
  notionTaskId?: string;
  project?: string;
}

export interface WorkBlock {
  timeRange: string;
  tasks: string[];
  backup?: string;
}

export interface YesterdayReview {
  planned: string[];
  actuallyHappened: string[];
  lessonsLearned: string[];
  stillInProgress: string[];
}

export interface EndOfDayReview {
  whatHappened: string[];
  whatShipped: string[];
  whatsBlocked: string[];
  tomorrowPriority: string;
}

// ============================================
// TRANSCRIPT PROCESSING TYPES
// ============================================

export type TranscriptType = 'brain-dump' | 'customer-meeting' | 'internal-meeting';

export interface ProcessedTranscript {
  type: TranscriptType;
  date: string;
  rawContent: string;
  tasks: ExtractedTask[];
  meetingMetadata?: MeetingMetadata;
  processedAt: string;
}

export interface ExtractedTask {
  title: string;
  description?: string;
  taskType: 'coding' | 'human' | 'follow-up';
  priority: 'high' | 'medium' | 'low';
  estimate?: string;
  project?: string;
  dueDate?: string;
  context?: string;
  // Routing flags
  shouldCreateLinear: boolean;
  shouldCreateNotion: boolean;
}

export interface MeetingMetadata {
  title: string;
  company?: string;
  participants: string[];
  duration?: number;
  callType: 'intro' | 'demo' | 'pov' | 'followup' | 'technical' | 'pricing' | 'closing' | 'internal' | 'general';
  recordingUrl?: string;
}

// ============================================
// MEETING ENHANCEMENT TYPES (for sales use case)
// ============================================

export interface EnhancedMeeting {
  metadata: MeetingMetadata;
  summary: string;
  actionItems: ActionItem[];
  keyQuotes: Quote[];
  buyerSignals?: BuyerSignals;
  dealHealth?: DealHealth;
  fullTranscript: string;
  processedAt: string;
}

export interface ActionItem {
  person: string;
  commitment: string;
  deadline?: string;
  completed: boolean;
}

export interface Quote {
  text: string;
  speaker: string;
  role?: string;
  context?: string;
}

export interface BuyerSignals {
  metrics?: string;
  economicBuyer?: string;
  decisionCriteria?: string;
  decisionProcess?: string;
  pain?: string;
  champion?: string;
}

export interface DealHealth {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentContext: string;
  momentum: 'accelerating' | 'steady' | 'stalling';
  riskFactors: string[];
}

// ============================================
// INTEGRATION TYPES
// ============================================

export interface NotionTask {
  name: string;
  description?: string;
  status: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  focus: 'TODAY' | 'THIS_WEEK' | 'LATER';
  estimate?: string;
  date?: string;
  tags?: string[];
}

export interface LinearIssue {
  title: string;
  description?: string;
  projectId: string;
  priority: 1 | 2 | 3 | 4 | 0; // 1=urgent, 2=high, 3=medium, 4=low, 0=none
  estimate?: number;
  labels?: string[];
}

// ============================================
// CONFIG TYPES
// ============================================

export interface RevloopConfig {
  dataDir: string;
  linearProjects: Record<string, string>; // project name -> linear project ID
  notionDatabaseId: string;
  anthropicApiKey?: string;
}

// Known Linear projects mapping
export const LINEAR_PROJECTS = {
  'RevLoop': 'revloop-project-id', // TODO: Get actual IDs
  'Universal Coding OS': 'universal-coding-os-id',
  'Remix Rev Website': 'remix-website-id',
  'HEC Website': 'hec-website-id',
} as const;

// Initiative for coding projects
export const LINEAR_INITIATIVE = 'Remix Revenue Business';
