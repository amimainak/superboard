import os, re, sys

sys.path.insert(0, '/home/z/my-project/src/components/room/widgets')

# List all toolkit files that use sectionTitle
files = sorted([f for f in os.listdir('/home/z/my-project/src/components/room/widgets/') if f.endswith('Toolkit.tsx')])
print(f'Found {len(files)} toolkit files to update')

for f in files:
    update_toolkit_wrapper(f)
    print(f'  Updated {f}')
    print('Done')

def update_toolkit_wrapper(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add import if not present
    import_line = -1
    for i, line in enumerate(content.split('\n')):
        if line.startswith('import '):
            import_line = i
            break
    if import_line == -1:
        print(f'  No import found in {filepath}, adding after line {import_line}')
        content = content[:import_line] + '\nimport SectionWrapper from "./SectionWrapper"'\n' + content[import_line:] + '\n'
    else:
        print(f'  Hook already imported in {filepath}')
    
    # 2. Wrap sectionTitle with SectionWrapper
    old_title_start = -1
    for i in range(len(content)):
        if 'sectionTitle' in content[i] and '(' in content[i]:
            # Find the opening tag
            tag_start = content.index('<div', content.index('className', i))
            # Find the closing
            close_pos = content.index('</div>', tag_start)
            if close_pos == -1:
                print(f'  WARNING: no closing div for sectionTitle in {filepath} at line {i+1}')
                continue
            tag_inner = content[tag_start+1:close_pos]
            # Replace the opening tag
            old_tag = content[tag_start:close_pos+1]
            new_tag = '<div className={"toolkit-section' + (isDark ? "" : "-light") + (isCollapsed("
              id="' + id + '"'\n              onClick={() => toggle(\"' + id + '\"}\n              style={{ cursor: \"pointer\", display: \"flex\", justifyContent: \"space-between\", alignItems: \"center\" }}\n              >\n                <span style={{ flex: 1, overflow: \"hidden\", textOverflow: \"ellipsis\", whiteSpace: \"nowrap\" }}>{children}</span>\n                <span className=\"section-chevron\">{isCollapsed("' + id + '\"') ? \"+\" : \"-\"}</span>\n            </div>\n            <div className="toolkit-section-body">\n              {children}\n            </div>\n          </div>' +
            # Remove the old closing tag
            content = content[:tag_start] + content[tag_start+1:close_pos+1:] + '
' + content[close_pos+1:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f'  Updated {f}')


def main():
    files = sorted([f for f in os.listdir('/home/z/my-project/src/components/room/widgets/') if f.endswith('Toolkit.tsx')])
    for f in files:
        update_toolkit_wrapper(f)
        print(f'  Updated {f}')
    print('Done')