#!/usr/bin/env python3
"""Fix canvas-widget-registry.ts — align kind strings with actual code.
Strategy: Read actual kinds from CanvasWidgets.tsx case statements,
read existing registry for metadata (toolkit, gradeBands, label, isDefault),
then output a corrected registry file.
"""
import re

# Read actual kinds from CanvasWidgets.tsx
with open('/home/z/my-project/src/components/whiteboard/CanvasWidgets.tsx') as f:
    main = f.read()
case_kinds = set(re.findall(r"case '([^']+)'", main))

# Read existing registry
with open('/home/z/my-project/src/lib/room/canvas-widget-registry.ts') as f:
    reg_content = f.read()

# Parse existing entries: extract each { kind: '...', label: ..., toolkit: ..., gradeBands: [...], isDefault: ... }
entries = []
for m in re.finditer(r'\{([^}]+)\}', reg_content):
    block = m.group(1)
    kind_m = re.search(r"kind: '([^']+)'", block)
    label_m = re.search(r"label: '([^']+)'", block)
    toolkit_m = re.search(r'toolkit: (\w+)', block)
    if not kind_m or not label_m or not toolkit_m:
        continue
    kind = kind_m.group(1)
    label = label_m.group(1)
    toolkit = toolkit_m.group(1)
    gradeBands = re.findall(r"'(K-2|3-5|6-8|9-12)'", block)
    isDefault = 'isDefault: true' in block
    entries.append({'kind': kind, 'label': label, 'toolkit': toolkit, 'gradeBands': gradeBands, 'isDefault': isDefault})

# Map from registry kind to actual kind (for entries whose kind isn't in case_kinds)
# Build a label-to-kind mapping from the actual case kinds for fuzzy matching
# Also read actual kind-to-label from CanvasWidgets.tsx WIDGET_KIND_LABELS
label_to_actual = {}
for m in re.finditer(r"'([^']+)':\s*'([^']+)'", main):
    # These are in WIDGET_KIND_LABELS
    pass

# Read WIDGET_KIND_LABELS from CanvasWidgets.tsx
wkl_section = main[main.find('WIDGET_KIND_LABELS'):main.find('WIDGET_KIND_LABELS') + 5000] if 'WIDGET_KIND_LABELS' in main else ''
actual_kinds_labels = {}
for m in re.finditer(r"'([^']+)':\s*'([^']+)'", wkl_section):
    actual_kinds_labels[m.group(1)] = m.group(2)

# Now check which registry entries have kinds NOT in case_kinds
# and try to find a matching actual kind
fixed_entries = []
for entry in entries:
    if entry['kind'] in case_kinds:
        fixed_entries.append(entry)
        continue
    
    # Try to find the actual kind by looking for similar labels
    best_match = None
    best_score = 0
    for ak, al in actual_kinds_labels.items():
        if ak not in case_kinds:
            continue
        # Score by common words
        entry_words = set(entry['label'].lower().split())
        actual_words = set(al.lower().split())
        score = len(entry_words & actual_words)
        if score > best_score:
            best_score = score
            best_match = ak
    
    if best_match and best_score >= 1:
        print(f"  FIX: {entry['kind']} -> {best_match} (label match: {entry['label']} ~ {actual_kinds_labels[best_match]})")
        entry['kind'] = best_match
    else:
        print(f"  SKIP: {entry['kind']} ({entry['label']}) - no match found in code")
        continue
    
    fixed_entries.append(entry)

# Check for actual kinds that are missing from registry and need to be added
reg_kinds_set = {e['kind'] for e in fixed_entries}
for ak in sorted(case_kinds):
    if ak not in reg_kinds_set:
        label = actual_kinds_labels.get(ak, ak)
        print(f"  ADD: {ak} ({label}) - in code but not registry")
        # Determine toolkit from kind prefix
        prefix_map = {
            'math': 'math', 'phys': 'physics', 'chem': 'chemistry', 'bio': 'biology',
            'stat': 'statistics', 'earth': 'earthscience', 'sci': 'earthscience',
            'lang': 'language', 'arts': 'arts', 'classroom': 'classroom', 'ai': 'ai'
        }
        toolkit = 'math'  # default
        for prefix, tk in prefix_map.items():
            if ak.startswith(prefix):
                toolkit = tk
                break
        fixed_entries.append({'kind': ak, 'label': label, 'toolkit': toolkit, 'gradeBands': ['K-2', '3-5', '6-8', '9-12'], 'isDefault': True})

# Deduplicate by kind
seen = set()
deduped = []
for e in fixed_entries:
    if e['kind'] not in seen:
        seen.add(e['kind'])
        deduped.append(e)

print(f"\nTotal entries: {len(deduped)}")

