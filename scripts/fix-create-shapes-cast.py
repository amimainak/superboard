#!/usr/bin/env python3
"""
Bulk fix: Add 'as any' to ALL editor.createShapes() calls in tool components.
Finds matching brackets and inserts the cast.
"""
import re
import os

base_dir = '/home/z/my-project/src/components'
fixed_files = []

for root, dirs, files in os.walk(base_dir):
    for fname in files:
        if not fname.endswith('.tsx'):
            continue
        filepath = os.path.join(root, fname)
        with open(filepath, 'r') as f:
            content = f.read()
        
        if 'editor.createShapes' not in content:
            continue
        
        original = content
        result = []
        i = 0
        changed = False
        
        while i < len(content):
            # Look for editor.createShapes(
            match = content.find('editor.createShapes(', i)
            if match == -1:
                result.append(content[i:])
                break
            
            result.append(content[i:match])
            
            # Find the opening bracket
            bracket_start = content.index('[', match)
            result.append(content[match:bracket_start + 1])
            
            # Find matching closing bracket + closing paren
            depth = 1
            j = bracket_start + 1
            while j < len(content) and depth > 0:
                if content[j] == '[':
                    depth += 1
                elif content[j] == ']':
                    depth -= 1
                j += 1
            
            # j now points right after the closing ]
            # Check if already has 'as any'
            before_close = content[bracket_start + 1:j - 1].rstrip()
            closing_part = content[j - 1:j]
            
            # Check what comes after the ]
            after_bracket = content[j:j + 10].lstrip()
            
            # Check if already cast
            if '] as any)' in content[bracket_start:j + 20] or '] as any)' in content[j - 1:j + 10]:
                result.append(content[bracket_start + 1:j])
                i = j
                continue
            
            # Check if it's just an empty array or variable reference
            inner = content[bracket_start + 1:j - 1].strip()
            if not inner.startswith('{') and not inner.startswith('['):
                # It's a variable reference like shapes or shapesArray
                result.append(content[bracket_start + 1:j - 1])
                result.append(' as any')
                result.append(']')
                i = j
                changed = True
                continue
            
            # Insert 'as any' before the closing ]
            result.append(content[bracket_start + 1:j - 1])
            result.append('] as any')
            i = j
            changed = True
        
        if changed:
            content = ''.join(result)
            with open(filepath, 'w') as f:
                f.write(content)
            fixed_files.append(filepath)

print(f"Fixed {len(fixed_files)} files:")
for f in fixed_files:
    print(f"  {f}")
