#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
exec npx next dev --turbopack --port 3000
