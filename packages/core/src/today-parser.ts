import type { TodayData, PriorityTask, WorkBlock, LifeContext, ProjectStatus, LinearIssueRef, YesterdayReview, EndOfDayReview } from './types.js';

/**
 * Bidirectional parser for today.md files
 * Converts between markdown and structured TodayData
 */
export class TodayParser {
  /**
   * Parse today.md markdown into structured data
   */
  parse(markdown: string): TodayData {
    const sections = this.splitIntoSections(markdown);

    return {
      date: this.extractDate(markdown),
      lifeContext: this.parseLifeContext(sections['Life Context & Calendar'] || ''),
      projects: this.parseProjects(sections['Project Status Check'] || ''),
      linearIssues: this.parseLinearIssues(sections['Linear Issues'] || ''),
      priorityStack: this.parsePriorityStack(sections["Today's Plan"] || ''),
      workBlocks: this.parseWorkBlocks(sections["Today's Plan"] || ''),
      yesterdayReview: this.parseYesterdayReview(sections["Yesterday's Reality Check"] || ''),
      endOfDay: this.parseEndOfDay(sections['End of Day Summary'] || ''),
    };
  }

  /**
   * Convert structured data back to markdown
   */
  stringify(data: TodayData): string {
    let md = `# Today - ${data.date}\n\n`;

    // Life Context
    md += `## Life Context & Calendar\n`;
    md += `**Time Available:** ${data.lifeContext.timeAvailable}\n`;
    if (data.lifeContext.energyLevel) {
      md += `**Energy Level:** ${data.lifeContext.energyLevel}/5\n`;
    }
    md += `**Key Constraints:**\n`;
    data.lifeContext.keyConstraints.forEach(c => (md += `- ${c}\n`));
    md += `\n`;

    // Project Status
    md += `## Project Status Check\n`;
    md += `**Active Projects:**\n`;
    data.projects.forEach(p => {
      const branch = p.branch ? ` - Branch: \`${p.branch}\`` : '';
      md += `- [ ] ${p.name}${branch} | Status: ${p.status}\n`;
    });
    md += `\n`;

    // Linear Issues
    if (data.linearIssues.length > 0) {
      md += `## Linear Issues\n`;
      const highPriority = data.linearIssues.filter(i => i.priority === 'urgent' || i.priority === 'high');
      const medPriority = data.linearIssues.filter(i => i.priority === 'medium');
      const lowPriority = data.linearIssues.filter(i => i.priority === 'low' || i.priority === 'none');

      if (highPriority.length > 0) {
        md += `**High Priority:**\n`;
        highPriority.forEach(i => (md += `- [${i.id}](${i.url || '#'}) ${i.title}\n`));
      }
      if (medPriority.length > 0) {
        md += `**Medium Priority:**\n`;
        medPriority.forEach(i => (md += `- [${i.id}](${i.url || '#'}) ${i.title}\n`));
      }
      if (lowPriority.length > 0) {
        md += `**Nice to Have:**\n`;
        lowPriority.forEach(i => (md += `- [${i.id}](${i.url || '#'}) ${i.title}\n`));
      }
      md += `\n`;
    }

    // Yesterday's Reality Check
    md += `## Yesterday's Reality Check\n`;
    md += `**Planned:**\n`;
    data.yesterdayReview.planned.forEach(p => (md += `- ${p}\n`));
    md += `\n**Actually Shipped:**\n`;
    data.yesterdayReview.actuallyHappened.forEach(a => (md += `- ${a}\n`));
    md += `\n**Still In Progress:**\n`;
    data.yesterdayReview.stillInProgress.forEach(s => (md += `- ${s}\n`));
    md += `\n**Lessons Learned:**\n`;
    data.yesterdayReview.lessonsLearned.forEach(l => (md += `- ${l}\n`));
    md += `\n`;

    // Today's Plan
    md += `## Today's Plan\n\n`;
    md += `### Priority Stack\n`;

    const primaryTasks = data.priorityStack.filter(t => t.type === 'primary');
    const parallelTasks = data.priorityStack.filter(t => t.type === 'parallel');
    const quickWins = data.priorityStack.filter(t => t.type === 'quick-win');

    if (primaryTasks.length > 0) {
      md += `\n1. **PRIMARY FOCUS** (Deep work required):\n`;
      primaryTasks.forEach(task => {
        const typeTag = task.taskType === 'coding' ? ' [LINEAR]' : task.taskType === 'follow-up' ? ' [FOLLOW-UP]' : '';
        md += `   - Task: ${task.task}${typeTag}\n`;
        if (task.estimated) md += `   - Estimated: ${task.estimated}\n`;
        if (task.successCriteria) md += `   - Success criteria: ${task.successCriteria}\n`;
        if (task.project) md += `   - Project: ${task.project}\n`;
        md += `\n`;
      });
    }

    if (parallelTasks.length > 0) {
      md += `2. **PARALLEL WORK** (While waiting/building/testing):\n`;
      parallelTasks.forEach(task => {
        const typeTag = task.taskType === 'coding' ? ' [LINEAR]' : '';
        md += `   - Task: ${task.task}${typeTag}\n`;
        if (task.estimated) md += `   - Estimated: ${task.estimated}\n`;
        md += `\n`;
      });
    }

    if (quickWins.length > 0) {
      md += `3. **QUICK WINS** (Between meetings/errands):\n`;
      quickWins.forEach(task => {
        const check = task.completed ? 'x' : ' ';
        const typeTag = task.taskType === 'follow-up' ? ' [FOLLOW-UP]' : '';
        md += `   - [${check}] ${task.task}${typeTag}\n`;
      });
      md += `\n`;
    }

    // Work Blocks
    if (data.workBlocks.length > 0) {
      md += `### Work Blocks\n`;
      data.workBlocks.forEach(block => {
        md += `**${block.timeRange}:**\n`;
        block.tasks.forEach(task => (md += `- ${task}\n`));
        if (block.backup) md += `- Backup task if blocked: ${block.backup}\n`;
        md += `\n`;
      });
    }

    // End of Day Summary
    md += `## End of Day Summary\n`;
    md += `**What Actually Happened:**\n`;
    data.endOfDay.whatHappened.forEach(w => (md += `- ${w}\n`));
    md += `\n**What Got Shipped:**\n`;
    data.endOfDay.whatShipped.forEach(s => (md += `- ${s}\n`));
    md += `\n**What's Blocked:**\n`;
    data.endOfDay.whatsBlocked.forEach(b => (md += `- ${b}\n`));
    md += `\n**Tomorrow's Top Priority:**\n`;
    md += `- ${data.endOfDay.tomorrowPriority}\n`;

    md += `\n---\n## Notes & Context\n<!-- Any important context -->\n`;

    return md;
  }

