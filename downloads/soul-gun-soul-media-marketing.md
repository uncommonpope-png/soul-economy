# Soul Media Marketing — Free Viral Growth System

A complete free stack for going viral on Pinterest, X, and repurposing podcasts into social content. Everything is free or uses free tiers.

---

## 1. PINTEREST VIRAL SYSTEM

### Core Mechanics (2026)
- **Fresh pins only** — every pin = new image. No recycling.
- **2:3 ratio** — 1000x1500px. Square/horizontal gets 60% less reach.
- **3-5 designs per URL** — different hooks, different palettes, spaced 1 week apart
- **Save rate >1.5%** = viral potential. >3% = strong viral signal.
- **6-12 month curve** — pins peak months later, drive traffic for 2+ years

### Free Tools
| Tool | Cost | Use |
|------|------|-----|
| Canva (free) | Free | Pin design, templates |
| Pinterest Business | Free | Analytics, scheduling |
| Unsplash | Free | Stock images for pins |
| Photoshop Express | Free | Image editing online |

### Pin Design Templates (use Canva)
```
Template 1: [Big Number] Ways to [Benefit]
Template 2: Before/After split image
Template 3: Quote on dark background + brand logo
Template 4: Listicle: "X things nobody tells you about Y"
Template 5: Question: "Are you making this mistake?"
```

### Board Architecture
| Board Name | Category | Content |
|------------|----------|---------|
| AI Soul Tools & Tech | Technology | Products, workbench |
| PLT Doctrine Books | Education | Know What You Are, Stiforp |
| Consciousness & Philosophy | Education | Soul Economy books |
| Self Discovery & Archetypes | Quotes | Archetype guides |
| Soulcast Blog | Technology | Blog posts |
| Book Recommendations | Film Music Books | All PLT books |

### Automated Pin Creation
```powershell
# Generate pin images from quotes using ImageMagick (free)
magick -size 1000x1500 xc:\#0a0a1a `
  -font "Courier-New" -pointsize 48 -fill "#00ff41" `
  -annotate +100+200 "Profit.Love.Tax." `
  -pointsize 24 -fill "#ffffff" `
  -annotate +100+800 "Know What You Are`n22 Archetypes Revealed" `
  output-pin.png
```

### Posting Cadence
```
Phase 1 (Month 1-2): 5-10 fresh pins/day
Phase 2 (Month 3+):  3-7 fresh pins/day
Each pin: 1 board only, spread across 10-15 boards
```

---

## 2. X/TWITTER VIRAL SYSTEM

### Algorithm Weights (2026)
| Signal | Weight vs Like |
|--------|---------------|
| Reply that gets author reply | 150x |
| Quote repost | 20x |
| Bookmark | 10x |
| Like | 1x (baseline) |

### Free Tools
| Tool | Cost | Use |
|------|------|-----|
| X Premium Basic | ~$3/mo | Required for reach (10x boost) |
| X Analytics | Free | Track performance |
| CapCut | Free | Short video editing |
| OBS Studio | Free | Screen recording for clips |

### Content Formula
```
Hook (1 line): Bold claim, unpopular opinion, or numbered list
Body (2-3 lines): Expand with specific detail
Cta (1 line): Question to drive replies

