# Task #8: Build Hidden Stream Page

**Repository:** joetey.com
**Status:** TODO
**Created:** 2026-02-05T14:45:00Z

## Context

Building a hidden stream page as a personal time capsule to document this extraordinary moment in AI history. The stream should be:

- **Hidden**: Accessible only via 's' keyboard shortcut from homepage
- **Dark**: Distinct dark aesthetic contrasting with the site's warm cream palette
- **Personal**: Raw, introspective entries synced from an Obsidian vault
- **Timeless**: Reverse-chronological entries with visible timestamps

Inspiration: https://stream.thesephist.com/ - minimalist, introspective, anti-commercial aesthetic.

## Implementation Approach

### Architecture

1. **Content source**: Markdown files from `/Users/josephtey/Library/Mobile Documents/iCloud~md~obsidian/Documents/Life/Stream`
2. **Sync method**: Manual script (`npm run sync-stream`) copies `.md` files into `src/stream/entries/`
3. **File convention**: `YYYY-MM-DD-HHmm.md` (e.g., `2026-02-05-1434.md` = Feb 5, 2026 at 2:34pm)
4. **Build integration**: Vite's `import.meta.glob` loads `.md` files as raw strings, parsed with `marked` library
5. **Dark mode scope**: Stream-only dark styling via scoped CSS, no site-wide dark mode changes
6. **Access pattern**: Keyboard shortcut listener in `App.jsx` navigates to `/s` route

### Dependencies

- `marked` - Lightweight markdown-to-HTML parser (~40KB gzipped)

### File Structure

**New files:**
- `scripts/sync-stream.sh` - Bash script to copy .md files from Obsidian
- `src/stream/Stream.jsx` - Main stream page component
- `src/stream/stream.css` - Dark mode scoped styles
- `src/stream/entries/` - Directory for synced markdown files (initially empty with .gitkeep)

**Modified files:**
- `src/index.jsx` - Add `/s` route
- `src/App.jsx` - Add 's' keyboard shortcut listener
- `package.json` - Add `marked` dependency and `sync-stream` script

### Implementation Steps

**1. Install dependency**
```bash
npm install marked
```

**2. Create sync script** (`scripts/sync-stream.sh`)
```bash
#!/bin/bash
SOURCE_DIR="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Life/Stream"
DEST_DIR="$(dirname "$0")/../src/stream/entries"
mkdir -p "$DEST_DIR"
cp "$SOURCE_DIR"/*.md "$DEST_DIR/" 2>/dev/null
COUNT=$(ls -1 "$DEST_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
echo "Synced $COUNT stream entries to src/stream/entries/"
```

Add to `package.json` scripts:
```json
"sync-stream": "bash scripts/sync-stream.sh"
```

**3. Create stream directory structure**
```bash
mkdir -p src/stream/entries
touch src/stream/entries/.gitkeep
```

**4. Create `src/stream/stream.css`**

Dark mode scoped styles:
- Background: `#0a0a0a` (near-black)
- Primary text: `#d4d4d4` (neutral-300)
- Timestamps: `#737373` (neutral-500)
- Links: `#737373` with `#404040` underline
- Entry dividers: `#262626` (neutral-800)

Key styles:
- `.stream-page` wrapper with dark background and `min-height: 100vh`
- `useEffect` to set/restore `document.body.style.backgroundColor` on mount/unmount
- Markdown content typography (p, a, em, strong, blockquote, code, ul/ol)

**5. Create `src/stream/Stream.jsx`**

Core component structure:
```jsx
import { marked } from "marked";
import "./stream.css";

const entryModules = import.meta.glob("./entries/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

function parseFilename(filepath) {
  const filename = filepath.split("/").pop();
  const match = filename.match(/(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})\.md$/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}

function formatTimestamp(date) {
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
  return `${dateStr} • ${timeStr}`;
}
```

Features:
- Parse entries, sort reverse-chronologically
- Display header: "stream" with tagline "fragments, as they come"
- Map entries with staggered Framer Motion animations
- Individual entry component with timestamp + markdown HTML
- `useEffect` to set `document.body.style.backgroundColor = "#0a0a0a"` on mount, restore on unmount

**6. Add route in `src/index.jsx`**

