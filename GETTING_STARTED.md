# Getting Started with RevLoop GTM Workflows

**Quick guide to set up and start using RevLoop's GTM IDE workflows for your SOW.**

---

## Step 1: Open in Cursor

1. **Open Cursor IDE**
2. **File → Open Folder**
3. **Select the `revloop` folder**
4. **Wait for Cursor to index files**

---

## Step 2: Set Up Your Company Context

Before using workflows, populate your company context files with your actual information.

### Quick Setup (5 minutes)

**Option A: Manual Setup**
1. Open `company-context/COMPANY.md` - Fill in your company details
2. Open `company-context/PRODUCT.md` - Describe what you sell (Applied AI workshops)
3. Open `company-context/FOUNDING_CLIENT_OFFER.md` - Document your Founding Client Offer structure

**Option B: Guided Setup (Recommended)**
1. Open Composer in Cursor (Cmd+I / Ctrl+I)
2. Type: `/icp-create`
3. Follow the guided workflow to build your ICP
4. This will populate `company-context/ICP.md` and `company-context/PERSONAS.md`

### For Your SOW (Hyperadaptive Context)

Based on your SOW, here's what to populate:

**`company-context/COMPANY.md`:**
- Company: Hyperadaptive
- Stage: Pre-seed startup
- Your role: Consultant supporting founder-led sales

**`company-context/PRODUCT.md`:**
- Product: Applied AI workshops
- Delivery: [Your delivery format]
- Outcomes: [Expected outcomes]

