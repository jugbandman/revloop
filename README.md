# RevLoop

Productivity quarterback - transform voice dumps into actionable tasks routed to Linear and Notion.

**Now with GTM IDE workflows for sales reps!** Use Cursor's AI-powered workflows to guide you through prospecting, outreach, discovery, demos, and closing.

---

## Quick Start

### CLI Commands

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Set your Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-...

# Process a transcript
node packages/cli/dist/index.js process my-transcript.txt

# Create today.md from transcript
node packages/cli/dist/index.js today new my-transcript.txt

# Show current today.md
node packages/cli/dist/index.js today show

# Sync tasks (dry run)
node packages/cli/dist/index.js sync all --dry-run
```

### GTM Workflows (Cursor IDE)

**Prerequisites:**
- Cursor IDE installed
- This folder open in Cursor
- Composer open (Cmd+I / Ctrl+I)

**Getting Started:**
1. Open Cursor and open this folder
2. Open Composer (Cmd+I / Ctrl+I)
3. Type a workflow command (e.g., `/discovery-prep`)
4. Follow the guided workflow

---

## GTM Workflows

RevLoop includes AI-powered GTM workflows that guide you through sales processes step-by-step, similar to the Cursor PM course structure.

### Available Workflows

**`/icp-create`** - Build your Ideal Customer Profile from scratch
- Define target segments
- Create buyer personas
- Establish qualification criteria
- Document your ICP

**`/prospect`** - Identify and qualify prospects
- Review existing pipeline
- Identify target segments
- Build prospect lists
- Qualify based on ICP

**`/outreach`** - Create outreach sequences
- Draft outbound email sequences (3-5 touches)
- Create LinkedIn message flows
- Personalize messaging
- Set up sequences

**`/discovery-prep`** - Prepare for discovery calls
- Gather prospect context
- Review similar calls
- Prepare discovery questions
- Create call outline/conversation anchor

**`/demo-prep`** - Prepare for demo calls
- Customize demo flow
- Create conversation anchor (2-3 slides)
- Anticipate questions/objections
- Practice key talk tracks

**`/call-debrief`** - Debrief after calls
- Capture call notes
- Analyze buyer signals
- Assess deal health
- Plan next steps

**`/objection-handle`** - Handle objections
- Identify objection type
- Access response frameworks
- Customize responses
- Practice delivery

**`/proposal-draft`** - Create proposals
- Structure proposal based on discovery
- Customize Founding Client Offer
- Review pricing/terms
- Draft follow-up communications

---

## How GTM Workflows Work

### Structure

Each workflow follows the same pattern:

1. **Command** (`.cursor/commands/[workflow].md`) - Simple slash command you type
2. **Script** (`gtm-workflows/[workflow]/SCRIPT.md`) - Step-by-step coaching guide
3. **Templates** (`gtm-context/templates/`) - Reusable templates and examples

### Usage

1. **Open Composer** in Cursor (Cmd+I / Ctrl+I)
2. **Type the command** (e.g., `/discovery-prep`)
3. **Follow the guidance** - The AI coach will guide you step-by-step
4. **Stop at STOP points** - The workflow will wait for your input
5. **Complete the workflow** - Get deliverables and next steps

### Example: Discovery Prep

```
1. Open Composer (Cmd+I)
2. Type: /discovery-prep
3. AI asks: "Who are you meeting with?"
4. You provide: "Acme Corp, VP of Operations"
5. AI guides you through:
   - Gathering context
   - Preparing questions
   - Creating call outline
