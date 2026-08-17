#!/bin/bash
# ============================================================
# Superboard — Focused Bug Investigation
# ============================================================

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

mkdir -p "$SCREENSHOTS"

pkill -f "next dev" 2>/dev/null || true
sleep 1

cd "$PROJECT"
npx next dev --turbopack -p 3000 > /tmp/next-dev.log 2>&1 &
SERVER_PID=$!

for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
    echo "Server ready after ${i}s"
    break
  fi
  sleep 1
done

# ==========================================
# TEST 1: Open login dialog, switch to Sign In, fill, submit
# ==========================================
echo ""
echo "=== TEST 1: Login Flow ==="

agent-browser open "http://localhost:3000/" 2>&1
sleep 4

echo "--- Step 1: Click 'Sign In' button in navbar ---"
agent-browser snapshot -i 2>&1

# Click the Sign In button specifically (not Get Started)
agent-browser click @e5 2>&1
sleep 3

echo "--- Step 2: Login dialog opened ---"
agent-browser snapshot -i 2>&1
echo "--- Screenshot: 20-login-dialog.png ---"
agent-browser screenshot "$SCREENSHOTS/20-login-dialog.png" 2>&1

# Now we should see "Sign In" and "Register" tabs, and a form
# Click "Sign In" tab to make sure we're on the right form
echo "--- Step 3: Click Sign In tab ---"
INTERACTIVE=$(agent-browser snapshot -i 2>&1)
echo "$INTERACTIVE"

# Find Sign In tab
SIGNIN_TAB=$(echo "$INTERACTIVE" | grep -oP 'button "Sign In".*?ref=\K[e]\d+' | head -1)
echo "Sign In tab ref: $SIGNIN_TAB"

if [ -n "$SIGNIN_TAB" ]; then
  agent-browser click "@$SIGNIN_TAB" 2>&1
  sleep 1
fi

echo "--- Step 4: Sign In form ---"
INTERACTIVE=$(agent-browser snapshot -i 2>&1)
echo "$INTERACTIVE"
echo "--- Screenshot: 21-signin-form.png ---"
agent-browser screenshot "$SCREENSHOTS/21-signin-form.png" 2>&1

# Fill credentials
EMAIL_REF=$(echo "$INTERACTIVE" | grep 'textbox' | grep -oP 'ref=\K[e]\d+' | head -1)
PASS_REF=$(echo "$INTERACTIVE" | grep 'textbox' | grep -oP 'ref=\K[e]\d+' | tail -1)
echo "Email ref: $EMAIL_REF, Password ref: $PASS_REF"

agent-browser fill "@$EMAIL_REF" "free-tutor@superboard.app" 2>&1
agent-browser fill "@$PASS_REF" "FreeTutor1234!" 2>&1
sleep 1

echo "--- Screenshot: 22-signin-filled.png ---"
agent-browser screenshot "$SCREENSHOTS/22-signin-filled.png" 2>&1

# Find and click submit button (NOT close)
INTERACTIVE=$(agent-browser snapshot -i 2>&1)
echo "--- Interactive before submit: ---"
echo "$INTERACTIVE"

SUBMIT_REF=$(echo "$INTERACTIVE" | grep -i 'button' | grep -v 'Sign In"' | grep -v 'Register"' | grep -v 'Close' | grep -oP 'ref=\K[e]\d+' | head -1)
echo "Submit ref: $SUBMIT_REF"

if [ -n "$SUBMIT_REF" ]; then
  echo "Clicking submit button..."
  agent-browser click "@$SUBMIT_REF" 2>&1
  sleep 5
fi

echo "--- Screenshot: 23-after-signin-attempt.png ---"
agent-browser screenshot "$SCREENSHOTS/23-after-signin-attempt.png" 2>&1

echo "--- Page after login attempt ---"
agent-browser snapshot -c 2>&1 | head -40

echo "--- Current URL ---"
agent-browser get url 2>&1

echo "--- Console errors ---"
agent-browser errors 2>&1

# ==========================================
# TEST 2: Check network requests for auth
# ==========================================
echo ""
echo "=== TEST 2: Network requests ==="
agent-browser network requests --filter auth 2>&1 | head -20

# ==========================================
# TEST 3: Try with cookie-based auth bypass
# ==========================================
echo ""
echo "=== TEST 3: Check if Supabase auth works ==="
# Check if the Supabase keys are properly loaded by checking network
agent-browser network requests 2>&1 | head -30

# ==========================================
# TEST 4: Student room page
# ==========================================
echo ""
echo "=== TEST 4: Student Room ==="

agent-browser open "http://localhost:3000/room/test-room-abc" 2>&1
sleep 4

echo "--- Screenshot: 30-student-room.png ---"
agent-browser screenshot "$SCREENSHOTS/30-student-room.png" 2>&1

echo "--- Full page content ---"
agent-browser snapshot 2>&1 | head -50

echo "--- Console errors ---"
agent-browser errors 2>&1

# ==========================================
# TEST 5: Check API directly  
# ==========================================
echo ""
echo "=== TEST 5: API health check ==="
curl -s "http://localhost:3000/api/auth/profile?userId=36b8071d-fad3-4edb-ba53-cbab0fde9bad" 2>&1
echo ""
curl -s "http://localhost:3000/api/usage/current?userId=36b8071d-fad3-4edb-ba53-cbab0fde9bad" 2>&1

echo ""
echo "=== DONE ==="
kill $SERVER_PID 2>/dev/null || true
agent-browser close 2>/dev/null || true
