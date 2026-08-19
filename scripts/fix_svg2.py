path = '/home/z/my-project/src/components/whiteboard/CanvasLanguageWidgets.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# Find and replace lines 378-389 (0-indexed: 377-388)
# Replace the SVG section with CSS-based arc
new_lines = lines[:377]  # Keep up to the <div> opening
new_lines.append('      {/* Arc line using border trick */}\n')
new_lines.append("      <div style={{ position: 'absolute', bottom: 20, left: '8%', right: '8%', height: 40, borderTop: '2px solid ' + (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'), borderRadius: '50% 50% 0 0' }} />\n")
new_lines.append('      {/* Plot points */}\n')
new_lines.append("      {data.risingAction && <div style={{ position: 'absolute', left: '35%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />}\n")
new_lines.append("      {data.climax && <div style={{ position: 'absolute', left: '48%', top: 8, width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />}\n")
new_lines.append("      {data.fallingAction && <div style={{ position: 'absolute', left: '62%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#60a5fa' }} />}\n")
# Skip old lines 378-389 (the SVG block + closing </svg>)
# Find the </svg> line
skip_until = -1
for i in range(389, min(395, len(lines))):
    if '</svg>' in lines[i]:
        skip_until = i + 1
        break

if skip_until > 0:
    new_lines.extend(lines[skip_until:])
    with open(path, 'w') as f:
        f.writelines(new_lines)
    print(f'Replaced lines 378-{skip_until-1} ({skip_until - 377} lines removed, 6 added)')
else:
    print('Could not find </svg>')
    for i in range(389, 395):
        if i < len(lines):
            print(f'  Line {i+1}: {lines[i].rstrip()[:80]}')
