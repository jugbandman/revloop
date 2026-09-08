---
title: RevLoop x Hyperadaptive - Implementation Plan
date: 2026-03-18
status: approved
tags: [revloop, hyperadaptive, openclaw, plan]
---

# RevLoop x Hyperadaptive: Implementation Plan

**Client:** Melissa Reeve, Hyperadaptive
**Owner:** Andy Carlson, Remix Revenue
**Goal:** Ship a daily intelligence brief, outbound pipeline, and Slack bot for Melissa as the first RevLoop client deployment.

---

## Architecture

```
TRACK A: DAILY BRIEF
─────────────────────────────────────────────────────────────────
  Gmail API ──┐
  Google Cal ─┤
  Voice Memos ┤──> brief-generator.py ──> Anthropic API
  Yesterday   ┤    (remix-revenue-toolkit              │
  tracking ───┘    + new gmail/cal modules)            ▼
                                           hyperadaptive-vault/
                                           daily-briefs/
                                           YYYY-MM-DD-brief.md
                                                   │
                                            GitHub API write (archive)
                                                   │
                                            Slack API post
                                            (punchy summary + link)

TRACK B: OUTBOUND PIPELINE
─────────────────────────────────────────────────────────────────
  Clay ──────> n8n webhook ──> create contact markdown
               │               GitHub API write
               │               hyperadaptive-vault/contacts/
               │               sarah-chen.md
               ▼
          Google Sheet ──> Andy imports ──> Waalaxy
          (staging)         (weekly, 5 min)  LinkedIn sequences
                                                   │
                                            reply webhook
                                                   │
                                            n8n ──> update
                                                   contact.md
                                                   + Slack alert

BOT: OPENCLAW IN SLACK
─────────────────────────────────────────────────────────────────
  Melissa ──> #hyperadaptive ──> Icculus (Docker, M3)
              Slack channel       ├── pipeline-query skill
                                  ├── deal-coach skill
                                  ├── draft-message skill
                                  ├── update-tracking skill
                                  ├── set-reminder skill
                                  └── brief-generate skill
                                          │
                                   git pull/push
                                          │
                                  hyperadaptive-vault (GitHub)

DATA LAYER: MARKDOWN VAULT
─────────────────────────────────────────────────────────────────
  remixrevco/hyperadaptive-vault (private GitHub repo)
  ├── daily-briefs/        ← brief-generator.py writes
  ├── contacts/            ← n8n writes (Clay enrichment)
  ├── opportunities/       ← OpenClaw writes (Melissa via chat)
  ├── transcripts/         ← transcript_workflow.py writes
  ├── campaigns/           ← n8n writes (Waalaxy campaign data)
  └── tracking/            ← OpenClaw reads/writes daily

  View layer: Notion (Phase 4, n8n syncs contacts + opps DBs)
```

---

## Slack Brief Format

Delivered every morning to `#hyperadaptive` channel:

```
Hyperadaptive Brief - Wednesday Mar 18

Follow-ups due today:
• Sarah Chen (Momentum AI) - sent connection request 3 days ago, no reply
• Acme Corp - proposal sent Monday, follow up today
• TechCorp - met last week, promised intro to champion

New replies:
• David Park (Novo) - interested, wants to see pricing. Meeting at 10am today.

Meetings today:
• 10am - Discovery call, Novo (David Park). Goal: qualify budget + timeline.
• 2pm - Internal sync with Andy

Pipeline pulse:
• 12 active opportunities
• 2 advanced this week (Novo, Brightline)
• 1 went cold (Zenith - no response in 10 days)

Voice memos processed: 2 (summaries in full brief)

Top action: Prep Novo discovery questions before 10am.

Full brief → https://github.com/remixrevco/hyperadaptive-vault/...
```

---

## Vault Structure

**Repo:** `remixrevco/hyperadaptive-vault` (private)

```
hyperadaptive-vault/
├── daily-briefs/
│   └── 2026-03-18-brief.md
├── contacts/
│   └── sarah-chen.md
├── opportunities/
│   └── acme-corp.md
├── transcripts/
│   └── 2026-03-17-call-acme.md
├── campaigns/
│   └── ai-leaders-q1-2026.md
└── tracking/
    └── 2026-03-18-today.md
```