# Group by toolkit
toolkit_order = ['math', 'physics', 'chemistry', 'biology', 'language', 'statistics', 'earthscience', 'arts', 'classroom', 'ai']
groups = {}
for e in deduped:
    tk = e['toolkit']
    if tk not in groups:
        groups[tk] = []
    groups[tk].append(e)

# Generate the output file
lines = []
lines.append('// ============================================================')
lines.append('// Superboard — Canvas Widget Registry')
lines.append('// Centralized catalog of ALL canvas widget kinds')
lines.append('// ============================================================')
lines.append('')
lines.append('export type ToolkitId = ' + ' | '.join(f"'{t}'" for t in toolkit_order))
lines.append('')
lines.append('export type CanvasWidgetEntry = {')
lines.append('  kind: string')
lines.append('  label: string')
lines.append('  toolkit: ToolkitId')
lines.append('  gradeBands: Array<\'K-2\' | \'3-5\' | \'6-8\' | \'9-12\'>')
lines.append('  isDefault: boolean')
lines.append('}')
lines.append('')

toolkit_labels = {
    'math': 'Math Tools', 'physics': 'Physics', 'chemistry': 'Chemistry',
    'biology': 'Biology', 'language': 'Language', 'statistics': 'Statistics',
    'earthscience': 'Earth Science', 'arts': 'Arts & Music', 'classroom': 'Classroom', 'ai': 'AI Tools'
}

toolkit_icons = {
    'math': 'Calculator', 'physics': 'Zap', 'chemistry': 'Atom',
    'biology': 'Leaf', 'language': 'Languages', 'statistics': 'BarChart3',
    'earthscience': 'Globe', 'arts': 'Palette', 'classroom': 'Timer', 'ai': 'Sparkles'
}

for tk in toolkit_order:
    if tk not in groups:
        continue
    label = toolkit_labels.get(tk, tk)
    lines.append(f'// ============================================================')
    lines.append(f'// {label} Widgets ({len(groups[tk])} kinds)')
    lines.append(f'// ============================================================')
    var_name = tk.upper() + '_WIDGETS'
    lines.append(f'const {var_name}: CanvasWidgetEntry[] = [')
    for e in groups[tk]:
        bands = ', '.join(f"'{b}'" for b in e['gradeBands'])
        default_str = 'true' if e['isDefault'] else 'false'
        lines.append(f"  {{ kind: '{e['kind']}', label: '{e['label']}', toolkit: '{e['toolkit']}', gradeBands: [{bands}], isDefault: {default_str} }},")
    lines.append(']')
    lines.append('')

lines.append('export const ALL_CANVAS_WIDGETS: CanvasWidgetEntry[] = [')
for tk in toolkit_order:
    var_name = tk.upper() + '_WIDGETS'
    if tk in groups:
        lines.append(f'  ...{var_name},')
lines.append(']')
lines.append('')
lines.append('export const CANVAS_WIDGET_MAP: Record<string, CanvasWidgetEntry> = {}')
lines.append('for (const w of ALL_CANVAS_WIDGETS) {')
lines.append('  CANVAS_WIDGET_MAP[w.kind] = w')
lines.append('}')
lines.append('')
lines.append('export function getWidgetsForToolkit(toolkit: ToolkitId): CanvasWidgetEntry[] {')
lines.append('  return ALL_CANVAS_WIDGETS.filter(w => w.toolkit === toolkit)')
lines.append('}')
lines.append('')
lines.append('export function getDefaultWidgetKinds(): Set<string> {')
lines.append('  return new Set(ALL_CANVAS_WIDGETS.filter(w => w.isDefault).map(w => w.kind))')
lines.append('}')
lines.append('')
lines.append(f'export const TOOLKIT_LABELS: Record<ToolkitId, string> = {{')
for tk in toolkit_order:
    lines.append(f"  {tk}: '{toolkit_labels.get(tk, tk)}',")
lines.append('}')
lines.append('')
lines.append(f'export const TOOLKIT_ICONS: Record<ToolkitId, string> = {{')
for tk in toolkit_order:
    lines.append(f"  {tk}: '{toolkit_icons.get(tk, tk)}',")
lines.append('}')

with open('/home/z/my-project/src/lib/room/canvas-widget-registry.ts', 'w') as f:
    f.write('\n'.join(lines) + '\n')

print(f'\nRegistry written with {len(deduped)} unique entries')

# Verify
with open('/home/z/my-project/src/lib/room/canvas-widget-registry.ts') as f:
    new_reg = f.read()
new_reg_kinds = set(re.findall(r"kind: '([^']+)'", new_reg))
still_missing = new_reg_kinds - case_kinds
print(f'Still missing from CanvasWidgets.tsx: {len(still_missing)}')
for k in sorted(still_missing): print(f'  {k}')
new_extra = case_kinds - new_reg_kinds
print(f'Extra in CanvasWidgets.tsx: {len(new_extra)}')
for k in sorted(new_extra): print(f'  {k}')