After line 16, add import:
```jsx
import Stream from "./stream/Stream";
```

After line 42 (before closing `</Routes>`), add route:
```jsx
{/* stream */}
<Route path="/s" element={<Stream />} />
```

**7. Add keyboard shortcut in `src/App.jsx`**

After line 12 (inside the `App` function), add:
```jsx
useEffect(() => {
  const handleKeyDown = (e) => {
    // Don't trigger if user is typing in an input/textarea
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "s" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      navigate("/s");
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [navigate]);
```

Add React import if not already present (it is on line 7):
```jsx
import React, { useState, useEffect } from "react";
```

## Design Specification

**Color palette:**
- Background: `#0a0a0a`
- Primary text: `#d4d4d4`
- Timestamps: `#737373`
- Page title: `#a3a3a3`
- Links: `#737373` with `#404040` underline
- Entry dividers: `#262626`

**Typography:**
- Font: EB Garamond (same as main site)
- Entry body: `text-lg` with `leading-relaxed`
- Timestamps: `text-xs` with `tracking-wide`
- Page title: `text-2xl`

**Layout:**
- Max width: `680px` (narrower than main site's 800px for intimacy)
- Padding: `py-16 tablet:py-32`
- Entry spacing: `py-8` with hairline border dividers
- No back button or navigation (hidden space aesthetic)

**Animations:**
- Page fade-in: 0.6s opacity
- Entry stagger: 0.05s delay per entry
- Subtle y-axis slide: 10px upward as entries fade in

## Usage Workflow

1. **Write** in Obsidian at `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Life/Stream/2026-02-05-1434.md`
2. **Sync** by running `npm run sync-stream`
3. **Preview** with `npm run dev`
4. **Deploy** with git commit + push (Vercel auto-deploys)

Note: Stream entries should be committed to git so they're available at build time.

## Verification

**Test checklist:**
1. Run `npm run sync-stream` - files appear in `src/stream/entries/`
2. Press 's' on homepage - navigates to `/s`
3. Press 's' in input field - does NOT navigate
4. Ctrl/Cmd/Alt + S - does NOT navigate
5. Navigate to `/s` directly - page renders
6. Entries display in reverse-chronological order
7. Timestamps formatted as "Feb 5, 2026 • 2:34pm"
8. Markdown renders (bold, italic, links, blockquote, code, lists)
9. Dark mode isolated - navigate back to homepage, cream background restored
10. `document.body.style.backgroundColor` restored on unmount
11. Responsive on mobile widths
12. Empty state (no entries) renders cleanly
13. Framer Motion animations working
14. Production build works (`npm run build && npm run preview`)

## Critical Files to Modify

- `/Users/josephtey/Projects/joetey.com/package.json` - Add `marked` dependency and `sync-stream` script
- `/Users/josephtey/Projects/joetey.com/src/App.jsx` - Add keyboard shortcut `useEffect` (line 13+)
- `/Users/josephtey/Projects/joetey.com/src/index.jsx` - Import Stream component (line 17) and add `/s` route (line 43)
- `/Users/josephtey/Projects/joetey.com/src/stream/Stream.jsx` - New file: core stream page
- `/Users/josephtey/Projects/joetey.com/src/stream/stream.css` - New file: dark mode styles
- `/Users/josephtey/Projects/joetey.com/scripts/sync-stream.sh` - New file: sync script

## Implementation Sequence

1. Install `marked` dependency
2. Create `scripts/sync-stream.sh`
3. Add `sync-stream` script to `package.json`
4. Create `src/stream/entries/` directory with `.gitkeep`
5. Create `src/stream/stream.css`
6. Create `src/stream/Stream.jsx`
7. Add route in `src/index.jsx`
8. Add keyboard shortcut in `src/App.jsx`
9. Create test entry and verify
10. Test all verification scenarios
11. Build and verify production bundle

## Success Criteria

- Feature works as described
- 's' keyboard shortcut navigates to `/s` (but not from input fields)
- Stream page displays with dark aesthetic
- Entries display in reverse-chronological order with proper timestamps
- Markdown content renders correctly
- Dark mode is isolated to stream page only
- Code follows repository conventions
- Production build works correctly
