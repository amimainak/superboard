import sys

path = '/home/z/my-project/src/components/whiteboard/CanvasLanguageWidgets.tsx'
with open(path, 'r') as f:
    content = f.read()

# Replace the entire arcViz SVG section with CSS-based version
old_block = '''  // Compact story arc visualization
  const arcViz = () => (
    <div style={{ position: 'relative', height: 100, marginTop: 4, borderRadius: 6, background: s.surface, overflow: 'hidden' }}>'''

new_block = '''  // Compact story arc visualization (CSS-based, no SVG elements)
  const arcViz = () => (
    <div style={{ position: 'relative', height: 90, marginTop: 4, borderRadius: 6, background: s.surface, overflow: 'hidden' }}>'''

if old_block in content:
    content = content.replace(old_block, new_block)
    print('Replaced header')
else:
    print('Header not found')

# Replace SVG block with CSS arc
old_svg = '''      {/* Arc line */}
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        <polyline
          points="10,80 60,65 120,40 180,15 240,40 300,65 340,80"
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}
          strokeWidth="2"
        />
        {/* Plot points */}
        {data.risingAction && <circle cx={120} cy={40} r={4} fill="#34d399" />}
        {data.climax && <circle cx={180} cy={15} r={5} fill="#f87171" />}
        {data.fallingAction && <circle cx={240} cy={40} r={4} fill="#60a5fa" />}
      </svg>'''

new_css = '''      {/* Arc line using border trick */}
      <div style={{ position: 'absolute', bottom: 20, left: '8%', right: '8%', height: 40, borderTop: '2px solid ' + (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'), borderRadius: '50% 50% 0 0' }} />
      {/* Plot points */}
      {data.risingAction && <div style={{ position: 'absolute', left: '35%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />}
      {data.climax && <div style={{ position: 'absolute', left: '48%', top: 8, width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />}
      {data.fallingAction && <div style={{ position: 'absolute', left: '62%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#60a5fa' }} />}'''

if old_svg in content:
    content = content.replace(old_svg, new_css)
    print('Replaced SVG block')
else:
    print('SVG block not found')
    # Find any remaining circle references
    for i, line in enumerate(content.split('\n')):
        if '<circle' in line or '<svg' in line or '<polyline' in line:
            print(f'  Line {i+1}: {line.strip()[:80]}')

with open(path, 'w') as f:
    f.write(content)
print('Done')
