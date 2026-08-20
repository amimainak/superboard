#!/bin/bash
# ============================================================
# Vercel Deployment Setup for Superboard
# ============================================================
# Run these commands from your project root to deploy to Vercel.
# ============================================================

echo "=== Superboard Vercel Deployment Setup ==="
echo ""
echo "STEP 1: Link to Vercel"
echo "  vercel link"
echo ""
echo "STEP 2: Add environment variables"
echo "  vercel env add DATABASE_URL production"
echo '  Paste: postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
echo ""
echo "  vercel env add DIRECT_URL production"
echo '  Paste: postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
echo ""
echo "  vercel env add NEXT_PUBLIC_SUPABASE_URL production"
echo '  Paste: https://sjbxyxallfeyfuplacnn.supabase.co'
echo ""
echo "  vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production"
echo '  Paste: (your Supabase anon key from Settings > API)'
echo ""
echo "STEP 3: Deploy"
echo "  vercel --prod"
echo ""
echo "--- Or add all vars in Vercel Dashboard ---"
echo "  Vercel → Project Settings → Environment Variables"
echo ""
echo "  Name                          Value"
echo "  ────────────────────────────── ─────────────────────────────────────────────────────────────────────────"
echo "  DATABASE_URL                   postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
echo "  DIRECT_URL                     postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
echo "  NEXT_PUBLIC_SUPABASE_URL       https://ruygzmkqtdogtencjdzg.supabase.co"
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY   (get from Supabase Dashboard > Settings > API)"
echo ""
