import re
import os

TOOLKIT_DIR = '/home/z/my-project/src/components/room/widgets'

HOOK_FILE = os.path.join(TOOLKIT_DIR, 'useCollapsibleSections.ts')

HOOK_IMPORT = "import { useCollapsibleSections } from './useCollapsibleSections'"

# Read the hook file to confirm it exists
with open(HOOK_FILE, 'r') as f:
    print(f'Hook file exists: {f.read()[:100]}...')

def update_toolkit(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    
    # Check if already imports the hook (avoid duplicate imports)
    if HOOK_IMPORT not in content:
        # Add import after the last import statement
        last_import = content.rfind('}')
        if last_import == -1:
            last_import = content.rfind('\n')
        # Add after 'use client' line
        last_import = content.rfind('\n')
        if last_import == -1:
            print(f'  WARNING: no import statement found in {filepath}')
        else:
            insert_pos = last_import + 1
                content = content[:insert_pos] + '\n' + HOOK_IMPORT + '\n' + content[insert_pos:]
                print(f'  Added hook import to {filepath}')
    else:
        print(f'  Hook already imported in {filepath}')
    
    # Check if sectionTitle is defined
    title_match = re.search(r'(?:const|let|var)\s+sectionTitle\s*=\s*\(.*?\)\s*=>\s*\(', content)
    if not title_match:
        print(f'  No sectionTitle found in {filepath}')
        return
    
    start = title_match.end()
    func_line = content.rfind('\n', start)
    
    # Original pattern: sectionTitle = (text: string) => (
    old_pattern = r'(?:const|let|var)\s+sectionTitle\s*=\s*\(([^)]+)\)\s*=>\s*\(\n' + content[func_line:func_line]
    
    # New pattern with collapse support
    new_pattern = (
        old_pattern[:old_pattern.rfind('(')] +
        'const sectionTitle = (text: string, sectionId: string) => (\n' +
        '<div' +
          'className={"toolkit-section-title' + (isDark ? "" : "-light") + (isCollapsed(sectionId) ? " toolkit-section-collapsed" : "")}\n' +
          'onClick={() => toggle(sectionId)}\n' +
          'style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}\n' +
          '>{text}<span className="section-label">{text}</span>' +
          '<span className="section-chevron">{isCollapsed(sectionId) ? "+'\\u25BE' : "+'\\u25BC'}</span></div>\n' +
          '<div className="toolkit-section-body">' +
    old_pattern
    
    if not new_match:
        print(f'  Pattern match failed in {filepath}')
        return
    
    replacement = content[:title_match.start()] + new_pattern + content[title_match.end():]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(replacement)
        print(f'  Updated {filepath} ({len(replacement) - len(content)} bytes change)')

def main():
    toolkit_files = [
        os.path.join(TOOLKIT_DIR, f)
        for f in os.listdir(TOOLKIT_DIR)
        if f.endswith('Toolkit.tsx') and os.path.isfile(os.path.join(TOOLKIT_DIR, f))
    ]
    print(f'Found {len(toolkit_files)} toolkit files')
    for tf in toolkit_files:
        update_toolkit(tf)
    print('Done!')

main()
PYEOF