import re

with open('/home/z/my-project/src/components/room/widgets/SchedulingWidget.tsx', 'r') as f:
    lines = f.readlines()

fixed = 0
for i, line in enumerate(lines):
    # Find pattern: closing backtick of template literal followed by }} (extra brace)
    # We look for the specific pattern where `}} appears before space or >
    # The correct pattern is `} before " or > or space
    # Broken: className={`something-light'}`}}  or className={`something-light'}`}}>
    # The backtick char in Python: chr(96)
    bt = chr(96)
    # Pattern: bt + '}}' followed by space or '>'
    pattern = bt + '}}'
    replacement = bt + '}'
    
    # Only replace if followed by space or > (not by " which would be correct end of attribute)
    idx = line.find(pattern)
    while idx != -1:
        next_char_pos = idx + len(pattern)
        if next_char_pos < len(line):
            next_char = line[next_char_pos]
            if next_char in (' ', '>'):
                line = line[:idx] + replacement + line[idx + len(replacement):]
                fixed += 1
                print(f'Fixed line {i+1}')
        idx = line.find(pattern, idx + 1)
    
    lines[i] = line

if fixed > 0:
    with open('/home/z/my-project/src/components/room/widgets/SchedulingWidget.tsx', 'w') as f:
        f.writelines(lines)
    print(f'Total fixes: {fixed}')
else:
    print('No fixes needed - checking file...')
    # Let's check what patterns exist
    for i, line in enumerate(lines):
        bt = chr(96)
        if bt + '}}' in line:
            print(f'Line {i+1}: {line.rstrip()[:100]}')
        if bt + '}' in line:
            # Check what follows
            idx = line.find(bt + '}')
            after = line[idx+2:idx+3] if idx+2 < len(line) else 'EOF'
            if after in (' ', '>') and bt + '}}' not in line:
                print(f'  OK line {i+1}: after brace is "{after}"')
