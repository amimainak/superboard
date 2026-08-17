#!/bin/bash
set -e
PROJECT="/home/z/my-project"
# Uses DATABASE_URL env var. Set it in .env.local or your environment.
if [ -f "$PROJECT/.env.local" ]; then
  export $(grep -v '^#' "$PROJECT/.env.local" | xargs)
fi
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set. Create .env.local with DATABASE_URL." >&2; exit 1
fi
SCREENSHOTS="$PROJECT/download/screenshots"
LOG="$PROJECT/download/test-log.txt"

mkdir -p "$SCREENSHOTS"
rm -f "$LOG"

log() { echo "$1" | tee -a "$LOG"; }

pkill -f "next dev" 2>/dev/null || true
sleep 1

cd "$PROJECT"
npx next dev --turbopack -p 3000 > /tmp/next-dev.log 2>&1 &

for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
    log "Server ready after ${i}s"; break
  fi
  sleep 1
done

# Helper: get ref by text pattern from snapshot
get_ref() {
  agent-browser snapshot -i 2>/dev/null | grep "$1" | grep -oP 'ref=\K[e]\d+' | head -1
}

# Helper: get last ref matching pattern
get_last_ref() {
  agent-browser snapshot -i 2>/dev/null | grep "$1" | grep -oP 'ref=\K[e]\d+' | tail -1
}

###############################################
echo "========================================="
echo "TEST 1: FREE TUTOR LOGIN"
echo "========================================="

agent-browser open "http://localhost:3000/" 2>&1
sleep 5

# Step 1: Find Sign In button on landing page
SNAP=$(agent-browser snapshot -i 2>&1)
log "Landing buttons:"
echo "$SNAP" | grep -i 'button' | head -10

SIGNIN_NAV=$(echo "$SNAP" | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | head -1)
log "Sign In navbar ref: $SIGNIN_NAV"

if [ -z "$SIGNIN_NAV" ]; then
  log "ERROR: Cannot find Sign In button!"
  agent-browser screenshot "$SCREENSHOTS/60-error-no-signin.png" 2>&1
else
  agent-browser click "@$SIGNIN_NAV" 2>&1
  sleep 3

  # Step 2: Dialog should be open
  SNAP=$(agent-browser snapshot -i 2>&1)
  log "Dialog elements:"
  echo "$SNAP" | head -15

  # Find email and password fields
  EMAIL_REF=$(echo "$SNAP" | grep 'textbox "Email"' | grep -oP 'ref=\K[e]\d+' | head -1)
  PASS_REF=$(echo "$SNAP" | grep 'textbox "Password"' | grep -oP 'ref=\K[e]\d+' | head -1)
  SUBMIT_REF=$(echo "$SNAP" | grep 'heading "Welcome back"' -A20 | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | tail -1)
  
  log "Email: @$EMAIL_REF, Pass: @$PASS_REF, Submit: @$SUBMIT_REF"

  if [ -n "$EMAIL_REF" ] && [ -n "$PASS_REF" ]; then
    agent-browser fill "@$EMAIL_REF" "free-tutor@superboard.app" 2>&1
    sleep 0.3
    agent-browser fill "@$PASS_REF" "FreeTutor1234!" 2>&1
    sleep 0.3

    agent-browser screenshot "$SCREENSHOTS/60-free-tutor-filled.png" 2>&1

    if [ -n "$SUBMIT_REF" ]; then
      log "Clicking submit @$SUBMIT_REF..."
      agent-browser click "@$SUBMIT_REF" 2>&1
      sleep 8

      agent-browser screenshot "$SCREENSHOTS/61-free-tutor-result.png" 2>&1
      log "URL: $(agent-browser get url 2>&1)"
      
      PAGE=$(agent-browser snapshot -c 2>&1 | head -40)
      log "Page content:"
      echo "$PAGE" | tee -a "$LOG"
      
      log "Console errors:"
      agent-browser errors 2>&1 | tee -a "$LOG"
      
      log "Network (auth):"
      agent-browser network requests 2>&1 | grep -iE "supabase|auth" | head -10 | tee -a "$LOG"
    else
      log "ERROR: Could not find submit button"
    fi
  else
    log "ERROR: Could not find email/password fields"
  fi
