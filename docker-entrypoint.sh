#!/bin/sh

# Detect runtime (bun or node)
if command -v bun >/dev/null 2>&1; then
  echo "Using Bun runtime"
  PM=bun bun scripts/prisma-migrate.js
  bun index.js
else
  echo "Using Node runtime"
  PM=npm npm run prisma-migrate
  node index.js
fi
