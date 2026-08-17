# Fix extra } in SchedulingWidget.tsx template literal class names
path = '/home/z/my-project/src/components/room/widgets/SchedulingWidget.tsx'
with open(path, 'r') as f:
    content = f.read()

# The bug: lines have pattern like className={`...-light'`}}> which has
# an extra } before > or space. The correct pattern is className={`...-light'}`}>
# 
# In the file, the broken pattern is: 'LIGHT_CLASS'`}} (two braces after backtick)
# Should be: 'LIGHT_CLASS'`}  (one brace after backtick)

# Strategy: find all occurrences of ')}  followed by } and replace
# where the context is a className template literal

bt = chr(96)  # backtick

# Pattern: -light'} + bt + }} (extra brace)
broken = "'" + bt + "}}"
fixed_pat = "'" + bt + "}}"

# Actually let me just do string replacement on known broken patterns
replacements = [
    (bt + "}} style=", bt + "} style="),
    (bt + "}}>No upcoming", bt + "}>No upcoming"),
    (bt + "}}>", bt + "}>"),  # catches most cases
    (bt + "}}> (", bt + "}> ("),
]

original = content
for old, new in replacements:
    content = content.replace(old, new)

if content != original:
    with open(path, 'w') as f:
        f.write(content)
    print("File fixed successfully")
else:
    print("No changes - dumping suspicious lines:")
    lines = content.split(chr(10))
    for i, line in enumerate(lines):
        if bt + "}}" in line:
            print(f"  L{i+1}: {repr(line.rstrip()[-60:])}")
