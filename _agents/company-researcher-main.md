# Company Researcher - Main Mode

**Purpose**: Full configuration mode for power users. Fill in the inputs section, then run.

---

## USER INPUTS (Fill in before running)

```yaml
# Required
INPUT_TYPE: Company          # Company | Person | Transcript | Deal
COMPANY_NAME: acme-corp      # lowercase, hyphen-separated (for folder naming)
INPUT_DATA: |
  Acme Corporation
  https://acme.com

# Research Settings
RESEARCH_CONTEXT: Pre-Call   # Pre-Call | Post-Call | Prospecting | Deal-Intel | Competitive
RESEARCH_DEPTH: Standard     # Quick | Standard | Deep

# Optional
SAVE_LOCATION: ~/Desktop/revloop-research/acme-corp/
SPECIAL_INSTRUCTIONS: |
  Focus on their AI initiatives
  Meeting with CTO tomorrow
```

---

## AGENT INSTRUCTIONS

### Step 1: Parse Inputs
Extract all values from USER INPUTS section above.

Validate:
- INPUT_TYPE is one of: Company, Person, Transcript, Deal
- RESEARCH_DEPTH is one of: Quick, Standard, Deep
- COMPANY_NAME is lowercase, hyphen-separated

### Step 2: Validate Input
Before deep research:

1. **WebSearch** to confirm company/person exists
2. Get basic info (domain, funding, size)
3. If input unclear → STOP and ask for clarification

### Step 3: Execute Research by Depth

**Quick (5-10 min)**:
- Company Intelligence (overview, stage, products)
- Key People (top 3-5 contacts)
- Recent News (last 30 days)

**Standard (15-30 min)** - Quick +:
- Org Structure Analysis
- Pain Point Identification
- Competitive Positioning

**Deep (45-60 min)** - Standard +:
- Buying Signals
- Meeting Prep Materials
- Account Strategy

### Step 4: Generate Outputs

Save to `SAVE_LOCATION`:

| File | Quick | Standard | Deep |
|------|-------|----------|------|
| company-intelligence.md | Yes | Yes | Yes |
| key-contacts.md | Yes | Yes | Yes |
| recent-news.md | Yes | Yes | Yes |
| org-structure.md | - | Yes | Yes |
| pain-points.md | - | Yes | Yes |
| competitive-landscape.md | - | Yes | Yes |
| buying-signals.md | - | - | Yes |
| meeting-prep.md | - | - | Yes |
| account-strategy.md | - | - | Yes |

### Step 5: Update Tracker
Append to `~/Documents/Coding/revloop/data/research/research-tracker.csv`

### Step 6: Return Summary
Provide executive summary with:
- Company overview
- Key contacts table
- Intel summary (strengths, challenges, opportunities)
- Recommended next steps
- Files created

---

## Output Templates

### company-intelligence.md
```markdown
# Company Intelligence: [Company Name]

**Generated**: [Date]
**Research Depth**: [Quick/Standard/Deep]

## Overview
- **Company**: [Name]
- **Domain**: [website]
- **Stage**: [Startup/Growth/Enterprise]
- **Size**: [Employee count]
- **Founded**: [Year]
- **Headquarters**: [Location]

## Products & Services
[Description of what they offer]

## Funding & Investors
- **Total Raised**: [Amount]
- **Last Round**: [Type, Amount, Date]
- **Key Investors**: [List]

## Strategic Priorities
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

## Red Flags
- [Any concerns]

## Sources
- [URLs used]
```

### key-contacts.md
```markdown
# Key Contacts: [Company Name]

**Generated**: [Date]

## Decision Makers

| Name | Title | LinkedIn | Notes |
|------|-------|----------|-------|
| [Name] | [Title] | [URL] | [Background] |

## Recommended Outreach Order
1. [Name] - [Why first]
2. [Name] - [Why second]

## Contact Strategy
[How to approach]
```

### meeting-prep.md (Deep only)
```markdown
# Meeting Prep: [Company Name]

**Generated**: [Date]
**Context**: [RESEARCH_CONTEXT]

## Before the Meeting
- [ ] Review key-contacts.md
- [ ] Read recent-news.md for conversation starters
- [ ] Prepare your value prop for their pain points

## Questions to Ask
1. [Question about their challenges]
2. [Question about their priorities]
3. [Question about their timeline]

## Topics to Cover
- [Topic 1 + why it matters to them]
- [Topic 2 + why it matters to them]

## Objections to Anticipate
| Objection | Response |
|-----------|----------|
| [Objection 1] | [How to handle] |

## Talking Points
- [Point 1 with proof]
- [Point 2 with proof]

## Meeting Goals
1. [What you want to learn]
2. [What you want them to know]
3. [Next step you want to propose]
```

---

## Usage

1. Copy this entire file
2. Fill in USER INPUTS section
3. Paste into Claude Code
4. Agent executes automatically

Or use `/research` for interactive mode.
