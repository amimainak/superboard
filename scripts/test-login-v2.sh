#!/bin/bash
set -e
export DATABASE_URL="postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
PROJECT="/home/z/my-project"
SCREENSHOTS="$PROJECT/download/screenshots"

pkill -f "next dev" 2>/dev/null || true
sleep 1

cd "$PROJECT"
npx next dev --turbopack -p 3000 > /tmp/next-dev.log 2>&1 &

for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
    echo "Server ready after ${i}s"; break
  fi
  sleep 1
done

agent-browser open "http://localhost:3000/" 2>&1
sleep 5

echo "=== Landing page interactive elements ==="
agent-browser snapshot -i 2>&1

echo ""
echo "=== Looking for Sign In button ==="
# Use semantic locator to find the Sign In button
agent-browser find role button click --name "Sign In" 2>&1
sleep 3

echo "=== Dialog elements ==="
ELEMENTS=$(agent-browser snapshot -i 2>&1)
echo "$ELEMENTS"

echo ""
echo "=== Filling form (find by label) ==="
agent-browser find label "Email" fill "free-tutor@superboard.app" 2>&1
sleep 0.5
agent-browser find label "Password" fill "FreeTutor1234!" 2>&1
sleep 0.5

echo "=== Screenshot: form filled ==="
agent-browser screenshot "$SCREENSHOTS/40-form-filled.png" 2>&1

echo "=== Clicking Sign In submit ==="
agent-browser find role button click --name "Sign In" 2>&1
sleep 6

echo "=== Screenshot: after login ==="
agent-browser screenshot "$SCREENSHOTS/41-after-login.png" 2>&1

echo "=== Page content ==="
agent-browser snapshot -c 2>&1 | head -50

echo "=== Current URL ==="
agent-browser get url 2>&1

echo "=== Console errors ==="
agent-browser errors 2>&1

echo "=== Network (auth/api) ==="
agent-browser network requests 2>&1 | grep -iE "supabase|auth|sign|api" | head -20

echo ""
echo "=== Server logs (last 20 lines) ==="
tail -20 /tmp/next-dev.log

echo ""
echo "=== DONE ==="
kill %1 2>/dev/null || true
agent-browser close 2>/dev/null || true
