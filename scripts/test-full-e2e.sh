#!/bin/bash
# ============================================================
# Superboard — Full E2E Test (Real Anon Key)
# Tests all 4 roles with screenshots at every step
# ============================================================
set -e
P="/home/z/my-project"
# Uses DATABASE_URL env var. Set it in .env.local or your environment.
if [ -f "$P/.env.local" ]; then
  export $(grep -v '^#' "$P/.env.local" | xargs)
fi
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set. Create .env.local with DATABASE_URL." >&2; exit 1
fi
S="$P/download/screenshots"
rm -f "$P/download/test-log.txt"

log() { echo "$1" | tee -a "$P/download/test-log.txt"; }
ss() { agent-browser screenshot "$S/$1" 2>&1 | tee -a "$P/download/test-log.txt"; }

pkill -f "next dev" 2>/dev/null || true; sleep 1
cd "$P" && rm -rf .next
npx next dev --turbopack -p 3000 > /tmp/next-dev.log 2>&1 &

for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
    log "Server ready after ${i}s"; break; fi; sleep 1
done

# Helper: get ref by exact text from latest snapshot
ref_of() {
  agent-browser snapshot -i 2>/dev/null | grep "$1" | grep -oP 'ref=\K[e]\d+' | head -1
}

##################################################
# ROLE 1: FREE TUTOR
##################################################
log ""
log "╔══════════════════════════════════════╗"
log "║  ROLE 1: FREE TUTOR                ║"
log "╚══════════════════════════════════════╝"

agent-browser open "http://localhost:3000/" 2>&1
sleep 5
ss "01-landing-page.png"

log "--- Clicking Sign In ---"
SNAP=$(agent-browser snapshot -i 2>&1)
NAV_SIGNIN=$(echo "$SNAP" | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | head -1)
agent-browser click "@$NAV_SIGNIN" 2>&1
sleep 3

SNAP=$(agent-browser snapshot -i 2>&1)
EMAIL=$(echo "$SNAP" | grep 'textbox "Email"' | grep -oP 'ref=\K[e]\d+' | head -1)
PASS=$(echo "$SNAP" | grep 'textbox "Password"' | grep -oP 'ref=\K[e]\d+' | head -1)
SUBMIT=$(echo "$SNAP" | grep -A20 'heading "Welcome back"' | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | tail -1)

log "Email=@$EMAIL Pass=@$PASS Submit=@$SUBMIT"
agent-browser fill "@$EMAIL" "free-tutor@superboard.app" 2>&1
agent-browser fill "@$PASS" "FreeTutor1234!" 2>&1
ss "02-free-login-filled.png"
agent-browser click "@$SUBMIT" 2>&1
sleep 6

ss "03-free-after-login.png"
URL=$(agent-browser get url 2>&1)
log "URL after login: $URL"

if echo "$URL" | grep -q "localhost:3000/$"; then
  log "STILL ON LANDING - LOGIN FAILED!"
  agent-browser snapshot -c 2>&1 | head -30 | tee -a "$P/download/test-log.txt"
  agent-browser errors 2>&1 | tee -a "$P/download/test-log.txt"
  agent-browser network requests 2>&1 | grep -iE "supabase|auth|api" | tail -10 | tee -a "$P/download/test-log.txt"
else
  log "LOGIN SUCCESS - ON DASHBOARD!"
  agent-browser snapshot -c 2>&1 | head -40 | tee -a "$P/download/test-log.txt"
  ss "04-free-dashboard.png"
  
  # Explore dashboard features
  log "--- Exploring dashboard ---"
  INTERACTIVE=$(agent-browser snapshot -i 2>&1)
  log "Dashboard buttons:"
  echo "$INTERACTIVE" | grep -i 'button\|link' | head -20 | tee -a "$P/download/test-log.txt"
  
  # Look for "Create Room" or similar
  CREATE_REF=$(echo "$INTERACTIVE" | grep -iE 'button.*(Create|New|Room|Lesson)' | grep -oP 'ref=\K[e]\d+' | head -1)
  if [ -n "$CREATE_REF" ]; then
    log "Found create button: @$CREATE_REF"
    agent-browser click "@$CREATE_REF" 2>&1
    sleep 3
    ss "05-free-create-room.png"
    agent-browser snapshot -c 2>&1 | head -20 | tee -a "$P/download/test-log.txt"
  fi
  
  ss "06-free-dashboard-full.png"
fi

##################################################
# ROLE 2: PRO TUTOR
##################################################
log ""
log "╔══════════════════════════════════════╗"
log "║  ROLE 2: PRO TUTOR                 ║"
log "╚══════════════════════════════════════╝"

agent-browser cookies clear 2>&1
agent-browser open "http://localhost:3000/" 2>&1
sleep 5

SNAP=$(agent-browser snapshot -i 2>&1)
NAV_SIGNIN=$(echo "$SNAP" | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | head -1)
agent-browser click "@$NAV_SIGNIN" 2>&1
sleep 3

SNAP=$(agent-browser snapshot -i 2>&1)
EMAIL=$(echo "$SNAP" | grep 'textbox "Email"' | grep -oP 'ref=\K[e]\d+' | head -1)
PASS=$(echo "$SNAP" | grep 'textbox "Password"' | grep -oP 'ref=\K[e]\d+' | head -1)
SUBMIT=$(echo "$SNAP" | grep -A20 'heading "Welcome back"' | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | tail -1)

