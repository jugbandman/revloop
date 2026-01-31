# Notion Sync Setup Checklist

> **DEPRECATED (Jan 30, 2026):** This RevLoop Notion sync was never operationalized. The code exists but databases were never set up. For current Notion integration, see the MCP server configured in the Obsidian vault's `.mcp.json` (uses HyperAdaptive token).

Quick reference for setting up the Notion ↔ RevLoop bidirectional sync system.

## ✅ Implementation Complete

All code has been implemented. You now need to:

1. **Set up Notion databases** (see main README)
2. **Get Notion API key** (see main README)
3. **Configure environment variables** (see below)
4. **Set up Zapier workflows** (see ZAPIER_SETUP.md)
5. **Install dependencies** (`pnpm install`)
6. **Test the sync** (see below)

---

## Quick Start

### 1. Environment Variables

Add to `.env`:

```bash
NOTION_API_KEY=secret_...
NOTION_CLIENT_CONTEXT_DB_ID=...
NOTION_TRANSCRIPTS_DB_ID=...
NOTION_MEETINGS_DB_ID=...
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install `@notionhq/client` and other dependencies.

### 3. Test Pull

```bash
# Pull client context from Notion
revloop sync pull --clients

# Pull transcripts from Notion
revloop sync pull --transcripts

# Pull everything
revloop sync pull --all
```

### 4. Test Push

```bash
# Dry run first
revloop sync push --meetings --dry-run

# Actually push
revloop sync push --meetings
```

---

## File Structure Created

```
data/
├── clients/              # Client context (from Notion)
│   └── [company-name]/
│       ├── emails/
│       │   └── [date]-[subject].md
│       ├── context.json
│       └── README.md
├── transcripts/         # Transcripts (from Notion)
├── meetings/           # Enhanced meetings (pushed to Notion)
└── sync-mapping.json   # Maps local ↔ Notion records
```

---

## Workflow Integration

### Discovery Prep (`/discovery-prep`)

- Automatically checks `data/clients/[company-name]/` for existing context
- Reads email history if available
- Uses context to personalize questions

### Call Debrief (`/call-debrief`)

- Saves enhanced meeting as both `.md` and `.json`
- Reminds you to run `revloop sync push --meetings`
- Links meeting to client context in Notion

---

## Next Steps

1. ✅ Code implemented
2. ⏳ Set up Notion databases (follow README instructions)
3. ⏳ Get API key and add to `.env`
4. ⏳ Set up Zapier (follow ZAPIER_SETUP.md)
5. ⏳ Run `pnpm install`
6. ⏳ Test with `revloop sync pull --all`
7. ⏳ Try workflows with real client context

---

## Troubleshooting

**"Missing Notion configuration" error:**
- Check `.env` has all 4 required variables
- Verify variable names are correct (case-sensitive)

**"Database not found" error:**
- Check database IDs are correct (from Notion URL)
- Verify integration has access to databases

**"No client context found":**
- Run `revloop sync pull --clients` first
- Check Zapier is capturing emails correctly
- Verify label pattern matches in Zapier

**Enhanced meetings not pushing:**
- Ensure JSON files exist in `data/meetings/`
- Check file format matches `EnhancedMeeting` type
- Run with `--dry-run` to see what would be pushed

---

## Support

- See main README.md for full documentation
- See ZAPIER_SETUP.md for Zapier configuration
- Check `packages/notion-sync/` for implementation details
