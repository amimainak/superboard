#!/usr/bin/env python3
"""Fix canvas-widget-registry.ts to match actual kind strings used in code."""
import re

# Read the registry
with open('/home/z/my-project/src/lib/room/canvas-widget-registry.ts') as f:
    content = f.read()

# These are the mismatches — registry kind -> actual code kind
# Found by comparing registry entries vs CanvasWidgets.tsx case entries vs toolkit addToBoard calls
REMAP = {
    # Biology
    'bio-classification': 'bio-taxonomy',
    'bio-dna-transcription': 'bio-dna-structure',
    'bio-ecosystem': 'bio-food-web',
    'bio-evolution-tree': 'bio-natural-selection',
    'bio-photosynthesis': 'bio-photosynthesis-resp',
    'bio-respiration': 'bio-photosynthesis-resp',  # merged into same widget
    # Earth Science
    'earth-layers': 'earth-plate-tectonics',  # closest match
    'earth-water-cycle': 'earth-water-carbon-cycle',
    # Language — old names vs actual component names
    'lang-active-passive': 'lang-sentence-structure',
    'lang-analogy-solver': 'lang-sentence-expansion',
    'lang-conjunctions': 'lang-paragraph-organizer',
    'lang-context-clues': 'lang-context-clues-exp',
    'lang-figurative-lang': 'lang-figurative-language',
    'lang-grammar-diagnostic': 'lang-sentence-structure',
    'lang-persuasive-writing': 'lang-argument-organizer',
    'lang-prefix-suffix': 'lang-context-clues-exp',
    'lang-reading-strategies': 'lang-text-evidence',
    'lang-rhyme-finder': 'lang-cvc-sort',
    'lang-root-morphology': 'lang-context-clues-exp',
    'lang-sentence-builder': 'lang-sentence-expansion',
    'lang-spelling-patterns': 'lang-sentence-structure',
    'lang-syllable-counter': 'lang-fluency-timer',
    'lang-text-structure': 'lang-paragraph-organizer',
    'lang-vocabulary-builder': 'lang-figurative-language',
    'lang-word-family': 'lang-cvc-sort',
    'lang-writing-checklist': 'lang-text-evidence',
}

# For duplicates (bio-respiration -> same as bio-photosynthesis), just remove them
REMOVE_KINDS = ['bio-respiration']

# Apply renames
for old, new in REMAP.items():
    if old in REMOVE_KINDS:
        continue
    content = content.replace(f"kind: '{old}'", f"kind: '{new}'")

# Remove entries with kinds that are duplicates
for remove_kind in REMOVE_KINDS:
    # Find and remove the full entry (from { kind: ... } to the closing },)
    pattern = rf"\{{\s*kind: '{remove_kind}'.*?\}},?\s*\n"
    content = re.sub(pattern, '', content, flags=re.DOTALL)

with open('/home/z/my-project/src/lib/room/canvas-widget-registry.ts', 'w') as f:
    f.write(content)

print('Registry fixed. Verifying...')

# Verify
with open('/home/z/my-project/src/lib/room/canvas-widget-registry.ts') as f:
    reg = f.read()

with open('/home/z/my-project/src/components/whiteboard/CanvasWidgets.tsx') as f:
    main = f.read()

reg_kinds = set(re.findall(r"kind: '([^']+)'", reg))
case_kinds = set(re.findall(r"case '([^']+)'", main))

missing = reg_kinds - case_kinds
print(f'Still missing: {len(missing)}')
for k in sorted(missing): print(f'  {k}')
