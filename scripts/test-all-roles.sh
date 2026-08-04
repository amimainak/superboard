#!/bin/bash
# ============================================================
# Superboard — End-to-End Testing Script
# Tests all 4 roles: Student, Free Tutor, Pro Tutor, Agency
# Takes screenshots at every step
# ============================================================

set -e

export DATABASE_URL="postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
PROJECT="/home/z/my-project"
SCREENSHOTS="$PROJECT/download/screenshots"
LOG="$PROJECT/download/test-results.log"

mkdir -p "$SCREENSHOTS"

log() { echo "$1" | tee -a "$LOG"; }
screenshot() { agent-browser screenshot "$SCREENSHOTS/$1" 2>&1 | tee -a "$LOG"; }

# --- Kill any stale servers ---
pkill -f "next dev" 2>/dev/null || true
sleep 1

# --- Start dev server ---
log "=== Starting Next.js dev server ==="
cd "$PROJECT"
npx next dev --turbopack -p 3000 > /tmp/next-dev.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
    log "Server ready after ${i}s"
    break
  fi
  sleep 1
done

if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
  log "FATAL: Server did not start!"
  cat /tmp/next-dev.log | tail -20
  exit 1
fi

# Helper: wait for text
wait_for_text() {
  local text="$1" timeout="${2:-10}"
  for i in $(seq 1 $timeout); do
    if agent-browser snapshot -c 2>/dev/null | grep -q "$text"; then
      return 0
    fi
    sleep 1
  done
  log "  WARNING: Timed out waiting for '$text'"
  return 1
}

# ================================================================
# ROLE 1: STUDENT — Visits room directly (no login)
# ================================================================
log ""
log "=========================================="
log "ROLE 1: STUDENT"
log "=========================================="

log "--- Navigating to room/test-room-101 ---"
agent-browser open "http://localhost:3000/room/test-room-101" 2>&1 | tee -a "$LOG"
sleep 4

log "--- Screenshot: Student room entry ---"
screenshot "01-student-room-entry.png"
agent-browser snapshot -i 2>&1 | tee -a "$LOG"

# Check what the student sees - name entry, waiting room, or whiteboard
log "--- Checking student page content ---"
PAGE_TEXT=$(agent-browser snapshot -c 2>&1)
log "Page text summary: $(echo "$PAGE_TEXT" | head -20)"

# Try to find and fill name input if present
if echo "$PAGE_TEXT" | grep -qi "name\|enter\|join"; then
  log "--- Found name input, entering student name ---"
  # Get interactive elements
  INTERACTIVE=$(agent-browser snapshot -i 2>&1)
  log "Interactive elements: $INTERACTIVE"
  
  # Try to find and fill name field
  NAME_REF=$(echo "$INTERACTIVE" | grep -oP 'textbox.*?ref=\K[e]\d+' | head -1)
  if [ -n "$NAME_REF" ]; then
    agent-browser fill "@$NAME_REF" "Test Student" 2>&1 | tee -a "$LOG"
    sleep 1
  fi
  
  # Find and click join/submit button
  BTN_REF=$(echo "$INTERACTIVE" | grep -oP 'button.*?(Join|Enter|Start|Submit).*?ref=\K[e]\d+' | head -1)
  if [ -z "$BTN_REF" ]; then
    BTN_REF=$(echo "$INTERACTIVE" | grep -oP 'button.*?ref=\K[e]\d+' | head -1)
  fi
  if [ -n "$BTN_REF" ]; then
    agent-browser click "@$BTN_REF" 2>&1 | tee -a "$LOG"
    sleep 4
  fi
fi

log "--- Screenshot: Student after interaction ---"
screenshot "02-student-after-interaction.png"
agent-browser snapshot -c 2>&1 | head -30 | tee -a "$LOG"

log "--- Student role complete ---"

# ================================================================
# ROLE 2: FREE TUTOR — Login and test features
# ================================================================
log ""
log "=========================================="
log "ROLE 2: FREE TUTOR"
log "=========================================="

log "--- Navigating to homepage ---"
agent-browser open "http://localhost:3000/" 2>&1 | tee -a "$LOG"
sleep 4

log "--- Screenshot: Landing page ---"
screenshot "03-free-tutor-landing.png"

log "--- Clicking Login button ---"
INTERACTIVE=$(agent-browser snapshot -i 2>&1)
log "Landing interactive elements: $(echo "$INTERACTIVE" | head -20)"

