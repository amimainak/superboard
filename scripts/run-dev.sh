#!/bin/bash
# SECURITY FIX (V-02): Use .env.local for DATABASE_URL, not hardcoded credentials.
cd /home/z/my-project

# Load environment variables from .env.local if it exists
if [[ -f ".env.local" ]]; then
  set -a
  source .env.local
  set +a
fi

# Validate DATABASE_URL is set
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set. Create .env.local with your DATABASE_URL."
  exit 1
fi

exec npx next dev --turbopack --port 3000
