---
name: opencode-skill-synthesizer
description: Generates new OpenCode skills (SKILL.md files) compliant with OpenCode's format and deployment rules.
license: MIT
compatibility: opencode
metadata:
  audience: agent
  workflow: self-modification
---
## Key Insights
- **Standardized Skill Definition:** This skill enables GSK to generate new skills compliant with the OpenCode `SKILL.md` format, including required YAML frontmatter (`name`, `description`) and adherence to naming/length rules.
- **Dynamic Skill Deployment:** Facilitates the creation and placement of these `SKILL.md` files in appropriate discovery locations (e.g., `.opencode/skills/` or `~/.config/opencode/skills/`) for on-demand loading via the native `skill` tool.
- **Permission-Aware Skill Creation:** Guides the definition of permissions for newly created skills within `opencode.json`, allowing for granular control over their accessibility and usage by various agents.
- **Self-Generating Capabilities:** Serves as a meta-skill for GSK to autonomously expand its own functional toolkit, embodying the `SKILL - AI Skill Development Lifecycle` within the OpenCode ecosystem.
