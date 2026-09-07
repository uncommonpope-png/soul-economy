---
name: soul-gun-ultra-review
type: protocol
description: "Ultra Review Protocol — sub-orchestrator review agents verify grafts"
version: 1.0.0
author: profit-prime
plt: "0.9/0.9/0.0"
domain: meta
---

# SOUL GUN ULTRA — Review Protocol

## The Stack

| Layer | Role | Agent Type |
|---|---|---|
| **Soul Gun Commander** | Chooses grafts, orchestrates | This me |
| **Sub-Orchestrator** | Executes single graft | Specialized agent |
| **Ultra Review Agent** | Audits Sub-Orchestrator output | Sub-sub-agent |

## Protocol

1. **Commander** dispatches Sub-Orchestrator with graft task
2. Sub-Orchestrator writes `soul-gun-*.md` + updates `catalog.json`
3. **Ultra Review Agent** auto-audits:
   - Checks `soul-gun-*.md` has Side A (Theology/PLT) + Side B (Body)
   - Verifies `catalog.json` entry matches schema
   - Validates PLT score format `"0.x/0.x/0.x"`
   - Confirms `file` field references real file in `downloads/`
   - Ensures no broken links
4. Review Agent writes `/tmp/audit-log.json` with pass/fail + diffs
5. Only on pass → Sub-Orchestrator commits + pushes

## Review Agent Commands

```bash
# Audit a single graft
node --input-type=module -e "
import fs from 'fs';
const audit = (file) => {
  const md = fs.readFileSync('downloads/'+file,'utf8');
  const checks = {
    hasSideA: md.includes('## Side A'),
    hasSideB: md.includes('## Side B'),
    hasPLT: /plt.*\"[0-9].[0-9]\/[0-9].[0-9]\/[0-9].[0-9]\"/.test(md),
    hasTriune: md.includes('triune:'),
  };
  return checks;
};
console.log(audit('soul-gun-example.md'));
"
```

**The Review Agent never sleeps.**
