#!/bin/bash
# ============================================================
# Vercel Environment Variables Setup for Superboard
# ============================================================
# Run this script AFTER running: vercel link
# Then: vercel env add DATABASE_URL production
#       vercel env add DIRECT_URL production
# ============================================================

echo "Setting up Vercel environment variables..."
echo ""
echo "Run these commands after 'vercel link':"
echo ""
echo 'vercel env add DATABASE_URL production <<< "postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"'
echo 'vercel env add DIRECT_URL production <<< "postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"'
echo ""
echo "Or add them in the Vercel Dashboard:"
echo "  → Project Settings → Environment Variables"
echo ""
echo "  DATABASE_URL  = postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
echo "  DIRECT_URL    = postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
