# Zapier Setup Guide for RevLoop Notion Sync

This guide walks you through setting up Zapier workflows to automatically capture emails and transcripts into Notion, which RevLoop can then sync locally.

## Overview

**Data Flow:**
1. Superhuman email (labeled) → Zapier → Notion `client-context` database
2. granola.ai transcript → Zapier/Notion → Notion `transcripts` database
3. `revloop sync pull` → Downloads from Notion to local files
4. Workflows use local files
5. `revloop sync push` → Uploads enhanced meetings back to Notion

---

## Prerequisites

- Zapier account (paid subscription recommended)
- Superhuman account
- Notion workspace with RevLoop databases set up
- Notion API integration created (see main README)

---

## Zap 1: Superhuman → Notion (Email Capture)

### Step 1: Create New Zap

1. Go to Zapier → Create Zap
2. Name it: "Superhuman → Notion Client Context"

### Step 2: Set Up Trigger

**App:** Superhuman
**Trigger:** New Email with Label

**Configuration:**
- Label Pattern: `hyperadaptive*` (matches any label starting with "hyperadaptive")
- This will catch:
  - `hyperadaptive`
  - `hyperadaptive/progress`
  - `hyperadaptive/acme-corp`
  - etc.

**Test:** Send yourself a test email with the label

### Step 3: Set Up Action

**App:** Notion
**Action:** Create Database Item

**Database:** Select your `client-context` database

**Field Mapping:**

| Notion Field | Value Source | Notes |
|-------------|--------------|-------|
| Company | Custom (Code) | See parsing logic below |
| Email Thread | Email Body | Full email content |
| Email Date | Email Date | When email was received |
| Label | Email Label | Full label path |
| Status | Static | "active" |

### Step 4: Company Name Parsing

Add a Code step between Trigger and Action to parse the company name:

**Code (JavaScript):**
```javascript
// Extract company name from label
const label = inputData.label || '';
let company = 'Unknown';

if (label === 'hyperadaptive') {
  company = 'hyperadaptive';
} else if (label.startsWith('hyperadaptive/')) {
  // Extract company from label like "hyperadaptive/progress"
  const parts = label.split('/');
  if (parts.length > 1) {
    company = parts[1];
    // Convert to company name format
    // e.g., "progress" → "progress.com" or keep as-is
    // Adjust based on your naming convention
  }
}

return {
  company: company,
  label: label
};
```

**Output:** Map `company` to Notion "Company" field

### Step 5: Email Content Formatting

Add another Code step to format email content:

**Code (JavaScript):**
```javascript
const subject = inputData.subject || 'No Subject';
const from = inputData.from || 'Unknown';
const to = inputData.to || '';
const body = inputData.body || '';

const formatted = `Subject: ${subject}
From: ${from}
To: ${to}
Date: ${inputData.date || new Date().toISOString()}

---

${body}`;

return {
  formattedEmail: formatted
};
```

**Output:** Map `formattedEmail` to Notion "Email Thread" field

### Step 6: Test and Turn On

1. Test the Zap with a sample email
2. Verify record appears in Notion
3. Turn on the Zap

---

## Zap 2: granola.ai → Notion (Transcript Capture)

### Option A: granola.ai Already Writes to Notion

If granola.ai is already integrated with Notion and creates pages automatically:

1. **No Zap needed** - granola.ai handles it
2. **Ensure pages are in your database:**
   - Make sure granola.ai creates pages in your `transcripts` database
   - Or set up a Zap to move pages from granola.ai's database to yours

### Option B: granola.ai → Notion via Zapier

If granola.ai doesn't write directly to Notion:

**Trigger Options:**
- granola.ai - New Transcript (if available)
- Webhook - If granola.ai can send webhooks
- Email - If granola.ai emails transcripts

**Action:** Notion - Create Database Item

**Field Mapping:**

| Notion Field | Value Source |
|-------------|--------------|
| Title | Transcript Title |
| Date | Call Date |
| Transcript | Full Transcript Text |
| Source | Static: "granola.ai" |
| Company | Extract from transcript metadata or link manually |

**Company Linking:**
- If transcript mentions a company, extract it
- Or create a relation to existing `client-context` record
- May require manual linking in some cases

---

## Testing Your Setup

### 1. Test Email Capture

1. Send yourself an email in Superhuman
2. Label it `hyperadaptive/test-company`
3. Check Zapier → Should trigger
4. Check Notion → Should see new record in `client-context` database
5. Run `revloop sync pull --clients`
6. Check `data/clients/test-company/` → Should see email files

### 2. Test Transcript Capture

1. Create a transcript in granola.ai (or wait for one)
2. Check Notion → Should see new record in `transcripts` database
3. Run `revloop sync pull --transcripts`
4. Check `data/transcripts/` → Should see transcript file

### 3. Test Full Workflow

1. Pull context: `revloop sync pull --all`
2. Run `/discovery-prep` workflow → Should find client context
3. Run `/call-debrief` workflow → Creates enhanced meeting
4. Push to Notion: `revloop sync push --meetings`
5. Check Notion → Should see enhanced meeting linked to client

---

## Troubleshooting

### Emails Not Appearing in Notion

- Check Zapier task history for errors
- Verify label pattern matches (`hyperadaptive*`)
- Check Notion database permissions (integration must have access)
- Verify field names match exactly (case-sensitive)

### Company Names Not Parsing Correctly

- Adjust the Code step parsing logic
- Check label format in Superhuman
- Verify company name format in Notion

### Sync Not Working

- Verify `.env` has correct `NOTION_API_KEY` and database IDs
- Check database IDs are correct (from Notion URL)
- Run `revloop sync pull --clients --dry-run` to test
- Check `data/clients/` directory exists and is writable

### Enhanced Meetings Not Pushing

- Verify enhanced meeting JSON files exist in `data/meetings/`
- Check file format matches `EnhancedMeeting` type
- Run with `--dry-run` first to see what would be pushed
- Check Notion API rate limits (100 requests per second)

---

## Advanced: Multi-Company Label Structure

If you have multiple companies/projects:

**Label Structure:**
- `hyperadaptive` - General HyperAdaptive emails
- `hyperadaptive/progress` - Progress.com client
- `hyperadaptive/acme` - Acme Corp client
- `hyperadaptive/internal` - Internal communications

**Parsing Logic:**
```javascript
const label = inputData.label || '';
let company = 'hyperadaptive';
let category = 'general';

if (label.includes('/')) {
  const parts = label.split('/');
  company = parts[0]; // "hyperadaptive"
  category = parts[1]; // "progress", "acme", etc.
  
  // Map category to company name
  const companyMap = {
    'progress': 'progress.com',
    'acme': 'Acme Corp',
    'internal': 'HyperAdaptive Internal'
  };
  
  company = companyMap[category] || category;
}

return { company, label };
```

---

## Best Practices

1. **Label Consistently:** Use consistent label patterns in Superhuman
2. **Regular Syncs:** Run `revloop sync pull` before workflows to get latest context
3. **Push After Calls:** Always run `revloop sync push --meetings` after `/call-debrief`
4. **Monitor Zapier:** Check task history weekly for failed tasks
5. **Backup:** Notion is source of truth, but keep local files in git (excluding sensitive data)

---

## Next Steps

Once Zapier is set up:
1. Test with a few emails and transcripts
2. Run `revloop sync pull --all` to download everything
3. Try `/discovery-prep` workflow - it should find client context automatically
4. After calls, run `/call-debrief` then `revloop sync push --meetings`
5. Enjoy having all your client context in one place! 🎉
