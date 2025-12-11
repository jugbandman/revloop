import Anthropic from '@anthropic-ai/sdk';
import type { ProcessedTranscript, ExtractedTask, TranscriptType } from './types.js';

const EXTRACTION_PROMPT = `You are a productivity assistant that extracts actionable tasks from voice transcripts or brain dumps.

Analyze the transcript and extract all tasks, categorizing each as:
- "coding": Technical/development tasks that should go to Linear
- "human": Personal tasks, errands, calls to make - go to Notion
- "follow-up": Tasks that need to happen on a specific future date - go to Notion with date

For each task, determine:
- Priority: high (urgent/important), medium (should do soon), low (nice to have)
- Project: If it's a coding task, which project? (RevLoop, Universal Coding OS, Remix Rev Website, HEC Website, or other)
- Estimate: Quick Task (< 15min), Short (15-60min), Medium (1-3hr), Deep Work (3hr+)
- Due date: If mentioned or implied

Also determine the transcript type:
- "brain-dump": Personal voice note with mixed tasks
- "customer-meeting": External meeting with clients/prospects
- "internal-meeting": Team/internal meeting

Return JSON in this exact format:
{
  "type": "brain-dump" | "customer-meeting" | "internal-meeting",
  "tasks": [
    {
      "title": "Short actionable title",
      "description": "Additional context if needed",
      "taskType": "coding" | "human" | "follow-up",
      "priority": "high" | "medium" | "low",
      "estimate": "Quick Task" | "Short" | "Medium" | "Deep Work",
      "project": "RevLoop" | "Universal Coding OS" | null,
      "dueDate": "2024-12-05" | null,
      "context": "Why this matters or where it came from"
    }
  ],
  "meetingMetadata": {
    "title": "Meeting title if applicable",
    "company": "Company name if customer meeting",
    "participants": ["Name 1", "Name 2"],
    "callType": "intro" | "demo" | "followup" | "internal" | "general"
  } | null
}

Important:
- Extract ALL actionable items, even small ones
- Be specific in task titles (not "work on project" but "implement user auth")
- Coding tasks go to Linear, everything else to Notion
- Follow-ups need a date`;

export class TranscriptProcessor {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async process(rawTranscript: string, previousTodayContent?: string): Promise<ProcessedTranscript> {
    const systemPrompt = previousTodayContent
      ? `${EXTRACTION_PROMPT}\n\nFor context, here is the user's previous today.md file. Avoid duplicating tasks that are already listed unless they're being re-emphasized:\n\n${previousTodayContent}`
      : EXTRACTION_PROMPT;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Extract tasks from this transcript:\n\n${rawTranscript}`,
        },
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Map and validate tasks
    const tasks: ExtractedTask[] = parsed.tasks.map((t: Record<string, unknown>) => ({
      title: String(t.title || ''),
      description: t.description ? String(t.description) : undefined,
      taskType: this.validateTaskType(t.taskType),
      priority: this.validatePriority(t.priority),
      estimate: t.estimate ? String(t.estimate) : undefined,
      project: t.project ? String(t.project) : undefined,
      dueDate: t.dueDate ? String(t.dueDate) : undefined,
      context: t.context ? String(t.context) : undefined,
      shouldCreateLinear: t.taskType === 'coding',
      shouldCreateNotion: t.taskType === 'human' || t.taskType === 'follow-up',
    }));

    return {
      type: this.validateTranscriptType(parsed.type),
      date: new Date().toISOString().split('T')[0],
      rawContent: rawTranscript,
      tasks,
      meetingMetadata: parsed.meetingMetadata || undefined,
      processedAt: new Date().toISOString(),
    };
  }

  private validateTaskType(type: unknown): 'coding' | 'human' | 'follow-up' {
    if (type === 'coding' || type === 'human' || type === 'follow-up') {
      return type;
    }
    return 'human';
  }

  private validatePriority(priority: unknown): 'high' | 'medium' | 'low' {
    if (priority === 'high' || priority === 'medium' || priority === 'low') {
      return priority;
    }
    return 'medium';
  }

  private validateTranscriptType(type: unknown): TranscriptType {
    if (type === 'brain-dump' || type === 'customer-meeting' || type === 'internal-meeting') {
      return type;
    }
    return 'brain-dump';
  }
}
