# @revloop/desktop

Mac menu bar app for audio capture and transcript processing.

## Overview

This Electron app lives in your Mac menu bar and provides:
- One-click audio recording
- Automatic transcript processing via RevLoop core
- Quick access to daily planning

## Development

```bash
# From revloop root
pnpm desktop:dev

# Or from this directory
pnpm dev
```

## Building

```bash
# Create DMG for distribution
pnpm desktop:build
```

## Features (Planned)

- [ ] Audio recording with system audio capture
- [ ] Automatic transcription
- [ ] Push to RevLoop for processing
- [ ] Keyboard shortcuts for quick capture
- [ ] Integration with @revloop/core for task extraction