6. You get: Customized call prep document
```

---

## Company Context

Before using workflows, set up your company context:

**`company-context/COMPANY.md`** - Your company overview
**`company-context/PRODUCT.md`** - What you sell
**`company-context/ICP.md`** - Ideal Customer Profile
**`company-context/PERSONAS.md`** - Buyer personas
**`company-context/COMPETITIVE.md`** - Competitive landscape
**`company-context/FOUNDING_CLIENT_OFFER.md`** - Your specific offer

**Note:** These files are templates. Update them with your actual company information.

---

## GTM Context & Templates

**`gtm-context/email-sequences/`** - Outreach templates
- `outbound-primary.md` - 5-touch email sequence
- `linkedin-warm.md` - LinkedIn message flows

**`gtm-context/talk-tracks/`** - Conversation guides
- `discovery-outline.md` - Discovery call structure
- `demo-anchor.md` - Demo conversation anchor
- `objection-responses.md` - Objection handling library

**`gtm-context/templates/`** - Reusable templates
- `call-prep.md` - Call preparation template
- `proposal.md` - Proposal template
- `follow-up.md` - Follow-up email template

**`gtm-context/transcripts/`** - Example call transcripts (add your own)

---

## CLI Commands

### `revloop process <file>`

Process a transcript and extract tasks using Claude.

```bash
revloop process brain-dump.txt                    # Output to stdout
revloop process brain-dump.txt -o tasks.json      # Output to file
revloop process brain-dump.txt --no-history       # Skip deduplication
```

### `revloop today`

Manage today.md files.

```bash
revloop today new transcript.txt    # Create new today.md from transcript
revloop today update transcript.txt # Add tasks to existing today.md
revloop today show                  # Display current today.md
revloop today show --json           # Output as JSON
revloop today archive               # Archive current to dated file
revloop today history               # List previous today files
```

### `revloop sync`

Sync tasks to external systems.

```bash
revloop sync notion         # Push human tasks to Notion
revloop sync linear         # Push coding tasks to Linear
revloop sync all            # Sync to both
revloop sync status         # Show sync status
revloop sync all --dry-run  # Preview without syncing
```

---

## Task Routing

Tasks are automatically categorized and routed:

| Task Type | Destination | Examples |
|-----------|-------------|----------|
| `coding` | Linear | "Build transcript processor", "Fix auth bug" |
| `human` | Notion | "Call dentist", "Review proposal" |
| `follow-up` | Notion + Date | "Follow up with client on Friday" |

---

## Data Storage

```
data/
├── today/
│   ├── today.md          # Current day's file
│   ├── 2024-12-03.md     # Archived days
│   └── ...
├── transcripts/          # Raw input transcripts
└── meetings/             # Enhanced meeting notes
```

---

## Configuration

Create a `.env` file:

```bash
ANTHROPIC_API_KEY=sk-ant-...

# Notion Sync Configuration (optional, for client context sync)
NOTION_API_KEY=secret_...
NOTION_CLIENT_CONTEXT_DB_ID=...
NOTION_TRANSCRIPTS_DB_ID=...
NOTION_MEETINGS_DB_ID=...
```

### Notion Sync Setup

RevLoop can sync client context bidirectionally with Notion, enabling you to:
- Capture emails from Superhuman (via Zapier) → Notion → Local files
- Capture transcripts from granola.ai → Notion → Local files
- Push enhanced meeting notes from workflows → Notion

**Step 1: Create Notion Databases**

Create three databases in your Notion workspace:

**1. Client Context Database** (`client-context`)
- `Company` (Title) - Company name
- `Contact` (Person or Text) - Primary contact
- `Email Thread` (Text/Rich Text) - Email content
- `Email Date` (Date) - When email was received
- `Label` (Select) - Source label (hyperadaptive, hyperadaptive/progress, etc.)
- `Status` (Select) - active, archived
- `Last Synced` (Date) - Last time synced locally
- `Local File Path` (Text) - Path to local file
- `Enhanced Content` (Text/Rich Text) - AI-enhanced summary/notes
- `Action Items` (Relation) - Links to action items (optional)

**2. Transcripts Database** (`transcripts`)
- `Title` (Title) - Meeting/call title
- `Company` (Relation or Text) - Links to client-context
- `Date` (Date) - Call date
- `Transcript` (Text/Rich Text) - Full transcript
- `Source` (Select) - granola.ai, manual, other
- `Last Synced` (Date)
- `Local File Path` (Text)
- `Enhanced Meeting` (Relation) - Links to enhanced meeting notes

**3. Enhanced Meetings Database** (`meetings`)
- `Title` (Title)
- `Company` (Relation) - Links to client-context
- `Call Type` (Select) - intro, demo, discovery, pov, followup, technical, pricing, closing, internal, general
- `Summary` (Text)
- `Buyer Signals` (Text)
- `Deal Health` (Text)
- `Action Items` (Text or Relation)
- `Local File Path` (Text)

**Step 2: Get Notion API Key**

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name it "RevLoop Sync"
4. Select your workspace
5. Copy the "Internal Integration Token" (starts with `secret_`)
6. Add it to your `.env` as `NOTION_API_KEY`

**Step 3: Share Databases with Integration**

1. Open each database in Notion
2. Click "..." menu → "Connections" → "Add connections"
3. Select your "RevLoop Sync" integration
4. Copy the database ID from the URL (the long string after the workspace name and before the `?`)
5. Add to `.env`:
   - `NOTION_CLIENT_CONTEXT_DB_ID=...`
   - `NOTION_TRANSCRIPTS_DB_ID=...`
   - `NOTION_MEETINGS_DB_ID=...`

**Step 4: Install Dependencies**

```bash
pnpm install
```

**Step 5: Test the Connection**

```bash
# Pull client context from Notion
revloop sync pull --clients

