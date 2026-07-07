# Product Demo Workflow Skill

Complete workflow for creating product demos combining screen recording and AI-generated content.

## Workflow Overview

1. **Record** product usage with OpenScreen
2. **Generate** promotional clips with AI video tools
3. **Combine** into polished demo

## Quick Start

### 1. Record Your Product (OpenScreen)
```powershell
# Launch OpenScreen and record
.\record.ps1 -DurationSeconds 30 -OutputPath ".\demo-raw.mp4"
```

### 2. Generate AI Promo Clip (Creen AI)
```bash
node generate-video.js "Futuristic dashboard with holographic data visualization"
```

### 3. Combine (Optional - FFmpeg)
```bash
ffmpeg -i "concat:demo-raw.mp4|promo.mp4" -c copy final-demo.mp4
```

## Scripts

### record.ps1 - Screen Recording
Automates OpenScreen for hands-free recording.

### generate-video.js - AI Video Generation
Uses Playwright to generate videos on Creen AI.

### full-demo.ps1 - Complete Workflow
Runs both recording and AI generation in sequence.

## Best Practices

### For Screen Recording
- Close unnecessary apps
- Set recording area to your product window
- Use 10-30 second clips
- Enable cursor highlighting in OpenScreen settings

### For AI Video Generation
- Use descriptive prompts with style keywords
- Include "product demo", "dashboard", "UI" for relevant results
- Generate 5-10 second clips
- Download immediately (credits may expire)

### For Product Demos
- Start with AI-generated hook (3-5 seconds)
- Show actual product usage (15-30 seconds)
- End with call-to-action
- Keep total length under 60 seconds

## File Structure

```
product-demo/
├── raw-recordings/      # OpenScreen output
├── ai-generated/        # Creen AI output
├── final/              # Combined demos
└── scripts/            # Automation scripts
```

## Supported Platforms

| Platform | Purpose | Cost |
|----------|---------|------|
| OpenScreen | Screen recording | Free |
| Creen AI | AI video generation | Free tier |
| LoreMotion | AI video generation | Free |
| Hedra AI | AI video generation | Free |

## Customization

Edit prompts in generate-video.js to match your product style:
- Tech/SaaS: "modern dashboard, dark UI, glowing charts"
- E-commerce: "product showcase, clean background, floating items"
- Mobile app: "phone mockup, app interface, smooth animations"
