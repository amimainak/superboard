#!/usr/bin/env bash
# ============================================================
# Superboard — Persistent Production Server Launcher
# ============================================================
# Uses setsid to detach from the calling shell so the server
# survives session endings.  Includes a health-check loop.
#
# Usage:
#   bash scripts/start-server.sh          # start (or restart)
#   bash scripts/start-server.sh stop     # stop
#   bash scripts/start-server.sh status   # health check
# ============================================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STANDALONE_DIR="$PROJECT_ROOT/.next/standalone"
SERVER_LOG="$PROJECT_ROOT/logs/server.log"
PID_FILE="$PROJECT_ROOT/logs/server.pid"
HEALTH_URL="http://localhost:3000/"
MAX_STARTUP_WAIT=10          # seconds to wait for HTTP 200
HEALTH_INTERVAL=30          # seconds between health pings
PORT=3000

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die()  { log "ERROR: $*"; exit 1; }

mkdir -p "$PROJECT_ROOT/logs"

# ------------------------------------------------------------------
# stop
# ------------------------------------------------------------------
do_stop() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      log "Stopping server (PID $pid)..."
      kill "$pid"
      sleep 2
      # force kill if still alive
      kill -0 "$pid" 2>/dev/null && kill -9 "$pid"
      log "Stopped."
    else
      log "PID $pid not running — cleaning up stale file."
    fi
    rm -f "$PID_FILE"
  fi

  # also kill any orphan next-server on our port
  local orphans
  orphans=$(ss -tlnp 2>/dev/null | grep ":${PORT} " | grep -oP 'pid=\K\d+' || true)
  if [[ -n "$orphans" ]]; then
    for p in $orphans; do
      log "Killing orphan process $p on port $PORT"
      kill -9 "$p" 2>/dev/null || true
    done
  fi
}

# ------------------------------------------------------------------
# status
# ------------------------------------------------------------------
do_status() {
  local http_code=""
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      http_code=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
      log "Server PID=$pid  HTTP=$http_code  PORT=$PORT"
    else
      log "Server PID=$pid is DEAD (stale PID file)"
      rm -f "$PID_FILE"
    fi
  else
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    if [[ "$http_code" == "200" ]]; then
      log "Server is UP (no PID file) HTTP=$http_code"
    else
      log "Server is DOWN."
    fi
  fi
}

# ------------------------------------------------------------------
# start (with setsid — survives shell exit)
# ------------------------------------------------------------------
do_start() {
  # --- pre-flight checks ---
  [[ -f "$STANDALONE_DIR/server.js" ]] || die "Build not found — run 'npx next build' first."
  [[ -f "$STANDALONE_DIR/.env" ]]      || die ".env missing in $STANDALONE_DIR"
  curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null | grep -q "200" \
    && { log "Server already running on port $PORT — skipping start."; return 0; }

  # --- stop any stale instances ---
  do_stop

  # --- launch with setsid (new session, no controlling terminal) ---
  log "Starting Superboard on port $PORT ..."
  cd "$STANDALONE_DIR"
  # Build env-string from .env so setsid'd node inherits ALL vars
  # (setsid creates a new session — exported parent vars are NOT inherited)
  local env_args=""
  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    value=$(echo "$value" | sed 's/^"//;s/"$//')  # strip optional quotes
    env_args="${env_args} ${key}=${value}"
  done < "$STANDALONE_DIR/.env"
  setsid env PORT=$PORT NODE_ENV=production $env_args node server.js \
    >> "$SERVER_LOG" 2>&1 < /dev/null &
  local child_pid=$!
  # The setsid'd session leader is the parent of $child_pid
  # We wait briefly then find the actual next-server PID
  sleep 3

  # Find the PID that owns port $PORT
  local server_pid=""
  for i in $(seq 1 $MAX_STARTUP_WAIT); do
    server_pid=$(ss -tlnp 2>/dev/null | grep ":${PORT} " | grep -oP 'pid=\K\d+' | head -1 || true)
    [[ -n "$server_pid" ]] && break
    sleep 1
  done

  if [[ -z "$server_pid" ]]; then
    log "FATAL: Server did not start within ${MAX_STARTUP_WAIT}s. Last log lines:"
    tail -20 "$SERVER_LOG"
    die "Startup failed."
  fi

  echo "$server_pid" > "$PID_FILE"
  log "Server started successfully (PID $server_pid)."
}

# ------------------------------------------------------------------
# health-watch loop (runs in background, auto-restarts on crash)
# ------------------------------------------------------------------
do_watch() {
  log "Health-watch started (interval=${HEALTH_INTERVAL}s)."
  while true; do
    sleep "$HEALTH_INTERVAL"
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    if [[ "$http_code" != "200" ]]; then
      log "Health check FAILED (HTTP=$http_code). Restarting..."
      do_stop
      do_start
    fi
  done
}

# ------------------------------------------------------------------
# main
# ------------------------------------------------------------------
case "${1:-start}" in
  start)
    do_start
    # launch background watcher (also via setsid so it survives)
    log "Launching health-watch daemon..."
    setsid bash "$0" __watch >> "$PROJECT_ROOT/logs/watchdog.log" 2>&1 < /dev/null &
    log "All done. Server + watchdog running."
    ;;
  __watch)
    do_watch
    ;;
  stop)
    do_stop
    ;;
  status)
    do_status
    ;;
  restart)
    do_stop
    do_start
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
