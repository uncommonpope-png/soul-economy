# Playwright Web Automation Skill

Use this skill for browser automation, web scraping, and interacting with web applications.

## Setup

```bash
npm install playwright
npx playwright install chromium
```

## Basic Template

```javascript
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  await page.goto('https://example.com');
  await page.waitForLoadState('networkidle');
  
  // Your automation here
  
  await browser.close();
})();
```

## Key Patterns

### Click Buttons
```javascript
// By text
await page.click('text=Submit');
await page.click('button:has-text("Submit")');

// By selector
await page.click('button.submit');
await page.click('[data-testid="submit"]');

// Force click (bypasses visibility checks)
await page.click('button', { force: true });

// By coordinates (last resort)
await page.mouse.click(1158, 558);
```

### Fill Forms
```javascript
await page.fill('input[name="email"]', 'user@example.com');
await page.fill('textarea', 'Your text here');
await page.selectOption('select#dropdown', 'option1');
```

### Wait for Elements
```javascript
await page.waitForSelector('#element', { timeout: 10000 });
await page.waitForTimeout(2000);
await page.waitForLoadState('networkidle');
```

### Take Screenshots
```javascript
await page.screenshot({ path: 'screenshot.png' });
await page.screenshot({ path: 'full.png', fullPage: true });
```

### JavaScript Evaluation
```javascript
const result = await page.evaluate(() => {
  return document.title;
});

// Click via JS (bypasses Playwright's actionability checks)
await page.evaluate(() => {
  document.querySelector('button').click();
});
```

### Download Files
```javascript
// Method 1: Via download event
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('text=Download')
]);
await download.saveAs('path/file.ext');

// Method 2: Direct URL download
const videoSrc = await page.evaluate(() => document.querySelector('video')?.src);
const response = await page.request.get(videoSrc);
const buffer = await response.body();
require('fs').writeFileSync('video.mp4', buffer);
```

## Debugging

1. Use `headless: false` to watch automation
2. Take screenshots at each step
3. Log button/element counts
4. Use `page.evaluate` to inspect DOM state

## Common Issues

**Button not clicking?**
- Try `force: true`
- Use `page.evaluate(() => btn.click())`
- Click by coordinates

**Element not found?**
- Wait longer with `waitForSelector`
- Check if element is in iframe
- Verify selector with `page.$$(selector)`

## Example: AI Video Generator

```javascript
// Click generate button by finding circular buttons with SVG
await page.evaluate(() => {
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    const rect = btn.getBoundingClientRect();
    const svg = btn.querySelector('svg');
    if (svg && rect.width > 30 && rect.width < 60 && rect.y > 500) {
      btn.click();
      return;
    }
  }
});
```