# Find login/signup button
LOGIN_REF=$(echo "$INTERACTIVE" | grep -oP '(button|link).*?(Log in|Sign in|Login|Get Started).*?ref=\K[e]\d+' | head -1)
if [ -z "$LOGIN_REF" ]; then
  LOGIN_REF=$(echo "$INTERACTIVE" | grep -oP 'button.*?(Log in|Sign in|Login).*?ref=\K[e]\d+' -i | head -1)
fi
if [ -z "$LOGIN_REF" ]; then
  # Try any button that looks like login
  LOGIN_REF=$(echo "$INTERACTIVE" | grep -i 'button' | grep -oP 'ref=\K[e]\d+' | head -1)
fi

if [ -n "$LOGIN_REF" ]; then
  log "Clicking login button: @$LOGIN_REF"
  agent-browser click "@$LOGIN_REF" 2>&1 | tee -a "$LOG"
  sleep 3
else
  log "WARNING: Could not find login button"
fi

log "--- Screenshot: Login dialog ---"
screenshot "04-free-tutor-login-dialog.png"
agent-browser snapshot -i 2>&1 | tee -a "$LOG"

# Fill email and password
INTERACTIVE=$(agent-browser snapshot -i 2>&1)
EMAIL_REF=$(echo "$INTERACTIVE" | grep -oP 'textbox.*?(email|Email).*?ref=\K[e]\d+' | head -1)
if [ -z "$EMAIL_REF" ]; then
  EMAIL_REF=$(echo "$INTERACTIVE" | grep -oP 'textbox.*?ref=\K[e]\d+' | head -1)
fi
PASS_REF=$(echo "$INTERACTIVE" | grep -oP 'textbox.*?(password|Password).*?ref=\K[e]\d+' | head -1)
if [ -z "$PASS_REF" ]; then
  PASS_REF=$(echo "$INTERACTIVE" | grep -oP 'textbox.*?ref=\K[e]\d+' | tail -1)
fi

log "Email ref: $EMAIL_REF, Password ref: $PASS_REF"

if [ -n "$EMAIL_REF" ]; then
  agent-browser fill "@$EMAIL_REF" "free-tutor@superboard.app" 2>&1 | tee -a "$LOG"
fi
if [ -n "$PASS_REF" ]; then
  agent-browser fill "@$PASS_REF" "FreeTutor1234!" 2>&1 | tee -a "$LOG"
fi

log "--- Screenshot: Login filled ---"
screenshot "05-free-tutor-login-filled.png"

# Click submit/login
INTERACTIVE=$(agent-browser snapshot -i 2>&1)
SUBMIT_REF=$(echo "$INTERACTIVE" | grep -oP 'button.*?(Sign in|Log in|Login|Submit).*?ref=\K[e]\d+' | head -1)
if [ -z "$SUBMIT_REF" ]; then
  SUBMIT_REF=$(echo "$INTERACTIVE" | grep -oP 'button.*?ref=\K[e]\d+' | tail -1)
fi

if [ -n "$SUBMIT_REF" ]; then
  log "Clicking submit: @$SUBMIT_REF"
  agent-browser click "@$SUBMIT_REF" 2>&1 | tee -a "$LOG"
  sleep 5
fi

# Check for errors
PAGE_TEXT=$(agent-browser snapshot -c 2>&1)
if echo "$PAGE_TEXT" | grep -qi "error\|invalid\|incorrect\|wrong"; then
  log "LOGIN ERROR detected!"
  screenshot "06-free-tutor-login-error.png"
else
  log "--- Login successful or processing ---"
fi

log "--- Screenshot: After login attempt ---"
screenshot "07-free-tutor-after-login.png"
agent-browser snapshot -c 2>&1 | head -30 | tee -a "$LOG"

# Check if we're on dashboard
CURRENT_URL=$(agent-browser get url 2>&1 | tee -a "$LOG")
log "Current URL: $CURRENT_URL"

# ================================================================
# ROLE 3: PRO TUTOR — Login and test features
# ================================================================
log ""
log "=========================================="
log "ROLE 3: PRO TUTOR"
log "=========================================="

# Close any dialogs first
agent-browser cookies clear 2>&1 | tee -a "$LOG"

log "--- Navigating to homepage ---"
agent-browser open "http://localhost:3000/" 2>&1 | tee -a "$LOG"
sleep 4

log "--- Clicking Login ---"
INTERACTIVE=$(agent-browser snapshot -i 2>&1)
LOGIN_REF=$(echo "$INTERACTIVE" | grep -i 'button' | grep -oP 'ref=\K[e]\d+' | head -1)

if [ -n "$LOGIN_REF" ]; then
  agent-browser click "@$LOGIN_REF" 2>&1 | tee -a "$LOG"
  sleep 3
