#!/bin/bash
set -e
echo "✦ BUYASOUL post-create"
# soul-economy already has workbench? if not, fetch Family zip and hydrate minimal workbench
if [ ! -f "workbench/server.ts" ]; then
  echo "Fetching Family Workbench for Codespaces..."
  mkdir -p workbench
  # try release asset, fallback to downloads folder
  if [ -f "downloads/the-profit-lovetax-family.zip" ]; then
    echo "Using local downloads/the-profit-lovetax-family.zip"
    unzip -q downloads/the-profit-lovetax-family.zip -d /tmp/family 2>/dev/null || true
    # if workbench inside, copy
    if [ -d "/tmp/family/WORKBENCH_COMPLETE/workbench" ]; then cp -r /tmp/family/WORKBENCH_COMPLETE/workbench/* workbench/ 2>/dev/null || true; fi
  fi
  # ensure package.json exists, else init minimal
  if [ ! -f "workbench/package.json" ]; then
    echo '{"name":"buyasoul-codespace","private":true,"dependencies":{"express":"^4.21.2","tsx":"^4.21.0"}}' > workbench/package.json
  fi
fi
echo "Installing deps (workbench)..."
(cd workbench 2>/dev/null && npm install --silent || npm install --silent || true)
echo "post-create done"