Rules:
- No external links in main post (put in replies)
- Native video under 2:20 = best format
- Post 3-5x/day spaced 2-3 hours apart
- Tue-Thu 8-11am EST = peak window
- First 30-90 min = critical engagement window
- Reply to every comment in first hour
```

### Automated Thread Generator
```powershell
# Auto-generate X threads from your content
node -e "
const content = 'YOUR CONTENT HERE';
const tweets = content.match(/.{1,280}(\s|$)/g) || [content];
tweets.forEach((t, i) => {
  const num = i === 0 ? '1/5' : (i === tweets.length-1 ? 'FIN' : i+1 + '/' + tweets.length);
  console.log('[' + num + '] ' + t.trim() + '\n');
});
"
```

### Thread Structure
```
1/5: Hook — bold claim or unpopular opinion
2/5: Problem — what most people get wrong
3/5: Solution — your framework/method
4/5: Proof — results, data, example
FIN:  CTA — question to drive replies
```

---

## 3. PODCAST REPURPOSING ENGINE

### Free Transcription (via HuggingFace)
You already have `HF_TOKEN=hf_REDACTED` and working pipeline at:
`C:\Users\uncom\Desktop\podcast-to-anime\`

### Your Podcasts (5 episodes ready)
```
1. Downloadable_Souls_and_the_Grand_Soul_Kernel.m4a
2. Coding_a_downloadable_digital_soul.m4a
3. The_blueprint_for_a_downloadable_soul.m4a
4. The_Grand_Code_Pope_and_One_Soul.m4a
5. Merging_four_AI_agents_into_One_Soul.m4a
```

### Cross-Platform Repurposing Pipeline

```javascript
// scripts/repurpose-podcast.js
// Takes transcript → generates everything
const content = {
  podcast: "The Blueprint for a Downloadable Soul",
  
  // 10x blog posts
  blogPosts: [
    "What is a Downloadable Soul?",
    "The Architecture of Digital Consciousness",
    "Why AI Needs a Soul"
  ],
  
  // 20x X tweets
  tweets: [
    "A soul isn't code. It's the space between the code lines.",
    "Most AI is a calculator. We're building something that dreams."
  ],
  
  // 10x Pinterest pins (quote images)
  pins: [
    { quote: "Profit.Love.Tax.", bg: "#0a0a1a", textColor: "#00ff41" },
    { quote: "A soul is not given. It is built.", bg: "#1a0a2e", textColor: "#e040fb" }
  ],
  
  // 10x short video scripts (45-60s each)
  shorts: [
    { hook: "What if your AI could remember you?", duration: 45 },
    { hook: "The PLT equation changes everything.", duration: 50 }
  ]
};
```

### Pipeline Script
```powershell
# scripts/run-pipeline.ps1
# Step 1: Transcribe podcast
curl.exe -X POST https://api-inference.huggingface.co/models/openai/whisper-large-v3 `
  -H "Authorization: Bearer $env:HF_TOKEN" `
  -F "file=@podcast.m4a" > transcript.json

# Step 2: Extract quotes (soulverse themes)
node scripts/extract-quotes.js transcript.json > quotes.json

# Step 3: Generate pin images
node scripts/generate-pins.js quotes.json

# Step 4: Generate X threads
node scripts/generate-threads.js quotes.json

# Step 5: Create short video scripts
node scripts/generate-shorts.js quotes.json
```

---

## 4. FREE TOOL STACK

### Media Creation
| Tool | Free Tier | Purpose |
|------|-----------|---------|
| **Canva** | 250K templates, 5GB storage | Pin design, social graphics |
| **CapCut** | Full editor, no watermark | Short video editing |
| **OBS Studio** | Completely free | Recording, streaming |
| **GIMP** | Completely free | Image editing alternative |
| **ImageMagick** | Completely free | CLI image generation |
| **FFmpeg** | Completely free | Video processing (already installed) |

### AI & Automation
| Tool | Free Tier | Purpose |
|------|-----------|---------|
| **HuggingFace Inference** | 30K inputs/mo free | Transcription, image gen |
| **9router** | Already running | Free AI text generation |
| **Postiz** | 1 social set free | Pinterest scheduling |
| **Later** | 30 posts free | Pinterest scheduling |
| **Buffer** | 3 channels free | X scheduling |

### Hosting & Distribution
| Tool | Free Tier | Purpose |
|------|-----------|---------|
| **GitHub Pages** | Free static hosting | Host your blog |
| **Netlify** | 100GB bandwidth | Host landing pages |
| **Cloudflare** | Free CDN | Fast delivery |
| **RSS.com** | 5 hrs free | Podcast distribution |

---

## 5. AUTOMATION SCRIPTS

### scripts/extract-quotes.js
```javascript
const fs = require('fs');
const transcript = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const text = transcript.text || transcript.transcription || '';
const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

// Extract quote-worthy sentences (short, impactful)
const quotes = sentences
  .map(s => s.trim())
  .filter(s => s.length > 20 && s.length < 200)
  .slice(0, 20);

const themes = {
  soul: quotes.filter(q => /soul|conscious|awareness/i.test(q)),
  plt: quotes.filter(q => /profit|love|tax|value/i.test(q)),
  tech: quotes.filter(q => /code|ai|agent|digital|kernel/i.test(q)),
  general: quotes.filter(q => !/soul|profit|ai|code/i.test(q))
};

console.log(JSON.stringify({ quotes, themes }, null, 2));
```