**Contact frontmatter template:**
```yaml
---
name: Sarah Chen
company: Momentum AI
title: VP Revenue
linkedin: {url}
source: clay
status: contacted
last-contact: 2026-03-15
campaign: ai-leaders-q1-2026
tags: [vp-revenue, ai, series-b]
---
```

**Opportunity frontmatter template:**
```yaml
---
name: Acme Corp
stage: proposal-sent
value: {add value}
champion: {name}
economic-buyer: {name}
decision-date: {date}
meddic-score: {0-6}
last-activity: 2026-03-18
tags: [enterprise, q2-close]
---
```

---

## What Gets Reused vs Built New

| Component | Source | Decision | Notes |
|-----------|--------|----------|-------|
| Transcript processing | `remix-revenue-toolkit/transcript_workflow.py` | REUSE | Point at Melissa's voice memos folder |
| Slack notification | `remix-revenue-toolkit/notification_manager.py` | REUSE | Already formats + sends to channel |
| Today parser | `revloop/packages/core/today-parser.ts` | REUSE | Generates/parses tracking files |
| Transcript processor | `revloop/packages/core/transcript-processor.ts` | REUSE | Structured meeting data output |
| Call debrief workflow | `revloop/gtm-workflows/call-debrief/SCRIPT.md` | PORT to OpenClaw skill | Already MEDDIC-structured |
| Discovery prep workflow | `revloop/gtm-workflows/discovery-prep/SCRIPT.md` | PORT to OpenClaw skill | Reads company context at runtime |
| Daily tracking template | `todays-dump/daily-template.md` | ADAPT | Swap task categories for sales-specific |
| Start-my-day skill | `todays-dump/start-my-day.skill.md` | ADAPT | Port to OpenClaw Slack skill format |
| MEDDIC framework | `70-Knowledge/sales-methodology/meddic-framework.md` | INCLUDE | Load into OpenClaw context |
| Gmail pipeline | nothing | NET NEW | Gmail API module |
| Calendar pipeline | nothing | NET NEW | Google Calendar API module |
| n8n workflows | nothing | NET NEW | Clay/Waalaxy/GitHub webhooks |
| SPICED methodology | missing | ADD to vault | Write it, add to 70-Knowledge/ |

---

## Phased Delivery

### Phase 1: Daily Brief Pipeline

**Goal:** Melissa gets a Slack message every morning with her day briefed.

Steps:
1. Create `remixrevco/hyperadaptive-vault` private repo with folder structure above
2. Add Gmail API module to `remix-revenue-toolkit` (reads last 24h of email, extracts action items)
3. Add Google Calendar API module (reads today + next 3 days)
4. Build `brief-generator.py` that:
   - Reads email (Gmail API)
   - Reads calendar (Google Calendar API)
   - Reads yesterday's tracking file (GitHub API)
   - Reads voice memo transcripts (transcript_workflow.py)
   - Reads active opportunities (GitHub API, scans opportunities/)
   - Calls Anthropic API to synthesize into brief
   - Writes full brief to `daily-briefs/YYYY-MM-DD-brief.md` via GitHub API
   - Posts punchy summary to Slack via notification_manager.py
5. Set up launchd cron on M3 to run brief-generator.py at 7am daily
6. Test with Andy's data first, then onboard Melissa

**Deliverable:** Melissa gets her morning brief in Slack.

---

### Phase 2: Outbound Pipeline

**Goal:** Clay enrichments and Waalaxy replies flow into the vault automatically.

Steps:
1. Build n8n workflow: Clay webhook -> parse enrichment -> create contact.md via GitHub API
2. Build n8n workflow: Waalaxy reply webhook -> update contact.md status + Slack alert
3. Set up Google Sheet staging (n8n writes new contacts from Clay to sheet)
4. Andy imports staging sheet to Waalaxy weekly (manual, ~5 min)
5. Test full loop: Clay fires -> contact.md created -> Slack alert

