import re, glob

# The mangled pattern in files looks like:
# className={恠sched-day-off ${isDark ?  : '{cls}-light'}}恠}
# Need to fix to:
# className={恠sched-day-off ${isDark ? '' : 'sched-day-off-light'}恠}

pattern = r"className=\{`([a-z][-a-z0-9]*) \$\{isDark \?  : '\{cls\}-light'}}\}`\}"

def fix(m):
    cls = m.group(1)
    # Use raw string to avoid escape issues
    replacement = "className={\u0060" + cls + " ${isDark ? '' : '" + cls + "-light'}\u0060}"
    return replacement

for filepath in glob.glob('/home/z/my-project/src/components/room/widgets/*.tsx'):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = re.sub(pattern, fix, content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        count = len(re.findall(pattern, content))
        print(f'Fixed {count} occurrences in {filepath.split("/")[-1]}')

print('Done')
