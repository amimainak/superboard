#!/usr/bin/env bash
# Persistent dev server starter
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$PROJECT_ROOT/logs/dev-server.log"
PID_FILE="$PROJECT_ROOT/logs/dev-server.pid"

mkdir -p "$PROJECT_ROOT/logs"

# Stop any existing
if [[ -f "$PID_FILE" ]]; then
  pid=$(cat "$PID_FILE")
  kill "$pid" 2>/dev/null || true
  rm -f "$PID_FILE"
fi

# Kill any orphan on port 3000
orphans=$(ss -tlnp 2>/dev/null | grep ":3000 " | grep -oP 'pid=\K\d+' || true)
for p in $orphans; do
  kill -9 "$p" 2>/dev/null || true
done

# SECURITY FIX (V-02): Use .env.local for DATABASE_URL, not hardcoded credentials.
# Load environment variables from .env.local if it exists.
if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
  set -a
  source "$PROJECT_ROOT/.env.local"
  set +a
fi

# Validate DATABASE_URL is set
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set. Create .env.local with your DATABASE_URL."
  exit 1
fi

# Start in background
cd "$PROJECT_ROOT"
PORT=3000 \
setsid npx next dev --turbopack -p 3000 \
  >> "$LOG" 2>&1 < /dev/null &

sleep 8

# Find PID
pid=$(ss -tlnp 2>/dev/null | grep ":3000 " | grep -oP 'pid=\K\d+' | head -1 || true)

if [[ -n "$pid" ]]; then
  echo "$pid" > "$PID_FILE"
  echo "Dev server started (PID $pid)"
else
  echo "ERROR: Dev server failed to start"
  tail -20 "$LOG"
  exit 1
fi

# Watchdog
while true; do
  sleep 30
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
  if [[ "$code" != "200" && "$code" != "302" && "$code" != "307" ]]; then
    echo "[watchdog] Server down (HTTP=$code), restarting..." >> "$LOG"
    kill "$pid" 2>/dev/null || true
    sleep 2
    cd "$PROJECT_ROOT"
    PORT=3000 \
    setsid npx next dev --turbopack -p 3000 \
      >> "$LOG" 2>&1 < /dev/null &
    sleep 8
    pid=$(ss -tlnp 2>/dev/null | grep ":3000 " | grep -oP 'pid=\K\d+' | head -1 || true)
    echo "$pid" > "$PID_FILE"
  fi
done
