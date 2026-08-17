# Fix lines where the byte-replace removed needed closing brace
# Pattern: -light'`}> should be -light'}`}>
import re

fp = '/home/z/my-project/src/components/room/widgets/SchedulingWidget.tsx'
with open(fp, 'r') as f:
    content = f.read()

# Fix lines that have className={\`...light'`}>  (missing })
# But NOT lines that are correct (they end with '}\`}>)
old = content
content = content.replace("'\`}">  ", "'`}>  ")  # This is wrong direction

# Actually let me just fix the known broken pattern
# Replace -light'`}>  with -light'}`}>
content = content.replace("-light'\`}">  ", "-light'}\`}>")

# Check: lines ending with `}>  should be `}>
if content != old:
    with open(fp, 'w') as f:
        f.write(content)
    print('Fixed')
else:
    print('No change')