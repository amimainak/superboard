#!/bin/bash
# Start the K-12 AI Superboard dev server
# Runs in foreground — do NOT background this script
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=512"
exec npx next dev --port 3000
