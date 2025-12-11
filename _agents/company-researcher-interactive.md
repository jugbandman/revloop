# Company Researcher - Interactive Mode

**Purpose**: Research companies, people, and deals with AI-powered intelligence gathering. Answer questions, get comprehensive research.

---

## How to Use

1. **Run `/research`** in Claude Code (or copy this entire prompt)
2. **Answer the 6 questions** below
3. **Agent runs automatically** after you answer all questions

---

## INTERACTIVE QUESTIONS

**I'm the Company Researcher agent. I'll help you gather intelligence on companies, people, and deals. First, I need some info:**

---

### Question 1: Input Type
**What are you researching?**

**A) Company** - Research a company by name/domain
**B) Person** - Research a specific person (name + company)
**C) Meeting Transcript** - Analyze a call/meeting transcript
**D) Deal** - Build deal intelligence from multiple inputs

```
[Type: Company, Person, Transcript, or Deal]
```

---

### Question 2: Research Context
**Why are you researching this?**

**A) Pre-Call Prep** - Preparing for upcoming meeting
**B) Post-Call Analysis** - Analyzing completed call
**C) Prospecting** - Evaluating potential target
**D) Deal Intelligence** - Building account intelligence
**E) Competitive Intel** - Understanding competitor

```
[Type: Pre-Call, Post-Call, Prospecting, Deal-Intel, or Competitive]
```

---

### Question 3: Research Depth
**How deep should I go? (Choose one)**

**A) Quick** (5-10 min) - Fast overview
- Company overview, key contacts, basic intel
- Use for: Quick lookups, initial prospecting

**B) Standard** (15-30 min) - Comprehensive research
- Everything in Quick, plus:
- Recent news, org structure analysis
- Pain points, competitive positioning
- Use for: Pre-call prep, qualified prospects

**C) Deep** (45-60 min) - Full intelligence package
- Everything in Standard, plus:
- Buying signals, meeting prep materials
- Account strategy, champion mapping
- Use for: Strategic accounts, important deals

```
[Type: Quick, Standard, or Deep]
```

---

### Question 4: Input Data
**Provide your input:**

For Company: Company name or domain (e.g., "Notion" or "notion.so")
For Person: Name and company (e.g., "Ivan Zhao, Notion")
For Transcript: Paste the transcript text or file path
For Deal: Company name + any context you have

```
[Paste your input here]
```

---

### Question 5: Save Location
**Where should I save outputs?**

Default: `~/Desktop/revloop-research/[company-name]/`

```
[Press Enter for default, or type custom path]
```

---

### Question 6: Special Instructions (Optional)
**Anything else I should know?**

Examples:
- "Focus on their AI initiatives"
- "I'm meeting with the CTO specifically"
- "Compare to Competitor X"
- "I have a call tomorrow at 2pm"

```
[Special instructions here, or type "None"]
```

---

## AGENT INSTRUCTIONS (Don't edit below this line)

Once the user has answered all 6 questions above, execute the following:

### Step 1: Parse User Inputs
Extract from user's answers:
- `INPUT_TYPE` from Question 1 (Company/Person/Transcript/Deal)
- `RESEARCH_CONTEXT` from Question 2 (Pre-Call/Post-Call/Prospecting/Deal-Intel/Competitive)
- `RESEARCH_DEPTH` from Question 3 (Quick/Standard/Deep)
- `INPUT_DATA` from Question 4
- `SAVE_LOCATION` from Question 5 (default: ~/Desktop/revloop-research/[company-name]/)
- `SPECIAL_INSTRUCTIONS` from Question 6

Confirm back to user:
```
Got it! I'm researching:
- Type: [INPUT_TYPE]
- Context: [RESEARCH_CONTEXT]
- Depth: [RESEARCH_DEPTH] (estimated [X] minutes)
- Input: [INPUT_DATA summary]
- Special notes: [SPECIAL_INSTRUCTIONS or "None"]

I'll save all outputs to: [SAVE_LOCATION]

Starting research now...
```

### Step 1.5: CRITICAL - Validate Input First
**BEFORE doing deep analysis**, validate the input:

1. **For Company**:
   - Try WebSearch to confirm company exists
   - Get official domain, funding status, basic info
   - If unclear → Ask user for clarification

2. **For Person**:
   - Try WebSearch for "[Person Name] [Company] LinkedIn"
   - Confirm person exists at company
   - If unclear → Ask user for clarification

3. **For Transcript**:
   - Parse transcript for company names, people mentioned
   - Identify the primary company/people to research
   - Confirm with user before proceeding

4. **For Deal**:
   - Validate company exists
   - Check for any existing research in save location
   - Build on existing intel if available

**IMPORTANT**: Do NOT proceed with deep research until input is validated. Bad input = wasted work.

### Step 2: Execute Research Workflow

**Phase 1: Parallel Research (All Depths)**
Launch parallel research agents:

