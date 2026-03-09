#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URL="http://localhost:5173"

# Kill any existing dev server on the same port
fuser -k 5173/tcp 2>/dev/null || true

cd "$SCRIPT_DIR"
npm run dev &
DEV_PID=$!

# Wait until the server accepts connections (up to 30s)
for i in $(seq 1 30); do
  if curl -s -o /dev/null "$URL"; then
    break
  fi
  sleep 1
done

xdg-open "$URL"

# Keep the server running in foreground so closing the terminal kills it
wait "$DEV_PID"
