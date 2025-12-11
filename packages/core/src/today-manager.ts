import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { TodayParser } from './today-parser.js';
import type { TodayData, PriorityTask, ProcessedTranscript, ExtractedTask } from './types.js';

/**
 * Manages today.md files: history, archiving, merging
 */
export class TodayManager {
  private parser: TodayParser;
  private dataDir: string;

  constructor(dataDir: string) {
    this.parser = new TodayParser();
    this.dataDir = dataDir;
  }

  /**
   * Get path to today directory
   */
  get todayDir(): string {
    return join(this.dataDir, 'today');
  }

  /**
   * Get path to current today.md
   */
  get currentTodayPath(): string {
    return join(this.todayDir, 'today.md');
  }

  /**
   * Ensure data directories exist
   */
  async ensureDirectories(): Promise<void> {
    const dirs = [
      this.todayDir,
      join(this.dataDir, 'transcripts'),
      join(this.dataDir, 'meetings'),
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Read current today.md file
   */
  async readCurrent(): Promise<TodayData | null> {
    try {
      const content = await readFile(this.currentTodayPath, 'utf-8');
      return this.parser.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Read current today.md as raw markdown
   */
  async readCurrentRaw(): Promise<string | null> {
    try {
      return await readFile(this.currentTodayPath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * Get most recent previous today file
   */
  async getMostRecentPrevious(): Promise<{ date: string; data: TodayData } | null> {
    try {
      const files = await readdir(this.todayDir);
      const dateFiles = files
        .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
        .sort()
        .reverse();

      if (dateFiles.length === 0) return null;

      const mostRecent = dateFiles[0];
      const content = await readFile(join(this.todayDir, mostRecent), 'utf-8');
      return {
        date: mostRecent.replace('.md', ''),
        data: this.parser.parse(content),
      };
    } catch {
      return null;
    }
  }

  /**
   * Archive current today.md with date
   */
  async archiveCurrent(): Promise<void> {
    const current = await this.readCurrent();
    if (!current) return;

    const date = current.date || new Date().toISOString().split('T')[0];
    const archivePath = join(this.todayDir, `${date}.md`);

    const content = await readFile(this.currentTodayPath, 'utf-8');
    await writeFile(archivePath, content);
  }

  /**
   * Create new today.md from processed transcript
   */
  async createFromTranscript(processed: ProcessedTranscript): Promise<TodayData> {
    await this.ensureDirectories();

    // Get previous day's data for context
    const previous = await this.getMostRecentPrevious();

    // Archive current if exists and is from a different day
    const current = await this.readCurrent();
    const today = new Date().toISOString().split('T')[0];
    if (current && current.date !== today) {
      await this.archiveCurrent();
    }

    // Build new today data
    const todayData = this.buildTodayData(processed, previous?.data);

    // Write new today.md
    const markdown = this.parser.stringify(todayData);
    await writeFile(this.currentTodayPath, markdown);

    return todayData;
  }

  /**
   * Update existing today.md with new tasks from transcript
   */
  async updateFromTranscript(processed: ProcessedTranscript): Promise<TodayData> {
    const current = await this.readCurrent();
    if (!current) {
      return this.createFromTranscript(processed);
    }

    // Merge new tasks into existing
    const newTasks = this.convertExtractedTasks(processed.tasks);
    const deduped = this.deduplicateTasks([...current.priorityStack, ...newTasks]);

    current.priorityStack = deduped;

    // Write updated today.md
    const markdown = this.parser.stringify(current);
    await writeFile(this.currentTodayPath, markdown);

    return current;
  }

  /**
   * Build TodayData from processed transcript
   */
  private buildTodayData(processed: ProcessedTranscript, previous?: TodayData): TodayData {
    const today = new Date().toISOString().split('T')[0];

    // Convert extracted tasks to priority tasks
    const tasks = this.convertExtractedTasks(processed.tasks);

    // Get incomplete tasks from previous day
    const incompleteFromPrevious = previous
      ? previous.priorityStack.filter(t => !t.completed)
      : [];

    // Deduplicate
    const allTasks = this.deduplicateTasks([...incompleteFromPrevious, ...tasks]);

    // Sort by priority
    const sorted = this.sortByPriority(allTasks);

    return {
      date: today,
      lifeContext: {
        timeAvailable: 'Full day',
        keyConstraints: [],
      },
      projects: [],
      linearIssues: [],
      priorityStack: sorted,
      workBlocks: [],
      yesterdayReview: {
        planned: previous?.priorityStack.map(t => t.task) || [],
        actuallyHappened: previous?.priorityStack.filter(t => t.completed).map(t => t.task) || [],
        stillInProgress: incompleteFromPrevious.map(t => t.task),
        lessonsLearned: [],
      },
      endOfDay: {
        whatHappened: [],
        whatShipped: [],
        whatsBlocked: [],
        tomorrowPriority: '',
      },
    };
  }

  /**
   * Convert ExtractedTask[] to PriorityTask[]
   */
  private convertExtractedTasks(tasks: ExtractedTask[]): PriorityTask[] {
    return tasks.map(t => {
      // Determine priority type based on task priority and estimate
      let type: PriorityTask['type'] = 'primary';
      if (t.estimate === 'Quick Task' || t.priority === 'low') {
        type = 'quick-win';
      } else if (t.priority === 'medium') {
        type = 'parallel';
      }

      return {
        type,
        task: t.title,
        taskType: t.taskType,
        estimated: t.estimate,
        project: t.project,
        completed: false,
        successCriteria: t.description,
      };
    });
  }

  /**
   * Remove duplicate tasks (by title similarity)
   */
  private deduplicateTasks(tasks: PriorityTask[]): PriorityTask[] {
    const seen = new Set<string>();
    const result: PriorityTask[] = [];

    for (const task of tasks) {
      const normalized = task.task.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(task);
      }
    }

    return result;
  }

  /**
   * Sort tasks: primary first, then parallel, then quick-wins
   * Within each group, high priority first
   */
  private sortByPriority(tasks: PriorityTask[]): PriorityTask[] {
    const typeOrder = { primary: 0, parallel: 1, 'quick-win': 2 };

    return tasks.sort((a, b) => {
      const typeCompare = typeOrder[a.type] - typeOrder[b.type];
      if (typeCompare !== 0) return typeCompare;

      // Within same type, coding tasks first (they're usually higher priority)
      if (a.taskType === 'coding' && b.taskType !== 'coding') return -1;
      if (a.taskType !== 'coding' && b.taskType === 'coding') return 1;

      return 0;
    });
  }

  /**
   * Get list of previous today files
   */
  async listHistory(limit = 7): Promise<string[]> {
    try {
      const files = await readdir(this.todayDir);
      return files
        .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
        .sort()
        .reverse()
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Read a specific date's today file
   */
  async readByDate(date: string): Promise<TodayData | null> {
    try {
      const path = join(this.todayDir, `${date}.md`);
      const content = await readFile(path, 'utf-8');
      return this.parser.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Save transcript to transcripts directory
   */
  async saveTranscript(content: string, type: string): Promise<string> {
    await this.ensureDirectories();

    const today = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const filename = `${today}-${type}-${timestamp}.txt`;
    const path = join(this.dataDir, 'transcripts', filename);

    await writeFile(path, content);
    return path;
  }
}
