#!/bin/sh
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT" && exec npx tsx src/mcp/server.ts
