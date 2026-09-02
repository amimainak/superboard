import re, sys

reg = open('/home/z/my-project/src/lib/room/canvas-widget-registry.ts').read()
reg_kinds = set(re.findall(r"kind: '([^']+)'", reg))

main = open('/home/z/my-project/src/components/whiteboard/CanvasWidgets.tsx').read()
case_kinds = set(re.findall(r"case '([^']+)'", main))

missing = reg_kinds - case_kinds
extra = case_kinds - reg_kinds

print(f'Registry: {len(reg_kinds)} | CanvasWidgets.tsx cases: {len(case_kinds)}')
print(f'\nMISSING from CanvasWidgets.tsx ({len(missing)}):')
for k in sorted(missing): print(f'  {k}')
print(f'\nEXTRA in CanvasWidgets.tsx ({len(extra)}):')
for k in sorted(extra): print(f'  {k}')

# Also check the biology mismatches
bio = open('/home/z/my-project/src/components/whiteboard/CanvasScienceWidgets.tsx').read()
bio_exports = re.findall(r'export (?:function|const) (Canvas\w+)', bio)
print(f'\nBiology/Science exports ({len(bio_exports)}):')
for e in bio_exports: print(f'  {e}')

lang = open('/home/z/my-project/src/components/whiteboard/CanvasLanguageWidgets.tsx').read()
lang_exports = re.findall(r'export (?:function|const) (Canvas\w+)', lang)
print(f'\nLanguage exports ({len(lang_exports)}):')
for e in lang_exports: print(f'  {e}')
