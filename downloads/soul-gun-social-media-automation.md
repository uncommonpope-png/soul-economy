---
name: social-media-automation
description: Playwright-based social media automation for cross-posting to Pinterest, BlueSky, and Mastodon. Use when the user asks about posting to social media, automating pins, cross-posting content, managing social queues, or running the social media pipeline for buyasoul.online.
metadata:
  created: 2026-06-20
  platforms: pinterest, bluesky, mastodon
  module-path: C:\Users\Public\allie-pinterest-module
  media-path: C:\Users\Public\allie-media
---

# Social Media Automation

Playwright-based cross-platform social media posting for buyasoul.online. Handles image uploads, content formatting, and platform-specific posting for Pinterest, BlueSky, and Mastodon.

## Media Directory

All product and promotional images live in `C:\Users\Public\allie-media\` organized by platform readiness:

```
allie-media/
├── products/           # Product images for all platforms
│   ├── books/         # PLT Doctrine book covers
│   ├── souls/         # AI soul product images
│   └── blog/          # Blog post graphics
├── pinterest/          # Pinterest-optimized (2:3 ratio variants)
├── mastodon/           # Mastodon-ready images
├── bluesky/            # BlueSky-ready images
└── pin-queue.json      # Pinterest posting queue
```

Image source: `C:\Users\Public\cosmic-pyramid-library\generated-images\` (33 product images)

## Pinterest Automation

Module: `C:\Users\Public\allie-pinterest-module\`

### Files
- `go.js` — Main posting script (Playwright-based, opens browser)
- `pin-queue.json` — Queue of pins to post with status tracking
- `posted-pins.json` — Log of successfully posted pins
- `pinterest-cookies.json` — Saved auth cookies (auto-refreshed)
- `debug-btn.js`, `debug-page.js` — Debug helpers for UI inspection

### How Posting Works

```javascript
const { PinterestClient } = require('pinterest-js-client');

// Init with cookies
const client = new PinterestClient({
  headless: false,
  useFingerprintSuite: true,
  viewport: { width: 1280, height: 900 },
  cookies: savedCookies,
  disableFileCookies: true
});
await client.init();
client.isLoggedIn = true;  // Skip auth check when cookies loaded

// Post a pin by navigating to pin-builder, uploading image, filling fields, clicking Publish
// go.js handles: image upload, title, description, link, and publish via correct selectors
```

### Key Selectors (Pinterest Pin Builder)

| Field | Selector |
|---|---|
| File input | `input[type="file"]` |
| Title textarea | `[data-test-id="pin-draft-title-text-area-container"] textarea` |
| Description editor | `[data-test-id="editor-with-mentions"] [contenteditable="true"]` |
| Link input | `[data-test-id="pin-draft-link"] input` |
| Publish button | `[data-test-id="board-dropdown-save-button"]` (div[role="button"]) |

### Pin Queue Format

```json
{
  "id": "pin_book_001",
  "title": "Know What You Are — PLT Book I",
  "description": "The book that starts it all...",
  "link": "https://buyasoul.online/products/know-what-you-are",
  "image": "C:\\Users\\Public\\cosmic-pyramid-library\\generated-images\\know-what-you-are.png",
  "board": "PLT Doctrine Books",
  "hashtags": ["#PLTDoctrine", "#KnowWhatYouAre"],
  "status": "pending|posted|failed"
}
```

To post: `cd C:\Users\Public\allie-pinterest-module && node go.js`

### Pinterest Marketing Strategy

See `pinterest-marketing-seo` skill for board categories, hashtag strategy, keyword research, and pin optimization rules. Boards should use correct categories (Technology, Education, Books, Quotes) for algorithm distribution.

## BlueSky Automation

Allie already has BlueSky integration via her bridge/bot system. BlueSky posting uses the AT Protocol. Authentication is handled via the bridge.

To send content to BlueSky via Allie's memory system, write a journal entry with `source: "bluesky"` tag and the bridge will pick it up.

## Mastodon Automation

(Planned — same Playwright approach, target platform TBD)

## Adding New Images

1. Place raw images in `C:\Users\Public\allie-media\products\` organized by type
2. Create Pinterest-optimized variants (2:3 ratio, 1000x1500px) in `allie-media\pinterest\`
3. Add a new entry to `pin-queue.json` with the full image path, title, description, link, board, and hashtags
4. Run `node go.js` from `allie-pinterest-module` to post
