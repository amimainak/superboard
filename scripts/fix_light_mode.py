#!/usr/bin/env python3
"""Batch-update remaining widget JSX files for light mode class switching."""
import re

BASE = '/home/z/my-project/src/components/room/widgets'

# Helper: replace className="foo" with className={`foo ${isDark ? '' : 'foo-light'}`}
# Only if foo-light exists in widgets.css

def has_light_variant(class_name):
    """Check if a -light CSS variant exists in widgets.css"""
    with open(f'{BASE}/widgets.css', 'r') as f:
        css = f.read()
    return f'.{class_name}-light' in css


def patch_file(filepath, class_patterns):
    """Patch a file: for each pattern, replace className="pattern" with isDark conditional."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    for cls in class_patterns:
        if not has_light_variant(cls):
            continue
        # Pattern 1: className="exact-class" -> className={`exact-class ${isDark ? '' : 'exact-class-light'}`}
        # But skip if already has isDark
        old = f'className="{cls}"'
        new = f'className={{`{cls} ${{isDark ? '' : \'{cls}-light\'}}`}}'
        content = content.replace(old, new)
        
        # Pattern 2: className={`foo ${isDark ? '' : 'foo-light'}`} already done - skip
        # Pattern 3: className={[...].join(' ')} - skip arrays
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f'  Patched {filepath}')


# 1. SchedulingWidget - remaining classes
print('=== SchedulingWidget ===')
patch_file(f'{BASE}/SchedulingWidget.tsx', [
    'sched-day-off', 'sched-add-slot-btn', 'sched-section-label',
    'sched-empty', 'sched-booking-card', 'sched-booking-date',
    'sched-booking-student', 'sched-booking-email', 'sched-booking-notes',
    'sched-share-section', 'sched-share-label',
])

# 2. GeoGebraPanel
print('=== GeoGebraPanel ===')
patch_file(f'{BASE}/GeoGebraPanel.tsx', [
    'widget-geogebra', 'geogebra-header', 'geogebra-input-group',
    'geogebra-canvas-placeholder', 'toolkit-chip',
])

# 3. ParentPortalWidget - needs import + isDark first
print('=== ParentPortalWidget ===')
with open(f'{BASE}/ParentPortalWidget.tsx', 'r') as f:
    content = f.read()

# Add import if not present
if 'useWhiteboardStore' not in content:
    content = content.replace(
        "import { getTierLabel, getTierPrice } from '@/lib/features'",
        "import { useWhiteboardStore } from '@/lib/whiteboard/store'\nimport { getTierLabel, getTierPrice } from '@/lib/features'"
    )

# Add isDark hook after component declaration
if 'const isDark' not in content:
    content = content.replace(
        'const [sessions, setSessions]',
        'const isDark = useWhiteboardStore((s) => s.isDark)\n  const [sessions, setSessions]'
    )

with open(f'{BASE}/ParentPortalWidget.tsx', 'w') as f:
    f.write(content)

patch_file(f'{BASE}/ParentPortalWidget.tsx', [
    'parent-portal-widget', 'parent-portal-info-label', 'parent-portal-info-value',
    'parent-portal-section-title', 'parent-portal-session-card',
    'parent-portal-session-date', 'parent-portal-session-subject',
    'parent-portal-session-meta', 'parent-portal-summary-label',
    'parent-portal-summary-value', 'parent-portal-billing-plan',
    'parent-portal-billing-btn', 'parent-portal-empty',
    'parent-portal-loading', 'parent-portal-error',
])

print('\n=== Verifying all widgets ===')
import subprocess
result = subprocess.run(['rg', '-l', 'isDark', BASE], capture_output=True, text=True)
done_files = set(result.stdout.strip().split('\n'))

# All tsx widget files that use widget-content or have component classes
import glob
all_tsx = glob.glob(f'{BASE}/*.tsx')
all_tsx = [f for f in all_tsx if f.endswith('Widget.tsx') or f in [
    f'{BASE}/GeoGebraPanel.tsx', f'{BASE}/MathToolkit.tsx', 
    f'{BASE}/ScienceToolkit.tsx', f'{BASE}/LanguageToolkit.tsx',
    f'{BASE}/BreakoutRoomsWidget.tsx', f'{BASE}/AgencyWidget.tsx',
]]

for f in sorted(all_tsx):
    fname = f.split('/')[-1]
    has_isdark = 'isDark' in open(f).read()
    status = '✅' if has_isdark else '❌'
    print(f'  {status} {fname}')

print('\nDone!')
