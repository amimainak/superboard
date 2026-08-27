#!/usr/bin/env bash
# ============================================================
# Dependency Security Audit Script
# ============================================================
# Runs npm audit, checks for known vulnerabilities, and generates
# a report. Can be run in CI/CD pipelines or locally.
#
# Usage:
#   ./scripts/audit-dependencies.sh [--ci]
#
# Flags:
#   --ci  Exit with non-zero code if critical/high vulnerabilities found
# ============================================================

set -euo pipefail

cd "$(dirname "$0")/.."

echo "=============================================="
echo "  Superboard Dependency Security Audit"
echo "  Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "=============================================="
echo ""

CI_MODE=false
if [[ "${1:-}" == "--ci" ]]; then
  CI_MODE=true
fi

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# ---- 1. npm audit ----
echo "--- npm audit (main project) ---"
if command -v npm &> /dev/null; then
  AUDIT_OUTPUT=$(npm audit --json 2>&1 || true)

  # Count vulnerabilities by severity
  CRITICAL=$(echo "$AUDIT_OUTPUT" | jq '.vulnerabilities | to_entries | map(select(.value.severity == "critical")) | length' 2>/dev/null || echo "0")
  HIGH=$(echo "$AUDIT_OUTPUT" | jq '.vulnerabilities | to_entries | map(select(.value.severity == "high")) | length' 2>/dev/null || echo "0")
  MODERATE=$(echo "$AUDIT_OUTPUT" | jq '.vulnerabilities | to_entries | map(select(.value.severity == "moderate")) | length' 2>/dev/null || echo "0")
  LOW=$(echo "$AUDIT_OUTPUT" | jq '.vulnerabilities | to_entries | map(select(.value.severity == "low")) | length' 2>/dev/null || echo "0")

  echo "  Critical:  $CRITICAL"
  echo "  High:      $HIGH"
  echo "  Moderate:  $MODERATE"
  echo "  Low:       $LOW"
  echo ""

  # CI check
  if $CI_MODE && ([ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]); then
    echo -e "${RED}[CI FAIL] Critical or High vulnerabilities found${NC}"
    exit 1
  fi
else
  echo "  npm not found — skipping"
fi

# ---- 2. Check for outdated packages ----
echo "--- Outdated packages ---"
if command -v npm &> /dev/null; then
  npm outdated 2>&1 || true
fi
echo ""

# ---- 3. Check lockfile integrity ----
echo "--- Lockfile integrity ---"
if [[ -f "package-lock.json" ]]; then
  echo "  package-lock.json: present"
  # Verify lockfile matches package.json
  if npm ls --depth=0 > /dev/null 2>&1; then
    echo -e "  ${GREEN}Lockfile is consistent with package.json${NC}"
  else
    echo -e "  ${RED}Lockfile may be out of sync — run npm install${NC}"
  fi
else
  echo -e "  ${YELLOW}WARNING: No package-lock.json found${NC}"
fi
echo ""

# ---- 4. Known risky packages check ----
echo "--- Known risky package patterns ---"
RISKY_PATTERNS=(
  "event-stream"     # Supply chain attack (2018)
  "flatmap-stream"   # Supply chain attack (2018)
  "lodash<4.17.12"   # Prototype pollution
  "minimist<0.2.1"   # Prototype pollution
  "axios<0.21.1"     # SSRF vulnerability
)

FOUND_RISKY=false
for pattern in "${RISKY_PATTERNS[@]}"; do
  # Simple check — grep the lockfile for these patterns
  if grep -q "$pattern" package-lock.json 2>/dev/null; then
    echo -e "  ${RED}FOUND: $pattern${NC}"
    FOUND_RISKY=true
  fi
done

if ! $FOUND_RISKY; then
  echo -e "  ${GREEN}No known risky packages detected${NC}"
fi
echo ""

# ---- 5. Sub-dependency depth check ----
echo "--- Dependency tree depth ---"
if command -v npm &> /dev/null; then
  MAX_DEPTH=$(npm ls --all 2>/dev/null | grep -c "^[│├└┬─ ]" || echo "unknown")
  echo "  Approximate dependency tree entries: $MAX_DEPTH"
fi
echo ""

# ---- 6. License compliance check ----
echo "--- License summary ---"
if command -v npx &> /dev/null; then
  npx license-checker --summary 2>/dev/null || echo "  (license-checker not available)"
fi
echo ""

echo "=============================================="
echo "  Audit Complete"
if $CI_MODE; then
  echo -e "  ${GREEN}CI PASSED${NC}"
else
  echo "  Review results above for action items"
fi
echo "=============================================="