fi

###############################################
echo ""
echo "========================================="
echo "TEST 2: PRO TUTOR LOGIN"
echo "========================================="

agent-browser cookies clear 2>&1
agent-browser open "http://localhost:3000/" 2>&1
sleep 5

SNAP=$(agent-browser snapshot -i 2>&1)
SIGNIN_NAV=$(echo "$SNAP" | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | head -1)

agent-browser click "@$SIGNIN_NAV" 2>&1
sleep 3

SNAP=$(agent-browser snapshot -i 2>&1)
EMAIL_REF=$(echo "$SNAP" | grep 'textbox "Email"' | grep -oP 'ref=\K[e]\d+' | head -1)
PASS_REF=$(echo "$SNAP" | grep 'textbox "Password"' | grep -oP 'ref=\K[e]\d+' | head -1)
SUBMIT_REF=$(echo "$SNAP" | grep 'heading "Welcome back"' -A20 | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | tail -1)

agent-browser fill "@$EMAIL_REF" "pro-tutor@superboard.app" 2>&1
agent-browser fill "@$PASS_REF" "ProTutor1234!" 2>&1
agent-browser screenshot "$SCREENSHOTS/62-pro-tutor-filled.png" 2>&1
agent-browser click "@$SUBMIT_REF" 2>&1
sleep 8
agent-browser screenshot "$SCREENSHOTS/63-pro-tutor-result.png" 2>&1
log "Pro tutor URL: $(agent-browser get url 2>&1)"
agent-browser snapshot -c 2>&1 | head -20 | tee -a "$LOG"

###############################################
echo ""
echo "========================================="
echo "TEST 3: AGENCY LOGIN"
echo "========================================="

agent-browser cookies clear 2>&1
agent-browser open "http://localhost:3000/" 2>&1
sleep 5

SNAP=$(agent-browser snapshot -i 2>&1)
SIGNIN_NAV=$(echo "$SNAP" | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | head -1)

agent-browser click "@$SIGNIN_NAV" 2>&1
sleep 3

SNAP=$(agent-browser snapshot -i 2>&1)
EMAIL_REF=$(echo "$SNAP" | grep 'textbox "Email"' | grep -oP 'ref=\K[e]\d+' | head -1)
PASS_REF=$(echo "$SNAP" | grep 'textbox "Password"' | grep -oP 'ref=\K[e]\d+' | head -1)
SUBMIT_REF=$(echo "$SNAP" | grep 'heading "Welcome back"' -A20 | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | tail -1)

agent-browser fill "@$EMAIL_REF" "agency@superboard.app" 2>&1
agent-browser fill "@$PASS_REF" "Agency1234!" 2>&1
agent-browser screenshot "$SCREENSHOTS/64-agency-filled.png" 2>&1
agent-browser click "@$SUBMIT_REF" 2>&1
sleep 8
agent-browser screenshot "$SCREENSHOTS/65-agency-result.png" 2>&1
log "Agency URL: $(agent-browser get url 2>&1)"
agent-browser snapshot -c 2>&1 | head -20 | tee -a "$LOG"

###############################################
echo ""
echo "========================================="
echo "TEST 4: STUDENT ROOM"
echo "========================================="

agent-browser cookies clear 2>&1
agent-browser open "http://localhost:3000/room/test-room-abc" 2>&1
sleep 5
agent-browser screenshot "$SCREENSHOTS/66-student-room.png" 2>&1
log "Student URL: $(agent-browser get url 2>&1)"
agent-browser snapshot 2>&1 | head -20 | tee -a "$LOG"
agent-browser errors 2>&1 | tee -a "$LOG"

###############################################
echo ""
echo "========================================="
echo "SERVER LOGS"
echo "========================================="
tail -30 /tmp/next-dev.log | tee -a "$LOG"

echo ""
echo "=== ALL TESTS COMPLETE ==="
kill %1 2>/dev/null || true
agent-browser close 2>/dev/null || true
