#!/usr/bin/env python3
"""Fix BreakoutRoomsWidget.tsx inline styles for light/dark mode support."""

import sys

FILE_PATH = '/home/z/my-project/src/components/room/widgets/BreakoutRoomsWidget.tsx'

with open(FILE_PATH, 'r') as f:
    content = f.read()

# Define replacements as (old, new) pairs.
# Order matters: do longer / more specific patterns first to avoid partial matches.
replacements = [
    # --- Backgrounds ---
    # rgba(15,23,42,0.6) → isDark ? same : '#ffffff'  (input backgrounds)
    (
        "background: 'rgba(15,23,42,0.6)'",
        "background: isDark ? 'rgba(15,23,42,0.6)' : '#ffffff'",
    ),
    # rgba(15,23,42,0.5) → isDark ? same : 'rgba(241,245,249,0.8)'  (card backgrounds)
    (
        "background: 'rgba(15,23,42,0.5)'",
        "background: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(241,245,249,0.8)'",
    ),
    # rgba(255,255,255,0.05) → isDark ? same : 'rgba(0,0,0,0.04)'
    (
        "background: 'rgba(255,255,255,0.05)'",
        "background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'",
    ),
    # rgba(255,255,255,0.04) → isDark ? same : 'rgba(0,0,0,0.03)'
    (
        "background: 'rgba(255,255,255,0.04)'",
        "background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'",
    ),

    # --- Borders ---
    # rgba(255,255,255,0.1) in border → isDark ? same : 'rgba(0,0,0,0.12)'
    (
        "border: '1px solid rgba(255,255,255,0.1)'",
        "border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)'",
    ),
    # rgba(255,255,255,0.06) in border → isDark ? same : 'rgba(0,0,0,0.08)'
    (
        "border: '1px solid rgba(255,255,255,0.06)'",
        "border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)'",
    ),

    # --- Text colors ---
    # #f1f5f9 (heading) → isDark ? same : '#0f172a'
    (
        "color: '#f1f5f9'",
        "color: isDark ? '#f1f5f9' : '#0f172a'",
    ),
    # #e2e8f0 (bright text) → isDark ? same : '#1e293b'
    (
        "color: '#e2e8f0'",
        "color: isDark ? '#e2e8f0' : '#1e293b'",
    ),
    # #cbd5e1 (secondary text) → isDark ? same : '#334155'
    (
        "color: '#cbd5e1'",
        "color: isDark ? '#cbd5e1' : '#334155'",
    ),
    # #94a3b8 (muted text) → isDark ? same : '#475569'
    (
        "color: '#94a3b8'",
        "color: isDark ? '#94a3b8' : '#475569'",
    ),
    # #475569 (hint text) → isDark ? same : '#64748b'
    (
        "color: '#475569'",
        "color: isDark ? '#475569' : '#64748b'",
    ),
    # #64748b (label text) → same in both modes, no change needed
]

# Apply replacements
for old, new in replacements:
    count = content.count(old)
    if count > 0:
        content = content.replace(old, new)
        print(f'  Replaced "{old}" → {count} occurrence(s)')
    else:
        print(f'  WARNING: not found: "{old}"')

with open(FILE_PATH, 'w') as f:
    f.write(content)

print(f'\nDone. File written: {FILE_PATH}')
