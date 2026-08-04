#!/bin/bash
# ============================================================
# Superboard — Proper E2E Test (Sequential, no cookie clear)
# Tests each role with full dashboard screenshots
# ============================================================
set -e
export DATABASE_URL="postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
P="/home/z/my-project"
S="$P/download/screenshots"

pkill -f "next dev" 2>/dev/null || true; sleep 1
cd "$P" && rm -rf .next
npx next dev --turbopack -p 3000 > /tmp/next-dev.log 2>&1 &

for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
    echo "Server ready after ${i}s"; break; fi; sleep 1
done

ss() { agent-browser screenshot "$S/$1" 2>&1; }

##################################################
echo "╔══════════════════════════════════════╗"
echo "║  ROLE 1: FREE TUTOR                ║"
echo "╚══════════════════════════════════════╝"

agent-browser open "http://localhost:3000/" 2>&1
sleep 5

# Click Sign In
SNAP=$(agent-browser snapshot -i 2>&1)
NAV_SIGNIN=$(echo "$SNAP" | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | head -1)
agent-browser click "@$NAV_SIGNIN" 2>&1
sleep 3

# Fill and submit
SNAP=$(agent-browser snapshot -i 2>&1)
EMAIL=$(echo "$SNAP" | grep 'textbox "Email"' | grep -oP 'ref=\K[e]\d+' | head -1)
PASS=$(echo "$SNAP" | grep 'textbox "Password"' | grep -oP 'ref=\K[e]\d+' | head -1)
SUBMIT=$(echo "$SNAP" | grep -A20 'heading "Welcome back"' | grep 'button "Sign In"' | grep -oP 'ref=\K[e]\d+' | tail -1)

agent-browser fill "@$EMAIL" "free-tutor@superboard.app" 2>&1
agent-browser fill "@$PASS" "FreeTutor1234!" 2>&1
agent-browser click "@$SUBMIT" 2>&1
sleep 6

echo "--- FREE TUTOR DASHBOARD ---"
ss "A1-free-dashboard.png"

# Full page content
echo "=== Dashboard content ==="
agent-browser snapshot -c 2>&1 | tee -a "$P/download/test-log.txt"

echo "=== Interactive elements ==="
agent-browser snapshot -i 2>&1 | tee -a "$P/download/test-log.txt"

# Click Billing tab
BILLING_TAB=$(agent-browser snapshot -i 2>&1 | grep 'tab "Billing"' | grep -oP 'ref=\K[e]\d+' | head -1)
if [ -n "$BILLING_TAB" ]; then
  echo "--- Clicking Billing tab ---"
  agent-browser click "@$BILLING_TAB" 2>&1
  sleep 2
  ss "A2-free-billing.png"
  agent-browser snapshot -c 2>&1 | tee -a "$P/download/test-log.txt"
fi

# Click Templates tab
TEMPLATES_TAB=$(agent-browser snapshot -i 2>&1 | grep 'tab "Templates"' | grep -oP 'ref=\K[e]\d+' | head -1)
if [ -n "$TEMPLATES_TAB" ]; then
  echo "--- Clicking Templates tab ---"
  agent-browser click "@$TEMPLATES_TAB" 2>&1
  sleep 2
  ss "A3-free-templates.png"
  agent-browser snapshot -c 2>&1 | head -20 | tee -a "$P/download/test-log.txt"
fi

# Sign out
echo "--- Signing out ---"
SIGNOUT=$(agent-browser snapshot -i 2>&1 | grep 'button "Sign out"' | grep -oP 'ref=\K[e]\d+' | head -1)
if [ -n "$SIGNOUT" ]; then
  agent-browser click "@$SIGNOUT" 2>&1
  sleep 3
fi

##################################################
echo ""
echo "╔══════════════════════════════════════╗"
echo "║  ROLE 2: PRO TUTOR                 ║"
echo "╚══════════════════════════════════════╝"

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
agent-browser click "@$SUBMIT" 2>&1
sleep 6

echo "--- PRO TUTOR DASHBOARD ---"
ss "B1-pro-dashboard.png"
agent-browser snapshot -c 2>&1 | tee -a "$P/download/test-log.txt"
agent-browser snapshot -i 2>&1 | tee -a "$P/download/test-log.txt"

# Check for PRO-specific features
BILLING_TAB=$(agent-browser snapshot -i 2>&1 | grep 'tab "Billing"' | grep -oP 'ref=\K[e]\d+' | head -1)
if [ -n "$BILLING_TAB" ]; then
  agent-browser click "@$BILLING_TAB" 2>&1
  sleep 2
  ss "B2-pro-billing.png"
  agent-browser snapshot -c 2>&1 | tee -a "$P/download/test-log.txt"
fi

# Sign out
SIGNOUT=$(agent-browser snapshot -i 2>&1 | grep 'button "Sign out"' | grep -oP 'ref=\K[e]\d+' | head -1)
if [ -n "$SIGNOUT" ]; then
  agent-browser click "@$SIGNOUT" 2>&1
  sleep 3
fi

##################################################
echo ""
echo "╔══════════════════════════════════════╗"
echo "║  ROLE 3: AGENCY                    ║"
echo "╚══════════════════════════════════════╝"

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
agent-browser click "@$SUBMIT" 2>&1
sleep 6

echo "--- AGENCY DASHBOARD ---"
ss "C1-agency-dashboard.png"
agent-browser snapshot -c 2>&1 | tee -a "$P/download/test-log.txt"
agent-browser snapshot -i 2>&1 | tee -a "$P/download/test-log.txt"

# Check for agency-specific features
echo "--- Checking agency features ---"
BILLING_TAB=$(agent-browser snapshot -i 2>&1 | grep 'tab "Billing"' | grep -oP 'ref=\K[e]\d+' | head -1)
if [ -n "$BILLING_TAB" ]; then
  agent-browser click "@$BILLING_TAB" 2>&1
  sleep 2
  ss "C2-agency-billing.png"
  agent-browser snapshot -c 2>&1 | tee -a "$P/download/test-log.txt"
fi

# Sign out
SIGNOUT=$(agent-browser snapshot -i 2>&1 | grep 'button "Sign out"' | grep -oP 'ref=\K[e]\d+' | head -1)
if [ -n "$SIGNOUT" ]; then
  agent-browser click "@$SIGNOUT" 2>&1
  sleep 3
fi

##################################################
echo ""
echo "╔══════════════════════════════════════╗"
echo "║  ROLE 4: STUDENT                   ║"
echo "╚══════════════════════════════════════╝"

agent-browser open "http://localhost:3000/room/test-room-abc" 2>&1
sleep 5
echo "--- STUDENT ROOM ---"
ss "D1-student-room.png"
agent-browser snapshot 2>&1 | tee -a "$P/download/test-log.txt"
agent-browser errors 2>&1 | tee -a "$P/download/test-log.txt"

##################################################
echo ""
echo "=== SERVER LOGS ==="
tail -30 /tmp/next-dev.log | tee -a "$P/download/test-log.txt"

echo ""
echo "=== ALL TESTS COMPLETE ==="
kill %1 2>/dev/null || true
agent-browser close 2>/dev/null || true