# Pull transcripts from Notion
revloop sync pull --transcripts

# Push enhanced meetings to Notion
revloop sync push --meetings --dry-run
```

See [Zapier Setup Guide](#zapier-setup) below for automating email and transcript capture.

---

## Project Structure

```
revloop/
├── .cursor/                    # Cursor IDE integration
│   ├── commands/               # Workflow commands
│   ├── rules/                  # Context rules
│   └── SCRIPT_INSTRUCTIONS.md  # How workflows work
├── company-context/            # Company/product context
│   ├── COMPANY.md
│   ├── PRODUCT.md
│   ├── ICP.md
│   ├── PERSONAS.md
│   ├── COMPETITIVE.md
│   └── FOUNDING_CLIENT_OFFER.md
├── gtm-workflows/             # Guided workflow scripts
│   ├── icp-creation/
│   ├── prospecting/
│   ├── outreach/
│   ├── discovery-prep/
│   ├── demo-prep/
│   ├── call-debrief/
│   ├── objection-handling/
│   └── proposal-drafting/
├── gtm-context/               # Templates and examples
│   ├── email-sequences/
│   ├── talk-tracks/
│   ├── templates/
│   └── transcripts/
├── packages/
│   ├── core/                  # Shared logic
│   │   ├── transcript-processor.ts
│   │   ├── today-parser.ts
│   │   └── today-manager.ts
│   ├── notion-sync/           # Notion bidirectional sync
│   │   ├── notion-client.ts
│   │   ├── notion-puller.ts
│   │   └── notion-pusher.ts
│   └── cli/                   # Command-line tools
├── data/                       # Local storage
│   ├── clients/               # Client context (from Notion)
│   │   └── [company-name]/
│   │       ├── emails/
│   │       ├── context.json
│   │       └── README.md
│   ├── transcripts/          # Call transcripts
│   ├── meetings/            # Enhanced meeting notes
│   └── sync-mapping.json    # Notion ↔ Local file mapping
└── package.json
```

---

## Development

```bash
# Watch mode
pnpm dev

# Build all packages
pnpm build
```

---

## Notion Sync Commands

### Pull from Notion

Download client context and transcripts from Notion to local files:

```bash
# Pull everything
revloop sync pull --all

# Pull only client context (emails)
revloop sync pull --clients

# Pull only transcripts
revloop sync pull --transcripts
```

This creates:
- `data/clients/[company-name]/emails/[date]-[subject].md` - Individual email files
- `data/clients/[company-name]/context.json` - Company metadata and email index
- `data/clients/[company-name]/README.md` - Quick reference
- `data/transcripts/[date]-[title].txt` - Transcript files

### Push to Notion

Upload enhanced meeting notes and updates to Notion:

```bash
# Push enhanced meetings
revloop sync push --meetings

