# The exact mangled pattern in bytes:
#   ${isDark ?  : '{cls}-light'}}
# Needs to become per-class: ${isDark ? '' : 'classname-light'}

import re

MANGLED = "${isDark ?  : '{cls}-light'}}"

for filepath in [
    '/home/z/my-project/src/components/room/widgets/SchedulingWidget.tsx',
    '/home/z/my-project/src/components/room/widgets/ParentPortalWidget.tsx',
]:
    with open(filepath, 'r') as f:
        content = f.read()
    
    if MANGLED not in content:
        print(f'No mangled patterns in {filepath.split("/")[-1]}')
        continue
    
    lines = content.split('\n')
    fixed = 0
    new_lines = []
    for line in lines:
        if MANGLED in line:
            m = re.search(r'className=`([a-z][-a-z0-9]*) ' + re.escape(MANGLED).replace('\$', '\$'), line)
            if not m:
                # Try without className prefix  
                m = re.search(r'`([a-z][-a-z0-9]*) ' + re.escape(MANGLED).replace('\$', '\$'), line)
            if m:
                cls = m.group(1)
                correct = '${isDark ? \'\' : \'%s-light\'}' % cls
                line = line.replace(MANGLED, correct)
                fixed += 1
        new_lines.append(line)
    
    with open(filepath, 'w') as f:
        f.write('\n'.join(new_lines))
    print(f'Fixed {fixed} lines in {filepath.split("/")[-1]}')

print('Done')
