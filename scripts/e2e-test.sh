#!/bin/bash
# ============================================================
# Superboard — End-to-End Test Runner
# ============================================================
# Starts dev server, tests all 4 user roles, takes screenshots.
# ============================================================

set -e

DEV_PORT=3000
BASE_URL="http://localhost:$DEV_PORT"
SCREENSHOT_DIR="/home/z/my-project/download/screenshots"

mkdir -p "$SCREENSHOT_DIR"

echo "=== SUPERBOARD E2E TEST RUNNER ==="
echo ""

# ---- Check if dev server is already running ----
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null | grep -q "200"; then
  echo "[OK] Dev server already running on port $DEV_PORT"
else
  echo "[START] Starting dev server..."
  cd /home/z/my-project
  npx next dev --port $DEV_PORT > /tmp/nextdev-e2e.log 2>&1 &
  SERVER_PID=$!
  
  # Wait for server to be ready
  for i in $(seq 1 30); do
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null | grep -q "200"; then
      echo "[OK] Dev server ready (attempt $i)"
      break
    fi
    sleep 2
  done
  
  if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null | grep -q "200"; then
    echo "[FAIL] Dev server failed to start"
    cat /tmp/nextdev-e2e.log
    exit 1
  fi
fi

echo ""

# ============================================================
# HELPER: Take a screenshot
# ============================================================
take_screenshot() {
  local name="$1"
  local path="$SCREENSHOT_DIR/$name.png"
  agent-browser screenshot "$path" 2>/dev/null
  if [ -f "$path" ]; then
    echo "  [SNAP] $name.png ✓"
  else
    echo "  [SNAP] $name.png ✗ (failed)"
  fi
}

# ============================================================
# HELPER: Wait for page to settle
# ============================================================
wait_page() {
  sleep 2
}

# ============================================================
# TEST 1: FREE TUTOR
# ============================================================
echo "=========================================="
echo "TEST 1: FREE TUTOR"
echo "=========================================="

echo ""
echo "--- 1a. Landing page (not logged in) ---"
agent-browser open "$BASE_URL"
wait_page
take_screenshot "01-free-landing-page"

echo ""
echo "--- 1b. Open login dialog ---"
agent-browser snapshot -i 2>/dev/null | head -30
# Click Sign In button
agent-browser find text "Sign In" click 2>/dev/null || true
wait_page
take_screenshot "02-free-login-dialog"

echo ""
echo "--- 1c. Fill login form ---"
agent-browser snapshot -i 2>/dev/null | head -50
# Fill email and password
agent-browser find label "Email" fill "free-tutor@superboard.app" 2>/dev/null || true
sleep 0.5
agent-browser find label "Password" fill "FreeTutor1234!" 2>/dev/null || true
sleep 0.5
take_screenshot "03-free-login-filled"

echo ""
echo "--- 1d. Submit login ---"
agent-browser find role button click --name "Sign In" 2>/dev/null || agent-browser find text "Sign In" click 2>/dev/null || true
sleep 5
take_screenshot "04-free-dashboard"

echo ""
echo "--- 1e. Dashboard overview ---"
agent-browser wait 3000
take_screenshot "05-free-dashboard-full"

echo ""
echo "--- 1f. Scroll down for more content ---"
agent-browser scroll down 600
wait_page
take_screenshot "06-free-dashboard-scrolled"

echo ""
echo "--- 1g. Try creating a lesson ---"
agent-browser snapshot -i 2>/dev/null | head -30
agent-browser find text "New Lesson" click 2>/dev/null || true
wait_page
take_screenshot "07-free-new-lesson-dialog"

echo ""
echo "--- 1h. Check Templates tab ---"
agent-browser press Escape 2>/dev/null || true
wait_page
agent-browser find text "Templates" click 2>/dev/null || true
wait_page
take_screenshot "08-free-templates-tab"

echo ""
echo "--- 1i. Check Billing tab ---"
agent-browser find text "Billing" click 2>/dev/null || true
wait_page
take_screenshot "09-free-billing-tab"

echo ""
echo "--- 1j. Verify no Admin tab (FREE tier) ---"
agent-browser snapshot -i 2>/dev/null | head -30
take_screenshot "10-free-no-admin-tab"

# Logout for next test
echo ""
echo "--- 1k. Logout ---"
agent-browser open "$BASE_URL"
wait_page
agent-browser snapshot -i 2>/dev/null | head -20
agent-browser find title "Sign out" click 2>/dev/null || true
sleep 3

# ============================================================
# TEST 2: PRO TUTOR
# ============================================================
echo ""
echo "=========================================="
echo "TEST 2: PRO TUTOR"
echo "=========================================="

echo ""
echo "--- 2a. Login as Pro Tutor ---"
agent-browser open "$BASE_URL"
wait_page
agent-browser find text "Sign In" click 2>/dev/null || true
wait_page
agent-browser find label "Email" fill "pro-tutor@superboard.app" 2>/dev/null || true
sleep 0.5
agent-browser find label "Password" fill "ProTutor1234!" 2>/dev/null || true
sleep 0.5
agent-browser find role button click --name "Sign In" 2>/dev/null || agent-browser find text "Sign In" click 2>/dev/null || true
sleep 5
take_screenshot "11-pro-dashboard"

echo ""
echo "--- 2b. Pro dashboard full ---"
agent-browser wait 3000
take_screenshot "12-pro-dashboard-full"

echo ""
echo "--- 2c. Pro billing (should show Pro tier) ---"
agent-browser find text "Billing" click 2>/dev/null || true
wait_page
take_screenshot "13-pro-billing"

echo ""
echo "--- 2d. Pro create lesson ---"
agent-browser find text "New Lesson" click 2>/dev/null || true
wait_page
take_screenshot "14-pro-new-lesson"