# Dry run to see what would be pushed
revloop sync push --meetings --dry-run
```

Enhanced meetings are created by the `/call-debrief` workflow and saved to `data/meetings/`.

---

## Zapier Setup

Automate capturing emails and transcripts into Notion, then sync to RevLoop.

### Zap 1: Superhuman → Notion (Email Capture)

**Trigger:** Superhuman - New Email with Label
- Label pattern: `hyperadaptive*` (matches `hyperadaptive`, `hyperadaptive/progress`, etc.)

**Action:** Notion - Create Database Item
- Database: Your `client-context` database
- Company: Extract from label (e.g., `hyperadaptive/progress` → "progress.com")
- Email Thread: Email body + subject
- Email Date: Email date
- Label: Full label path
- Status: "active"

**Label Parsing Logic:**
- `hyperadaptive` → Company: "hyperadaptive", Label: "hyperadaptive"
- `hyperadaptive/progress` → Company: "progress.com", Label: "hyperadaptive/progress"
- Extract company name from label hierarchy

### Zap 2: granola.ai → Notion (Transcript Capture)

**Option A: If granola.ai writes directly to Notion**
- granola.ai already creates Notion pages → No Zap needed
- Just ensure pages are in your `transcripts` database
- Use `revloop sync pull --transcripts` to sync

**Option B: If granola.ai sends notifications**
- Trigger: granola.ai - New Transcript (or webhook)
- Action: Notion - Create Database Item
- Database: Your `transcripts` database
- Title: Transcript title
- Date: Call date
- Transcript: Full transcript content
- Source: "granola.ai"
- Company: Extract from transcript metadata or link to client-context

### Workflow

1. **Email arrives in Superhuman** → Label it `hyperadaptive` or `hyperadaptive/[company]`
2. **Zapier captures** → Creates record in Notion `client-context` database
3. **Run `revloop sync pull --clients`** → Downloads to `data/clients/[company]/`
4. **Use in workflows** → `/discovery-prep` automatically finds and uses client context
5. **After call** → `/call-debrief` creates enhanced meeting
6. **Run `revloop sync push --meetings`** → Uploads enhanced meeting to Notion

---

## Integration Status

- [x] Transcript processing with Claude
- [x] today.md generation and parsing
- [x] History tracking and deduplication
- [x] GTM workflows (Cursor IDE)
- [x] Notion API integration (client context sync)
- [ ] Notion API integration (task sync - still copy-paste format)
- [ ] Linear API integration (currently shows copy-paste format)
- [ ] Audio recording (future)

---

## Getting Started with GTM Workflows

### Step 1: Set Up Company Context

1. Update `company-context/` files with your actual company information
2. Start with `ICP.md` - run `/icp-create` if you need help building it

### Step 2: Try Your First Workflow

1. Open Cursor and open this folder
2. Open Composer (Cmd+I / Ctrl+I)
3. Type `/discovery-prep` (or any workflow)
4. Follow the guided steps

### Step 3: Use Workflows in Your Sales Process

- **Prospecting:** `/prospect` → `/outreach`
- **Discovery:** `/discovery-prep` → `/call-debrief`
- **Demo:** `/demo-prep` → `/call-debrief`
- **Closing:** `/proposal-draft` → `/objection-handle`

---

## Tips for Using GTM Workflows

**Personalization:**
- Always customize templates for your specific prospect
- Use company context files to guide personalization
- Reference past call transcripts for patterns

**AI-Accelerated Work:**
- Workflows use AI extensively for drafting and analysis
- You provide judgment and refinement
- Focus on high-leverage activities

**Learning Loop:**
- Use `/call-debrief` after every call
- Capture lessons learned
- Apply insights to future calls

**Integration with RevLoop CLI:**
- Process call transcripts with `revloop process`
- Use transcripts in workflows
- Sync action items to Linear/Notion

---

## License

MIT

---

## Credits

- GTM workflow structure inspired by Cursor PM course patterns
- Built to help sales reps execute proven sales processes
- Designed for founder-led sales and AI-accelerated workflows

---

**Ready to start? Open Composer (Cmd+I / Ctrl+I) and type `/icp-create` to build your ICP, or `/discovery-prep` to prepare for your next call!**