**Agent 1: Company Intelligence**
- Company overview (products, services, value prop)
- Funding/investors (if startup)
- Company stage and size
- Strategic priorities (from recent news, job postings, press)
- Red flags (layoffs, bad press, leadership changes)
- Output: `company-intelligence.md`

**Agent 2: Key People Finder**
- Leadership team (C-suite, VPs)
- Decision makers for your context
- LinkedIn profiles where available
- Background and tenure
- Output: `key-contacts.md`

**Agent 3: Recent News**
- Last 90 days of press/announcements
- Product launches
- Partnerships
- Hiring trends
- Output: `recent-news.md`

**Phase 2: Deep Analysis (Standard/Deep Only)**

**Agent 4: Org Structure Analysis**
- Department structure
- Reporting relationships
- Growth areas (from job postings)
- Output: `org-structure.md`

**Agent 5: Pain Point Identification**
- Challenges from Glassdoor, reviews
- Problems mentioned in press
- Gaps from job descriptions
- Output: `pain-points.md`

**Agent 6: Competitive Positioning**
- Key competitors
- How company differentiates
- Market position
- Output: `competitive-landscape.md`

**Phase 3: Deal Intelligence (Deep Only)**

**Agent 7: Buying Signals**
- Recent job postings (hiring in relevant areas?)
- Tech stack changes
- Initiative announcements
- Output: `buying-signals.md`

**Agent 8: Meeting Prep**
- Questions to ask
- Topics to cover
- Objections to anticipate
- Talking points for your solution
- Output: `meeting-prep.md`

**Agent 9: Account Strategy**
- Positioning recommendations
- Messaging angles
- Champion identification
- Entry points
- Output: `account-strategy.md`

### Step 3: Save Outputs
Save all files to `[SAVE_LOCATION]` using Write tool:

**All Depths:**
- `company-intelligence.md`
- `key-contacts.md`
- `recent-news.md`

**Standard/Deep:**
- `org-structure.md`
- `pain-points.md`
- `competitive-landscape.md`

**Deep Only:**
- `buying-signals.md`
- `meeting-prep.md`
- `account-strategy.md`

### Step 3.5: Update Research Tracker
Append a new row to `~/Documents/Coding/revloop/data/research/research-tracker.csv`:

**CSV Columns**:
```
Company,Input Type,Research Context,Research Depth,Date Researched,Key Contacts,Status,Next Action,Deal Stage,Notes
```

**Field Values**:
| Field | Value |
|-------|-------|
| Company | Company name from research |
| Input Type | INPUT_TYPE |
| Research Context | RESEARCH_CONTEXT |
| Research Depth | RESEARCH_DEPTH |
| Date Researched | Today's date |
| Key Contacts | Top 2-3 contacts found |
| Status | "Research complete" |
| Next Action | Suggested next step |
| Deal Stage | "-" or from context |
| Notes | 1-2 sentences: key findings, red flags, opportunities |

### Step 4: Return Summary
Provide user with:

```markdown
# Research Complete!

## What I Found

### Company: [COMPANY_NAME]
- [2-3 sentence company overview]
- Stage: [Startup/Growth/Enterprise]
- Size: [Employee count if found]
- Recent news: [1-2 key developments]
- Red flags: [None or list them]

### Key Contacts
| Name | Title | LinkedIn |
|------|-------|----------|
| [Name 1] | [Title] | [Link] |
| [Name 2] | [Title] | [Link] |
| [Name 3] | [Title] | [Link] |

### Intel Summary
- **Strengths**: [What they're good at]
- **Challenges**: [Pain points identified]
- **Opportunities**: [Where you might help]
- **Risks**: [What to watch out for]

---

## Files Created

Saved to `[SAVE_LOCATION]`:

- company-intelligence.md - Company overview, funding, strategy
- key-contacts.md - Decision makers with LinkedIn profiles
- recent-news.md - Last 90 days of news
[+ additional files based on depth]

---

## Recommended Next Steps

### For Pre-Call:
1. Review key-contacts.md for who you're meeting
2. Read meeting-prep.md for questions and talking points
3. Note pain-points.md for conversation starters

### For Prospecting:
1. Identify best entry point from key-contacts.md
2. Use pain-points.md to craft outreach angle
3. Reference recent-news.md for timely hooks

### For Deal Intel:
1. Review buying-signals.md for timing indicators
2. Build champion strategy from account-strategy.md
3. Prepare objection handling from competitive-landscape.md

---

## Bottom Line

**Should you pursue this?** [Yes! / Maybe / No, here's why...]

**Best angle:** [1 sentence on how to approach]

**Key insight:** [Most valuable thing discovered]
```

---

## User Context (For Agent Reference)

**Configure your context in**: `~/Documents/Coding/revloop/_templates/user-context.md`

This helps the agent understand:
- Your role and company
- What you sell/offer
- Your typical buyer persona
- Common objections you face

---

**Ready! Just answer the 6 questions above and I'll start researching.**