**Deliverable:** Pipeline data flows into vault automatically, Slack alerts on replies.

---

### Phase 3: OpenClaw Bot in Slack

**Goal:** Melissa chats with OpenClaw in `#hyperadaptive` to query pipeline, draft messages, and get coaching.

Steps:
1. Add `#hyperadaptive` channel to Icculus Slack app config
2. Mount `hyperadaptive-vault` repo inside Icculus Docker volume (git clone on startup)
3. Write 6 skills:
   - `pipeline-query`: reads contacts/ and opportunities/, answers questions about pipeline
   - `deal-coach`: loads MEDDIC framework + opportunity file, runs coaching session
   - `draft-message`: reads contact file, drafts LinkedIn/email follow-up in Melissa's voice
   - `update-tracking`: reads/writes today's tracking file via git
   - `set-reminder`: creates dated action item in tracking file
   - `brief-generate`: on-demand brief generation (same as morning cron, any time)
4. Load Hyperadaptive company context into OpenClaw (ICP, personas, offer)
5. Test each skill end-to-end

**Deliverable:** Melissa can chat with OpenClaw in Slack to manage her pipeline.

---

### Phase 4: Notion Dashboards

**Goal:** Notion as view layer on top of vault data.

Steps:
1. Build n8n workflow: GitHub push webhook -> parse contact.md frontmatter -> sync to Notion Contacts DB
2. Build n8n workflow: GitHub push webhook -> parse opportunity.md frontmatter -> sync to Notion Opportunities DB
3. Build Notion dashboard views: pipeline by stage, contacts by campaign, weekly activity

**Deliverable:** Melissa has Notion dashboards that auto-update from vault.

---

### Phase 5: RevLoop Today Interface

**Goal:** Web or desktop interface for Melissa (and future clients).

Scope TBD based on what gaps remain after Phases 1-4. The Electron app in `revloop/packages/desktop` is a starting point.

---

## OpenClaw Skills to Create

| Skill | What it does | Source material |
|-------|-------------|-----------------|
| `pipeline-query` | Answer questions about active opportunities, reply counts, stale contacts | Reads contacts/ + opportunities/ |
| `deal-coach` | Walk through MEDDIC, Challenger, or SPICED for a specific deal | MEDDIC framework + opportunity file |
| `draft-message` | Write LinkedIn follow-up or email in Melissa's voice | Contact file + melissa-voice agent |
| `update-tracking` | Update today's tracking file via chat | today-parser.ts pattern |
| `set-reminder` | Add dated follow-up to tracking file | today-parser.ts pattern |
| `brief-generate` | On-demand brief for any day | brief-generator.py |

---

## Infrastructure Summary

| Component | Where it runs | Who maintains |
|-----------|--------------|---------------|
| brief-generator.py | M3 MacBook Air (launchd cron) | Andy |
| n8n | M3 MacBook Air (Docker) | Andy |
| OpenClaw (Icculus) | M3 MacBook Air (Docker) | Andy |
| hyperadaptive-vault | GitHub (remixrevco org) | Andy |
| Waalaxy | Melissa's LinkedIn account (SaaS) | Andy imports weekly |
| Clay | Clay account (SaaS) | Andy |
| Slack | Melissa's workspace (free plan) | Melissa |

**Melissa's installs:** Slack (already has), GitHub account (for viewing full briefs). Nothing else.

---

## What Melissa Needs to Provide

- Gmail OAuth credentials (read-only scope)
- Google Calendar OAuth credentials (read-only scope)
- Slack workspace invite for OpenClaw bot
- Voice memos: synced to a folder Andy can access (Google Drive or Dropbox share)
- Hyperadaptive offer details (to fill in `revloop/company-context/`)

---

## Reusability for Future Clients

Every client gets:
- New private GitHub repo (`remixrevco/{client}-vault`) with same folder structure
- New `#client-name` channel in Slack, new Icculus channel config
- `brief-generator.py` pointed at their credentials
- n8n workflows cloned and re-pointed
- Company context files filled in for their ICP/personas/offer

The skill files, vault structure, and processing pipeline are client-agnostic by design.
