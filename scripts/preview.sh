#!/bin/bash
# Preview script — starts Next.js server, verifies, opens browser
set -e
cd /home/z/my-project
PORT=4567

# Kill leftovers
pkill -f "next" 2>/dev/null; pkill -f "server.js" 2>/dev/null
sleep 1

# Start server — standalone mode listens on PORT env var
PORT=$PORT node .next/standalone/server.js &
SERVER_PID=$!
echo "Started server PID=$SERVER_PID on port $PORT"

# Wait for readiness
for i in $(seq 1 20); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$PORT/ 2>/dev/null || echo "000")
  if [ "$CODE" = "200" ]; then
    echo "Server ready after ${i}s"
    break
  fi
  if [ "$CODE" = "000" ]; then
    # Check if process died
    if ! kill -0 $SERVER_PID 2>/dev/null; then
      echo "Server process died"
      exit 1
    fi
  fi
  sleep 1
done

FINAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$PORT/ 2>/dev/null || echo "000")
echo "Final HTTP status: $FINAL_CODE"

if [ "$FINAL_CODE" != "200" ]; then
  echo "Server not responding — aborting"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

echo ""
echo "=== Launching agent-browser ==="
agent-browser open "http://127.0.0.1:$PORT/" 2>&1
sleep 5

echo "=== Page snapshot ==="
agent-browser snapshot -c 2>&1 || true

echo "=== Screenshot ==="
mkdir -p /home/z/my-project/download
agent-browser screenshot /home/z/my-project/download/preview-home.png 2>&1 || true

echo ""
echo "=== Opening room page ==="
agent-browser open "http://127.0.0.1:$PORT/room/86e16a89" 2>&1
sleep 5

echo "=== Room snapshot ==="
agent-browser snapshot -c 2>&1 || true

echo "=== Room screenshot ==="
agent-browser screenshot /home/z/my-project/download/preview-room.png 2>&1 || true

kill $SERVER_PID 2>/dev/null
echo "=== DONE ==="