  private splitIntoSections(markdown: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = markdown.split('\n');

    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n');
        }
        currentSection = line.replace('## ', '').trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    if (currentSection) {
      sections[currentSection] = currentContent.join('\n');
    }

    return sections;
  }

  private extractDate(markdown: string): string {
    const match = markdown.match(/# Today - (.+)/);
    return match ? match[1].trim() : new Date().toISOString().split('T')[0];
  }

  private parseLifeContext(section: string): LifeContext {
    const timeMatch = section.match(/\*\*Time Available:\*\*\s*(.+)/);
    const energyMatch = section.match(/\*\*Energy Level:\*\*\s*(\d+)/);
    const constraints = this.extractListItems(section, 'Key Constraints:');

    return {
      timeAvailable: timeMatch ? timeMatch[1].trim() : 'Full day',
      energyLevel: energyMatch ? parseInt(energyMatch[1]) : undefined,
      keyConstraints: constraints,
    };
  }

  private parseProjects(section: string): ProjectStatus[] {
    const projects: ProjectStatus[] = [];
    const lines = section.split('\n');

    for (const line of lines) {
      const match = line.match(/- \[[ x]\] (.+?) (?:- Branch: `(.+?)`)?.*\| Status: (.+)/);
      if (match) {
        projects.push({
          name: match[1].trim(),
          branch: match[2]?.trim(),
          status: match[3].trim(),
        });
      }
    }

    return projects;
  }

  private parseLinearIssues(section: string): LinearIssueRef[] {
    const issues: LinearIssueRef[] = [];
    const lines = section.split('\n');
    let currentPriority: LinearIssueRef['priority'] = 'medium';

    for (const line of lines) {
      if (line.includes('High Priority')) currentPriority = 'high';
      else if (line.includes('Medium Priority')) currentPriority = 'medium';
      else if (line.includes('Nice to Have')) currentPriority = 'low';

      const match = line.match(/- \[(.+?)\]\((.+?)\) (.+)/);
      if (match) {
        issues.push({
          id: match[1],
          url: match[2],
          title: match[3].trim(),
          priority: currentPriority,
        });
      }
    }

    return issues;
  }

  private parsePriorityStack(section: string): PriorityTask[] {
    const tasks: PriorityTask[] = [];
    const lines = section.split('\n');
    let currentType: PriorityTask['type'] = 'primary';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('PRIMARY FOCUS')) currentType = 'primary';
      else if (line.includes('PARALLEL WORK')) currentType = 'parallel';
      else if (line.includes('QUICK WINS')) currentType = 'quick-win';

      // Parse task lines
      const taskMatch = line.match(/- Task: (.+?)(\[LINEAR\]|\[FOLLOW-UP\])?$/);
      const quickWinMatch = line.match(/- \[([ x])\] (.+?)(\[FOLLOW-UP\])?$/);

      if (taskMatch) {
        const taskType = taskMatch[2] === '[LINEAR]' ? 'coding' : taskMatch[2] === '[FOLLOW-UP]' ? 'follow-up' : 'human';
        const task: PriorityTask = {
          type: currentType,
          task: taskMatch[1].trim(),
          taskType,
          completed: false,
        };

        // Look for metadata on following lines
        for (let j = i + 1; j < lines.length && lines[j].match(/^\s+- /); j++) {
          const metaLine = lines[j];
          const estMatch = metaLine.match(/- Estimated: (.+)/);
          const criteriaMatch = metaLine.match(/- Success criteria: (.+)/);
          const projectMatch = metaLine.match(/- Project: (.+)/);

          if (estMatch) task.estimated = estMatch[1].trim();
          if (criteriaMatch) task.successCriteria = criteriaMatch[1].trim();
          if (projectMatch) task.project = projectMatch[1].trim();
        }

        tasks.push(task);
      } else if (quickWinMatch) {
        tasks.push({
          type: 'quick-win',
          task: quickWinMatch[2].trim(),
          taskType: quickWinMatch[3] === '[FOLLOW-UP]' ? 'follow-up' : 'human',
          completed: quickWinMatch[1] === 'x',
        });
      }
    }

    return tasks;
  }

  private parseWorkBlocks(section: string): WorkBlock[] {
    const blocks: WorkBlock[] = [];
    const lines = section.split('\n');
    let currentBlock: WorkBlock | null = null;
    let inWorkBlocks = false;

    for (const line of lines) {
      if (line.includes('### Work Blocks')) {
        inWorkBlocks = true;
        continue;
      }
      if (!inWorkBlocks) continue;
      if (line.startsWith('## ')) break;

      const blockMatch = line.match(/\*\*(.+?):\*\*/);
      if (blockMatch) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          timeRange: blockMatch[1].trim(),
          tasks: [],
        };
      } else if (currentBlock && line.trim().startsWith('- ')) {
        const task = line.trim().substring(2);
        if (task.startsWith('Backup task if blocked:')) {
          currentBlock.backup = task.replace('Backup task if blocked:', '').trim();
        } else {
          currentBlock.tasks.push(task);
        }
      }
    }

    if (currentBlock) blocks.push(currentBlock);
    return blocks;
  }

  private parseYesterdayReview(section: string): YesterdayReview {
    return {
      planned: this.extractListAfterLabel(section, 'Planned:'),
      actuallyHappened: this.extractListAfterLabel(section, 'Actually Shipped:'),
      stillInProgress: this.extractListAfterLabel(section, 'Still In Progress:'),
      lessonsLearned: this.extractListAfterLabel(section, 'Lessons Learned:'),
    };
  }

  private parseEndOfDay(section: string): EndOfDayReview {
    return {
      whatHappened: this.extractListAfterLabel(section, 'What Actually Happened:'),
      whatShipped: this.extractListAfterLabel(section, 'What Got Shipped:'),
      whatsBlocked: this.extractListAfterLabel(section, "What's Blocked:"),
      tomorrowPriority: this.extractSingleAfterLabel(section, "Tomorrow's Top Priority:"),
    };
  }

  private extractListItems(section: string, label: string): string[] {
    return this.extractListAfterLabel(section, label);
  }

  private extractListAfterLabel(section: string, label: string): string[] {
    const items: string[] = [];
    const lines = section.split('\n');
    let capturing = false;

    for (const line of lines) {
      if (line.includes(label)) {
        capturing = true;
        continue;
      }
      if (capturing && line.trim().startsWith('**')) {
        break;
      }
      if (capturing && line.trim().startsWith('- ')) {
        items.push(line.trim().substring(2));
      }
    }

    return items;
  }

  private extractSingleAfterLabel(section: string, label: string): string {
    const lines = section.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(label)) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine?.startsWith('- ')) {
          return nextLine.substring(2);
        }
        return nextLine || '';
      }
    }
    return '';
  }
}
