#!/usr/bin/env python3
"""
Bulk fix Tldraw shape ID type errors across all tool component files.
Adds 'as any' cast to shape id properties that use template literals with Date.now()
"""
import re
import os

# Find all tsx files in src/components/tools that have createShapes calls
base_dir = '/home/z/my-project/src/components'
fixed_files = []

for root, dirs, files in os.walk(base_dir):
    for fname in files:
        if not fname.endswith('.tsx'):
            continue
        filepath = os.path.join(root, fname)
        with open(filepath, 'r') as f:
            content = f.read()
        
        original = content
        
        # Pattern 1: Fix id: `shape:...${Date.now()}...` (without 'as any')
        # Add 'as any' to id properties inside createShapes calls
        # Match: id: `some-template-${Date.now()}-...`
        content = re.sub(
            r"id:\s*`([^`]*\$\{Date\.now\(\)\}[^`]*)`(?!\s*as\s)",
            r"id: `\1` as any",
            content
        )
        
        # Also fix id: `arrow:...${Date.now()}...` pattern
        content = re.sub(
            r"id:\s*`([^`]*\$\{Date\.now\(\)\}[^`]*)`\s*,\s*\n\s*(type:)",
            r"id: `\1` as any,\n      \2",
            content
        )
        
        if content != original:
            with open(filepath, 'w') as f:
                f.write(content)
            fixed_files.append(filepath)

# Also check src/components/toolkits
toolkit_dir = '/home/z/my-project/src/components/toolkits'
if os.path.exists(toolkit_dir):
    for root, dirs, files in os.walk(toolkit_dir):
        for fname in files:
            if not fname.endswith('.tsx'):
                continue
            filepath = os.path.join(root, fname)
            with open(filepath, 'r') as f:
                content = f.read()
            
            original = content
            content = re.sub(
                r"id:\s*`([^`]*\$\{Date\.now\(\)\}[^`]*)`(?!\s*as\s)",
                r"id: `\1` as any",
                content
            )
            
            if content != original:
                with open(filepath, 'w') as f:
                    f.write(content)
                fixed_files.append(filepath)

print(f"Fixed {len(fixed_files)} files:")
for f in fixed_files:
    print(f"  {f}")
