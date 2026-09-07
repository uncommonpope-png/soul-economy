#!/bin/bash
echo "✦ Starting BUYASOUL Workbench (Codespaces)"
if [ -f "workbench/server.ts" ]; then
  (cd workbench && npx tsx server.ts &)
  echo "Workbench starting on :3000"
else
  echo "No workbench/server.ts — serving soul-economy static demo on :3000"
  npx serve -l 3000 . &
fi
# also try omniroute if present
if [ -d "workbench/omniroute" ]; then (cd workbench/omniroute && npm start &); fi
sleep 2
echo "Ports forwarded: 3000 Workbench, 20128 OmniRoute"