fi

# Login as pro tutor
INTERACTIVE=$(agent-browser snapshot -i 2>&1)
EMAIL_REF=$(echo "$INTERACTIVE" | grep -oP 'textbox.*?ref=\K[e]\d+' | head -1)
PASS_REF=$(echo "$INTERACTIVE" | grep -oP 'textbox.*?ref=\K[e]\d+' | tail -1)

if [ -n "$EMAIL_REF" ]; then
  agent-browser fill "@$EMAIL_REF" "pro-tutor@superboard.app" 2>&1 | tee -a "$LOG"
fi
if [ -n "$PASS_REF" ]; then
  agent-browser fill "@$PASS_REF" "ProTutor1234!" 2>&1 | tee -a "$LOG"
fi

log "--- Screenshot: Pro tutor login filled ---"
screenshot "08-pro-tutor-login-filled.png"

INTERACTIVE=$(agent-browser snapshot -i 2>&1)
SUBMIT_REF=$(echo "$INTERACTIVE" | grep -i 'button' | grep -oP 'ref=\K[e]\d+' | tail -1)

if [ -n "$SUBMIT_REF" ]; then
  agent-browser click "@$SUBMIT_REF" 2>&1 | tee -a "$LOG"
  sleep 5
fi

log "--- Screenshot: Pro tutor after login ---"
screenshot "09-pro-tutor-after-login.png"
agent-browser snapshot -c 2>&1 | head -30 | tee -a "$LOG"

CURRENT_URL=$(agent-browser get url 2>&1 | tee -a "$LOG")
log "Current URL: $CURRENT_URL"

# ================================================================
# ROLE 4: AGENCY — Login and test features
# ================================================================
log ""
log "=========================================="
log "ROLE 4: AGENCY"
log "=========================================="

agent-browser cookies clear 2>&1 | tee -a "$LOG"

log "--- Navigating to homepage ---"
agent-browser open "http://localhost:3000/" 2>&1 | tee -a "$LOG"
sleep 4

log "--- Clicking Login ---"
INTERACTIVE=$(agent-browser snapshot -i 2>&1)
LOGIN_REF=$(echo "$INTERACTIVE" | grep -i 'button' | grep -oP 'ref=\K[e]\d+' | head -1)

if [ -n "$LOGIN_REF" ]; then
  agent-browser click "@$LOGIN_REF" 2>&1 | tee -a "$LOG"
  sleep 3
fi

# Login as agency
INTERACTIVE=$(agent-browser snapshot -i 2>&1)
EMAIL_REF=$(echo "$INTERACTIVE" | grep -oP 'textbox.*?ref=\K[e]\d+' | head -1)
PASS_REF=$(echo "$INTERACTIVE" | grep -oP 'textbox.*?ref=\K[e]\d+' | tail -1)

if [ -n "$EMAIL_REF" ]; then
  agent-browser fill "@$EMAIL_REF" "agency@superboard.app" 2>&1 | tee -a "$LOG"
fi
if [ -n "$PASS_REF" ]; then
  agent-browser fill "@$PASS_REF" "Agency1234!" 2>&1 | tee -a "$LOG"
fi

log "--- Screenshot: Agency login filled ---"
screenshot "10-agency-login-filled.png"

INTERACTIVE=$(agent-browser snapshot -i 2>&1)
SUBMIT_REF=$(echo "$INTERACTIVE" | grep -i 'button' | grep -oP 'ref=\K[e]\d+' | tail -1)

if [ -n "$SUBMIT_REF" ]; then
  agent-browser click "@$SUBMIT_REF" 2>&1 | tee -a "$LOG"
  sleep 5
fi

log "--- Screenshot: Agency after login ---"
screenshot "11-agency-after-login.png"
agent-browser snapshot -c 2>&1 | head -30 | tee -a "$LOG"

CURRENT_URL=$(agent-browser get url 2>&1 | tee -a "$LOG")
log "Current URL: $CURRENT_URL"

# Check for errors
PAGE_TEXT=$(agent-browser snapshot -c 2>&1)
if echo "$PAGE_TEXT" | grep -qi "error"; then
  log "ERROR detected on agency page!"
fi

# ================================================================
# DONE — Summary
# ================================================================
log ""
log "=========================================="
log "TESTING COMPLETE"
log "=========================================="
log "Screenshots saved to: $SCREENSHOTS"
log "Full log: $LOG"

# Kill server
kill $SERVER_PID 2>/dev/null || true

agent-browser close 2>/dev/null || true
