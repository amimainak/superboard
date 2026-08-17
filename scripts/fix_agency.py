#!/usr/bin/env python3
"""
Fix AgencyWidget.tsx: convert hardcoded dark-mode inline styles to isDark ternaries.
"""

FILE = '/home/z/my-project/src/components/room/widgets/AgencyWidget.tsx'

with open(FILE, 'r') as f:
    content = f.read()

# Order: longest/most specific first to avoid partial match issues
replacements = [
    # rgba backgrounds/borders — 0.05 (not present but included for safety)
    ("'rgba(255,255,255,0.05)'", "isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)"),

    # rgba backgrounds/borders — 0.06
    ("'rgba(255,255,255,0.06)'", "isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)"),

    # rgba backgrounds/borders — 0.1
    ("'rgba(255,255,255,0.1)'", "isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)"),

    # rgba card backgrounds — 0.5
    ("'rgba(15,23,42,0.5)'", "isDark ? 'rgba(15,23,42,0.5)' : 'rgba(241,245,249,0.8)"),

    # rgba input background — 0.6
    ("'rgba(15,23,42,0.6)'", "isDark ? 'rgba(15,23,42,0.6)' : '#ffffff'"),

    # heading text
    ("'#f1f5f9'", "isDark ? '#f1f5f9' : '#0f172a'"),

    # bright text
    ("'#e2e8f0'", "isDark ? '#e2e8f0' : '#1e293b'"),

    # muted text
    ("'#94a3b8'", "isDark ? '#94a3b8' : '#475569'"),

    # label text — same both modes, no change needed, but let's be explicit
    # ('#64748b' stays as-is per the mapping)
]

for old, new in replacements:
    count = content.count(old)
    if count > 0:
        content = content.replace(old, new)
        print(f"  Replaced '{old}' -> ternary  ({count} occurrence(s))")
    else:
        print(f"  No match for '{old}'")

with open(FILE, 'w') as f:
    f.write(content)

print(f"\nDone. Written to {FILE}")