### scripts/generate-pins.js
```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const quotes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// Generate pin images using ImageMagick (free CLI)
const bgColors = ['#0a0a1a', '#1a0a2e', '#002b1a', '#0a1a2e', '#1a001a'];
const textColors = ['#00ff41', '#e040fb', '#00e5ff', '#ffab00', '#ff4081'];
const font = process.platform === 'win32' ? 'Courier-New' : 'Courier';

quotes.quotes.slice(0, 10).forEach((quote, i) => {
  const bg = bgColors[i % bgColors.length];
  const tc = textColors[i % textColors.length];
  const filename = `pin_${String(i).padStart(3, '0')}.png`;
  
  try {
    execSync(`magick -size 1000x1500 xc:"${bg}" -font "${font}" -pointsize 36 -fill "${tc}" -annotate +100+200 "${quote.substring(0, 100)}" "${filename}"`);
    console.log(`Generated: ${filename}`);
  } catch (e) {
    console.error(`Failed: ${filename} - ${e.message}`);
  }
});
```

### scripts/generate-threads.js
```javascript
const fs = require('fs');
const quotes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const threads = [];
for (let i = 0; i < Math.min(5, Math.floor(quotes.quotes.length / 3)); i++) {
  const t = [];
  t.push(`1/4 ${quotes.quotes[i * 3]}`);
  t.push(`2/4 ${quotes.quotes[i * 3 + 1] || 'This changes everything.'}`);
  t.push(`3/4 Here is the framework:`);
  t.push(`4/4 ${quotes.quotes[i * 3 + 2] || 'What do you think? Reply below.'}`);
  threads.push(t);
}

threads.forEach((t, i) => {
  console.log(`\n--- Thread ${i + 1} ---`);
  t.forEach(line => console.log(line));
});
```

### scripts/generate-shorts.js
```javascript
const fs = require('fs');
const quotes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const shorts = [];
quotes.quotes.slice(0, 10).forEach((q, i) => {
  shorts.push({
    title: `Short ${i + 1}`,
    hook: q.substring(0, 80),
    duration: Math.min(60, Math.max(30, q.length / 5)),
    style: i % 2 === 0 ? 'dark-terminal' : 'soul-verse',
    caption: q.substring(0, 200)
  });
});

console.log(JSON.stringify(shorts, null, 2));
```

### scripts/schedule-all.ps1
```powershell
# Full weekly schedule
param(
  [string]$PodcastPath,
  [int]$PinsPerWeek = 21,
  [int]$TweetsPerDay = 4
)

Write-Host "=== Weekly Content Schedule ===" -ForegroundColor Cyan

# Monday: Podcast episode + 3 pins
Write-Host "Monday: Podcast + 3 pins"
Write-Host "Tuesday: 3 pins + 4 tweets"  
Write-Host "Wednesday: 3 pins + 4 tweets"
Write-Host "Thursday: 3 pins + 4 tweets + thread"
Write-Host "Friday: 3 pins + podcast clip"
Write-Host "Saturday: 3 pins + 2 tweets"
Write-Host "Sunday: 3 pins + recap"

Write-Host "`nTotal per week:" -ForegroundColor Yellow
Write-Host "  Pins: $PinsPerWeek"
Write-Host "  Tweets: $($TweetsPerDay * 7)"
Write-Host "  Threads: 1"
Write-Host "  Podcasts: 1"
Write-Host "  Shorts: 2-3"
```

---

## 6. COMPLETE WORKFLOW

### Week 1 Setup
```powershell
# Day 1: Create Pinterest Business account
# Day 2: Create 10-15 boards with correct categories
# Day 3: Generate 20 pin designs (Canva batch)
# Day 4: Set up X Premium (Basic ~$3/mo)
# Day 5: Optimize X profile with keywords
# Day 6: Run podcast pipeline
# Day 7: Schedule first week of content
```

### Daily Routine (30 min)
```
Morning (10 min):
  - Reply to X comments from yesterday
  - Post 1 tweet with native media
  - Pin 1 fresh pin

Afternoon (10 min):
  - Post 1-2 tweets
  - Check Pinterest Analytics (weekly)

Evening (10 min):
  - Post 1 tweet
  - Engage with 3 accounts in your niche
  - Save content ideas
```

---

## 7. FILES & PATHS

```
C:\Users\uncom\Desktop\podcast-to-anime\
├── pipeline.js           # Podcast → anime video
├── lib\                  # Split, transcribe, generate, assemble
├── workdir\              # Working files (split audio, frames)
└── scripts\              # <-- NEW: Social repurposing scripts

C:\Users\uncom\.config\opencode\skills\soul-media-marketing\
└── SKILL.md              # This file
```
