# Task 4a: Upgrade Vulnerable Dependencies

## Status: COMPLETED

### What was checked
| Package | Before | After | Status |
|---------|--------|-------|--------|
| nanoid | 3.3.17 (transitive) | 3.3.18 | ✅ Fixed via `npm audit fix` |
| fabric | 6.9.1 (direct) | 7.4.0 | ✅ Upgraded (safe — not imported in src/) |
| tar | 6.2.1 (deep transitive) | 6.2.1 | ❌ UNFIXABLE — pdfjs-dist → canvas@2.11.2 → @mapbox/node-pre-gyp |
| js-yaml | 4.3.0 (transitive) | 4.3.0 | ❌ NO FIX — upstream hasn't patched CVE-2026-59870 |

### Vulnerability reduction
- Before: 5 (4 high, 1 critical)
- After: 4 (3 high, 1 critical)

### Notes
- tar vulnerability only affects Node.js tar extraction (not browser runtime)
- js-yaml vulnerability requires parsing untrusted YAML (minimal risk in this app)
- Both unfixed issues are deep transitive dependencies requiring upstream patches