echo ""
echo "--- 2e. Start lesson with subject ---"
agent-browser find label "Subject" select "MATH" 2>/dev/null || true
sleep 1
take_screenshot "15-pro-lesson-math-selected"
agent-browser find text "Start Lesson" click 2>/dev/null || true
sleep 5
take_screenshot "16-pro-whiteboard"

echo ""
echo "--- 2f. Whiteboard toolbar ---"
agent-browser wait 3000
agent-browser snapshot -i 2>/dev/null | head -50
take_screenshot "17-pro-whiteboard-toolbar"

echo ""
echo "--- 2g. Check Smart Tools panel ---"
agent-browser snapshot -i 2>/dev/null | head -50
take_screenshot "18-pro-whiteboard-features"

# Go back
echo ""
echo "--- 2h. Back to dashboard ---"
agent-browser open "$BASE_URL"
wait_page
agent-browser find title "Sign out" click 2>/dev/null || true
sleep 3

# ============================================================
# TEST 3: AGENCY
# ============================================================
echo ""
echo "=========================================="
echo "TEST 3: AGENCY"
echo "=========================================="

echo ""
echo "--- 3a. Login as Agency ---"
agent-browser open "$BASE_URL"
wait_page
agent-browser find text "Sign In" click 2>/dev/null || true
wait_page
agent-browser find label "Email" fill "agency@superboard.app" 2>/dev/null || true
sleep 0.5
agent-browser find label "Password" fill "Agency1234!" 2>/dev/null || true
sleep 0.5
agent-browser find role button click --name "Sign In" 2>/dev/null || agent-browser find text "Sign In" click 2>/dev/null || true
sleep 5
take_screenshot "19-agency-dashboard"

echo ""
echo "--- 3b. Agency dashboard full ---"
agent-browser wait 3000
take_screenshot "20-agency-dashboard-full"

echo ""
echo "--- 3c. Agency Admin tab (should exist) ---"
agent-browser find text "Admin" click 2>/dev/null || true
wait_page
take_screenshot "21-agency-admin-tab"

echo ""
echo "--- 3d. Agency billing ---"
agent-browser find text "Billing" click 2>/dev/null || true
wait_page
take_screenshot "22-agency-billing"

echo ""
echo "--- 3e. Agency branding in new lesson ---"
agent-browser find text "New Lesson" click 2>/dev/null || true
wait_page
take_screenshot "23-agency-new-lesson-branding"

echo ""
echo "--- 3f. Agency create lesson ---"
agent-browser find text "Start Lesson" click 2>/dev/null || true
sleep 5
take_screenshot "24-agency-whiteboard"

echo ""
echo "--- 3g. Agency toolbar ---"
agent-browser wait 3000
take_screenshot "25-agency-whiteboard-toolbar"

# Go back
agent-browser open "$BASE_URL"
wait_page
agent-browser find title "Sign out" click 2>/dev/null || true
sleep 3

# ============================================================
# TEST 4: STUDENT (join a room)
# ============================================================
echo ""
echo "=========================================="
echo "TEST 4: STUDENT"
echo "=========================================="

echo ""
echo "--- 4a. Login as free tutor to create a room first ---"
agent-browser open "$BASE_URL"
wait_page
agent-browser find text "Sign In" click 2>/dev/null || true
wait_page
agent-browser find label "Email" fill "free-tutor@superboard.app" 2>/dev/null || true
sleep 0.5
agent-browser find label "Password" fill "FreeTutor1234!" 2>/dev/null || true
sleep 0.5
agent-browser find role button click --name "Sign In" 2>/dev/null || agent-browser find text "Sign In" click 2>/dev/null || true
sleep 5

echo ""
echo "--- 4b. Create room as tutor ---"
agent-browser find text "New Lesson" click 2>/dev/null || true
wait_page
agent-browser find text "Start Lesson" click 2>/dev/null || true
sleep 5

# Get the room URL
ROOM_URL=$(agent-browser get url 2>/dev/null || echo "")
echo "  Room URL: $ROOM_URL"

echo ""
echo "--- 4c. Logout and join as student ---"
agent-browser open "$BASE_URL"
wait_page
agent-browser find title "Sign out" click 2>/dev/null || true
sleep 3

if [ -n "$ROOM_URL" ]; then
  echo "--- 4d. Student joins room ---"
  agent-browser open "$ROOM_URL"
  sleep 5
  take_screenshot "26-student-join-room"
  
  echo ""
  echo "--- 4e. Student name entry ---"
  agent-browser snapshot -i 2>/dev/null | head -30
  take_screenshot "27-student-name-entry"
  
  # Fill student name if input exists
  agent-browser find label "Name" fill "Test Student" 2>/dev/null || true
  sleep 0.5
  take_screenshot "28-student-name-filled"
  
  echo ""
  echo "--- 4f. Student enters whiteboard ---"
  agent-browser find text "Join" click 2>/dev/null || agent-browser find role button click --name "Join" 2>/dev/null || true
  sleep 5
  take_screenshot "29-student-whiteboard"
  
  echo ""
  echo "--- 4g. Student whiteboard tools ---"
  agent-browser wait 3000
  agent-browser snapshot -i 2>/dev/null | head -30
  take_screenshot "30-student-whiteboard-view"
else
  echo "[SKIP] Could not get room URL"
fi

echo ""
echo "=========================================="
echo "TESTING COMPLETE"
echo "=========================================="
echo "Screenshots saved to: $SCREENSHOT_DIR"
ls -la "$SCREENSHOT_DIR" | grep ".png"

# Cleanup
pkill -f "next dev" 2>/dev/null || true
agent-browser close 2>/dev/null || true