agent-browser fill "@$EMAIL" "pro-tutor@superboard.app" 2>&1
agent-browser fill "@$PASS" "ProTutor1234!" 2>&1
ss "07-pro-login-filled.png"
agent-browser click "@$SUBMIT" 2>&1
sleep 6

ss "08-pro-after-login.png"
URL=$(agent-browser get url 2>&1)
log "URL: $URL"

if echo "$URL" | grep -q "localhost:3000/$"; then
  log "PRO LOGIN FAILED!"
else
  log "PRO LOGIN SUCCESS!"
  agent-browser snapshot -c 2>&1 | head -40 | tee -a "$P/download/test-log.txt"
  ss "09-pro-dashboard.png"
  INTERACTIVE=$(agent-browser snapshot -i 2>&1)
  log "Pro dashboard elements:"
  echo "$INTERACTIVE" | grep -iE 'button|link|heading' | head -20 | tee -a "$P/download/test-log.txt"
  ss "10-pro-dashboard-full.png"
fi

##################################################
# ROLE 3: AGENCY
##################################################
log ""
log "╔══════════════════════════════════════╗"
log "║  ROLE 3: AGENCY                    ║"
log "╚══════════════════════════════════════╝"

agent-browser cookies clear 2>&1
agent-browser open "http://localhost:3000/" 2>&1
sleep 5

SNAP=$(agent-browser snapshot -i 2>&1)
NAV_SIGNIN=$(echo "$SNAP" | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | head -1)
agent-browser click "@$NAV_SIGNIN" 2>&1
sleep 3

SNAP=$(agent-browser snapshot -i 2>&1)
EMAIL=$(echo "$SNAP" | grep 'textbox "Email"' | grep -oP 'ref=\K[e]\d+' | head -1)
PASS=$(echo "$SNAP" | grep 'textbox "Password"' | grep -oP 'ref=\K[e]\d+' | head -1)
SUBMIT=$(echo "$SNAP" | grep -A20 'heading "Welcome back"' | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | tail -1)

agent-browser fill "@$EMAIL" "agency@superboard.app" 2>&1
agent-browser fill "@$PASS" "Agency1234!" 2>&1
ss "11-agency-login-filled.png"
agent-browser click "@$SUBMIT" 2>&1
sleep 6

ss "12-agency-after-login.png"
URL=$(agent-browser get url 2>&1)
log "URL: $URL"

if echo "$URL" | grep -q "localhost:3000/$"; then
  log "AGENCY LOGIN FAILED!"
else
  log "AGENCY LOGIN SUCCESS!"
  agent-browser snapshot -c 2>&1 | head -40 | tee -a "$P/download/test-log.txt"
  ss "13-agency-dashboard.png"
  INTERACTIVE=$(agent-browser snapshot -i 2>&1)
  log "Agency dashboard elements:"
  echo "$INTERACTIVE" | grep -iE 'button|link|heading' | head -20 | tee -a "$P/download/test-log.txt"
  
  # Look for agency-specific features (branding, sub-tutors, etc.)
  AGENCY_FEATURES=$(echo "$INTERACTIVE" | grep -iE 'brand|logo|sub|tutor|white.label|admin|manage')
  if [ -n "$AGENCY_FEATURES" ]; then
    log "Found agency features: $AGENCY_FEATURES"
  else
    log "No agency-specific features found on dashboard"
  fi
  ss "14-agency-dashboard-full.png"
fi

##################################################
# ROLE 4: STUDENT
##################################################
log ""
log "╔══════════════════════════════════════╗"
log "║  ROLE 4: STUDENT (no login)         ║"
log "╚══════════════════════════════════════╝"

agent-browser cookies clear 2>&1
agent-browser open "http://localhost:3000/room/test-room-abc" 2>&1
sleep 5
ss "15-student-room.png"
URL=$(agent-browser get url 2>&1)
log "Student URL: $URL"
PAGE=$(agent-browser snapshot -c 2>&1)
echo "$PAGE" | head -20 | tee -a "$P/download/test-log.txt"

# Check if there's a name input
if echo "$PAGE" | grep -qi "name\|enter\|join\|wait"; then
  log "Student has name entry / waiting screen"
  INTERACTIVE=$(agent-browser snapshot -i 2>&1)
  echo "$INTERACTIVE" | tee -a "$P/download/test-log.txt"
  NAME_REF=$(echo "$INTERACTIVE" | grep 'textbox' | grep -oP 'ref=\K[e]\d+' | head -1)
  if [ -n "$NAME_REF" ]; then
    agent-browser fill "@$NAME_REF" "Test Student" 2>&1
    JOIN_REF=$(echo "$INTERACTIVE" | grep -iE 'button.*(Join|Enter|Start)' | grep -oP 'ref=\K[e]\d+' | head -1)
    if [ -n "$JOIN_REF" ]; then
      agent-browser click "@$JOIN_REF" 2>&1
      sleep 4
    fi
    ss "16-student-after-join.png"
  fi
else
  log "Student sees error / not-available page"
fi

agent-browser errors 2>&1 | tee -a "$P/download/test-log.txt"

##################################################
# SERVER LOGS
##################################################
log ""
log "=== SERVER LOGS ==="
tail -30 /tmp/next-dev.log | tee -a "$P/download/test-log.txt"

log ""
log "=== TEST COMPLETE ==="
log "Screenshots: $S"
log "Log: $P/download/test-log.txt"

kill %1 2>/dev/null || true
agent-browser close 2>/dev/null || true
