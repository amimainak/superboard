# Replace template literal borders with string concatenation in AgencyWidget
path = '/home/z/my-project/src/components/room/widgets/AgencyWidget.tsx'
with open(path, 'r') as f:
    content = f.read()

# Replace all template literal border patterns with string concatenation
# Pattern: border: `1px solid ${...}` → border: '1px solid ' + (...)

# There are 4 occurrences with slightly different rgba values
content = content.replace(
    "border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`",
    "border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)')"
)

content = content.replace(
    "border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`",
    "border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)')"
)

with open(path, 'w') as f:
    f.write(content)
print('Fixed template literal borders')
