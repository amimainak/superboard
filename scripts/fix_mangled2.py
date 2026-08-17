# Simple string replacement - no regex needed
# The mangled token is: ${isDark ?  : '{cls}-light'}}}
# We need to replace it per-class

for filepath in [
    '/home/z/my-project/src/components/room/widgets/SchedulingWidget.tsx',
    '/home/z/my-project/src/components/room/widgets/ParentPortalWidget.tsx',
]:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find all lines with the mangled pattern
    lines = content.split('\n')
    fixed_lines = []
    for line in lines:
        if "{cls}" in line and "isDark ?" in line:
            # Extract class name from: className={恠CLASSNAME ${isDark ?
            import re
            m = re.search(r'className=\{`([a-z][-a-z0-9]*) \$\{isDark', line)
            if m:
                cls = m.group(1)
                # Replace the mangled part with correct version
                old = "${isDark ?  : '{cls}-light'}}}"
                new = "${isDark ? '' : '" + cls + "-light'}"
                line = line.replace(old, new)
        fixed_lines.append(line)
    
    new_content = '\n'.join(fixed_lines)
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f'Fixed {filepath.split("/")[-1]}')
    else:
        print(f'No changes in {filepath.split("/")[-1]}')

print('Done')
