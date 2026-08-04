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

# Click Sign In in navbar
agent-browser click @e5 2>&1
sleep 3

# Dialog is now open with known refs:
# e5 = textbox "Email", e6 = textbox "Password", e7 = button "Sign In" (submit)
# e4 = button "Close"

echo "=== Filling login form ==="
agent-browser fill @e5 "free-tutor@superboard.app" 2>&1
sleep 0.3
agent-browser fill @e6 "FreeTutor1234!" 2>&1
sleep 0.3

echo "=== Screenshot: ready to submit ==="
agent-browser screenshot "$SCREENSHOTS/50-ready-submit.png" 2>&1

echo "=== Clicking Sign In submit button @e7 ==="
agent-browser click @e7 2>&1
sleep 8

echo "=== Screenshot: after login attempt ==="
agent-browser screenshot "$SCREENSHOTS/51-after-login.png" 2>&1

echo "=== Page snapshot ==="
agent-browser snapshot -c 2>&1 | head -50

echo "=== Current URL ==="
agent-browser get url 2>&1

echo "=== Console errors ==="
agent-browser errors 2>&1

echo "=== All network requests (last 30) ==="
agent-browser network requests 2>&1 | tail -30

echo "=== Server logs ==="
tail -20 /tmp/next-dev.log

# Now test other roles
echo ""
echo "============================================="
echo "=== LOGIN AS PRO TUTOR ==="
echo "============================================="

agent-browser cookies clear 2>&1
agent-browser open "http://localhost:3000/" 2>&1
sleep 5

agent-browser click @e5 2>&1
sleep 3
agent-browser fill @e5 "pro-tutor@superboard.app" 2>&1
agent-browser fill @e6 "ProTutor1234!" 2>&1
agent-browser screenshot "$SCREENSHOTS/52-pro-tutor-filled.png" 2>&1
agent-browser click @e7 2>&1
sleep 8
agent-browser screenshot "$SCREENSHOTS/53-pro-tutor-dashboard.png" 2>&1
echo "Pro tutor URL:"
agent-browser get url 2>&1
agent-browser snapshot -c 2>&1 | head -30

echo ""
echo "============================================="
echo "=== LOGIN AS AGENCY ==="
echo "============================================="

agent-browser cookies clear 2>&1
agent-browser open "http://localhost:3000/" 2>&1
sleep 5

agent-browser click @e5 2>&1
sleep 3
agent-browser fill @e5 "agency@superboard.app" 2>&1
agent-browser fill @e6 "Agency1234!" 2>&1
agent-browser screenshot "$SCREENSHOTS/54-agency-filled.png" 2>&1
agent-browser click @e7 2>&1
sleep 8
agent-browser screenshot "$SCREENSHOTS/55-agency-dashboard.png" 2>&1
echo "Agency URL:"
agent-browser get url 2>&1
agent-browser snapshot -c 2>&1 | head -30

echo ""
echo "============================================="
echo "=== STUDENT ROOM ==="
echo "============================================="

agent-browser cookies clear 2>&1
agent-browser open "http://localhost:3000/room/test-room-abc" 2>&1
sleep 5
agent-browser screenshot "$SCREENSHOTS/56-student-room.png" 2>&1
agent-browser snapshot -c 2>&1 | head -30
echo "Student room URL:"
agent-browser get url 2>&1

echo ""
echo "=== ALL DONE ==="
kill %1 2>/dev/null || true
agent-browser close 2>/dev/null || true
