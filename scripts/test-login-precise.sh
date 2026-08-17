#!/bin/bash
# ============================================================
# Superboard — Precise Login Test
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

pkill -f "next dev" 2>/dev/null || true
sleep 1

cd "$PROJECT"
npx next dev --turbopack -p 3000 > /tmp/next-dev.log 2>&1 &
SERVER_PID=$!

for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
    echo "Server ready after ${i}s"; break
  fi
  sleep 1
done

agent-browser open "http://localhost:3000/" 2>&1
sleep 4

# Click "Sign In" in navbar
echo "=== Clicking Sign In (navbar) ==="
agent-browser click @e5 2>&1
sleep 3

# Get all interactive elements in the dialog
echo "=== Dialog elements ==="
agent-browser snapshot -i 2>&1

# The dialog should have:
# e1: heading "Welcome back"
# e2: button "Sign In" (tab, already active)
# e3: button "Register" (tab)
# e4: button "Close"
# e5: textbox "Email"
# e6: textbox "Password"  
# e7: button "Sign In" (submit button)
# e8: Dev Tools button (outside dialog)
# e9: issues button
# e10: collapse button

echo "=== Filling email ==="
agent-browser fill @e5 "free-tutor@superboard.app" 2>&1
sleep 0.5

echo "=== Filling password ==="
agent-browser fill @e6 "FreeTutor1234!" 2>&1
sleep 0.5

echo "=== Screenshot before submit ==="
agent-browser screenshot "$SCREENSHOTS/40-login-ready-to-submit.png" 2>&1

echo "=== Clicking Sign In submit button (@e7) ==="
agent-browser click @e7 2>&1
sleep 5

echo "=== Screenshot after login ==="
agent-browser screenshot "$SCREENSHOTS/41-after-login.png" 2>&1

echo "=== Page content after login ==="
agent-browser snapshot -c 2>&1 | head -40

echo "=== Current URL ==="
agent-browser get url 2>&1

echo "=== Console errors ==="
agent-browser errors 2>&1

echo "=== Network requests (filtered) ==="
agent-browser network requests 2>&1 | grep -i "supabase\|auth\|api" | head -20

echo "=== Server logs ==="
tail -20 /tmp/next-dev.log

echo "=== DONE ==="
kill $SERVER_PID 2>/dev/null || true
agent-browser close 2>/dev/null || true
