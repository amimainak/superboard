path = '/home/z/my-project/src/components/whiteboard/CanvasLanguageWidgets.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# Lines 378-389 (0-indexed) contain the SVG block
# Line 378: <svg ...>
# Line 379: <polyline
# Lines 380-383: polyline attrs
# Line 384: />
# Line 385: {/* Plot points */}
# Lines 386-388: circle elements
# Line 389: </svg>

new_lines = lines[:377]  # Keep up to and including the opening <div>
new_lines.append('      {/* Arc line using border trick */}\n')
new_lines.append("      <div style={{ position: 'absolute', bottom: 20, left: '8%', right: '8%', height: 40, borderTop: '2px solid ' + (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'), borderRadius: '50% 50% 0 0' }} />\n")
new_lines.append('      {/* Plot points */}\n')
new_lines.append("      {data.risingAction && <div style={{ position: 'absolute', left: '35%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />}\n")
new_lines.append("      {data.climax && <div style={{ position: 'absolute', left: '48%', top: 8, width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />}\n")
new_lines.append("      {data.fallingAction && <div style={{ position: 'absolute', left: '62%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#60a5fa' }} />}\n")
new_lines.extend(lines[389:])  # Keep from </svg> onwards but skip the </svg> line too
# Actually line 389 is </svg>, so skip it too
new_lines_final = lines[:377]
new_lines_final.append('      {/* Arc line using border trick */}\n')
new_lines_final.append("      <div style={{ position: 'absolute', bottom: 20, left: '8%', right: '8%', height: 40, borderTop: '2px solid ' + (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'), borderRadius: '50% 50% 0 0' }} />\n")
new_lines_final.append('      {/* Plot points */}\n')
new_lines_final.append("      {data.risingAction && <div style={{ position: 'absolute', left: '35%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />}\n")
new_lines_final.append("      {data.climax && <div style={{ position: 'absolute', left: '48%', top: 8, width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />}\n")
new_lines_final.append("      {data.fallingAction && <div style={{ position: 'absolute', left: '62%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#60a5fa' }} />}\n")
new_lines_final.extend(lines[390:])  # Skip lines 378-389 (SVG block), keep from line 391 onwards

with open(path, 'w') as f:
    f.writelines(new_lines_final)
print(f'Replaced SVG block (lines 378-389) with CSS dots. Old: {len(lines)} lines, New: {len(new_lines_final)} lines')