**`company-context/FOUNDING_CLIENT_OFFER.md`:**
- Structure: [Workshop structure from SOW]
- Scope: [What's included/excluded]
- Pricing: [Founding Client pricing]
- Terms: [Simple terms for fast decisions]

**`company-context/ICP.md`:**
- Target segment: [From SOW - enterprise transformation leads, mid-market marketing leaders, etc.]
- Buyer personas: [Roles/titles]
- Qualification criteria: Fit, urgency, ability to act

**`company-context/COMPETITIVE.md`:**
- Alternative solutions prospects consider
- Your differentiation points

---

## Step 3: Import SOW Context

### Add SOW Details to Context Files

**Option 1: Reference SOW Document**
- Save your SOW as `company-context/SOW.md` (optional)
- Reference it in workflows when needed

**Option 2: Populate Directly**
- Add SOW details to relevant context files:
  - **60-day sprint objectives** → `company-context/COMPANY.md` (Strategic Priorities)
  - **Founding Client Offer** → `company-context/FOUNDING_CLIENT_OFFER.md`
  - **Target segments** → `company-context/ICP.md`
  - **Consultant responsibilities** → Note in `company-context/COMPANY.md`

### Key SOW Elements to Capture

**From Section 2 (Segment Selection):**
- Primary target segment
- ICP details
- Qualification criteria

**From Section 3 (Founding Client Offer):**
- Offer structure and scope
- Pricing and incentives
- Terms

**From Section 4 (GTM Messaging):**
- Core sales narratives
- "Why now / why this" story
- Objection-handling points
- Credibility markers

**From Section 5 (Deal Support):**
- Pre-call strategy approach
- Post-call debrief focus
- Proposal structure

---

## Step 4: Add Your Existing Context

### Import Existing Materials

**Transcripts:**
- Add example call transcripts to `gtm-context/transcripts/`
- These will be used in workflows to identify patterns

**Email Sequences:**
- If you have existing sequences, add to `gtm-context/email-sequences/`
- Workflows will reference these

**Talk Tracks:**
- Add your existing talk tracks to `gtm-context/talk-tracks/`
- Customize templates with your actual messaging

---

## Step 5: Start Your First Workflow

### Recommended First Workflow: ICP Creation

1. **Open Composer** (Cmd+I / Ctrl+I)
2. **Type:** `/icp-create`
3. **Follow the guided steps:**
   - Define your target segment
   - Create buyer personas
   - Establish qualification criteria
   - Document your ICP

### Then: Segment Selection (SOW Section 2)

1. **Type:** `/prospect`
2. **Review existing relationships and pipeline**
3. **Identify and prioritize your primary segment**
4. **Build prospect list**

### Then: Outreach Creation (SOW Section 4)

1. **Type:** `/outreach`
2. **Create your primary outbound email sequence (3-5 touches)**
3. **Create LinkedIn message flows**
4. **Customize messaging for your segment**

---

## Step 6: Work Through SOW Tasks

### SOW Section 2: Segment Selection & ICP Focus

**Workflow:** `/icp-create` → `/prospect`

**What you'll accomplish:**
- Define primary segment
- Articulate ICP
- Identify buyer roles/personas
- Establish qualification criteria

**Deliverables:**
- Updated `company-context/ICP.md`
- Updated `company-context/PERSONAS.md`
- Qualified prospect list

---

### SOW Section 3: Founding Client Offer Design

**Workflow:** Use `company-context/FOUNDING_CLIENT_OFFER.md` template

**What you'll accomplish:**
- Define offer structure, scope, outcomes
- Clarify inclusions/exclusions
- Recommend pricing and incentives
- Review and improve offer language

**Deliverables:**
- Updated `company-context/FOUNDING_CLIENT_OFFER.md`
- Offer structure document

---

### SOW Section 4: GTM Messaging & Outreach Design

**Workflow:** `/outreach`

**What you'll accomplish:**
- Refine core sales narratives
- Create "why now / why this" story
- Develop objection-handling points
- Design outbound email sequence (3-5 touches)
- Create LinkedIn message flows
- Build call outline/conversation anchor

**Deliverables:**
- Email sequence in `gtm-context/email-sequences/outbound-primary.md`
- LinkedIn flows in `gtm-context/email-sequences/linkedin-warm.md`
- Call outline/conversation anchor

---

### SOW Section 5: High-Impact Deal Support

**Workflows:** `/discovery-prep` → `/call-debrief` → `/proposal-draft`

**Pre-Call Strategy:**
- Run `/discovery-prep` before high-value meetings
- Review context, prepare questions, create call outline

**Post-Call Debrief:**
- Run `/call-debrief` after calls
- Capture notes, analyze buyer signals, assess deal health
- Identify lessons learned and next steps

**Proposal Support:**
- Run `/proposal-draft` for serious opportunities
- Structure proposal based on discovery
- Customize Founding Client Offer
- Review pricing and terms

**Deliverables:**
- Call prep documents
- Call debriefs with buyer signals and deal health
- Customized proposals

---

## Step 7: Use Workflows in Your Sales Process

### Typical Workflow Sequence

**Prospecting:**
```
/prospect → Identify and qualify prospects
/outreach → Create outreach sequences
```

**Discovery:**
```
/discovery-prep → Prepare for discovery call
[Have the call]
/call-debrief → Analyze call and plan next steps
```

**Demo:**
```
/demo-prep → Customize demo
[Have the demo]
/call-debrief → Analyze demo and plan next steps
```

**Closing:**
```
/proposal-draft → Create proposal
/objection-handle → Handle any objections
/call-debrief → Final debrief and next steps
```

---

## Tips for SOW Success

### AI-Accelerated Work (Per SOW)

- **Workflows use AI extensively** for drafting and analysis
- **You provide judgment and refinement**, not manual production
- **Focus on high-leverage activities** (strategy, review, refinement)
- **Let AI handle production work** (drafting, summarization)

### Time Management

- **Respect consultant hour constraints**
- **Use workflows efficiently** - they're designed to save time
- **Focus on high-value deals** - workflows help prioritize

### Learning Loop

- **Use `/call-debrief` after every call**
- **Capture lessons learned** - workflows help identify patterns
- **Apply insights to future calls** - update context files as you learn

---

## Quick Reference

### All Available Workflows

- `/icp-create` - Build your ICP
- `/prospect` - Identify and qualify prospects
- `/outreach` - Create outreach sequences
- `/discovery-prep` - Prepare for discovery calls
- `/demo-prep` - Prepare for demos
- `/call-debrief` - Debrief after calls
- `/objection-handle` - Handle objections
- `/proposal-draft` - Create proposals

### Key Files to Update

- `company-context/COMPANY.md` - Company overview
- `company-context/PRODUCT.md` - What you sell
- `company-context/ICP.md` - Ideal Customer Profile
- `company-context/PERSONAS.md` - Buyer personas
- `company-context/COMPETITIVE.md` - Competitive landscape
- `company-context/FOUNDING_CLIENT_OFFER.md` - Your offer structure

### Where Things Are Saved

- **Call prep:** `gtm-context/templates/call-prep-[company].md`
- **Call debriefs:** `data/meetings/debrief-[company]-[date].md`
- **Proposals:** `gtm-context/templates/proposal-[company]-[date].md`
- **Email sequences:** `gtm-context/email-sequences/`

---

## Next Steps

1. ✅ **Set up company context** (5-10 min)
2. ✅ **Import SOW details** (10 min)
3. ✅ **Run `/icp-create`** to build your ICP (15-20 min)
4. ✅ **Run `/prospect`** to identify your segment (15-20 min)
5. ✅ **Run `/outreach`** to create outreach sequences (20-30 min)
6. ✅ **Start using workflows** in your sales process!

---

**Ready? Open Composer (Cmd+I / Ctrl+I) and type `/icp-create` to get started!**

