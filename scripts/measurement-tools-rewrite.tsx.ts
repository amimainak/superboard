// This file contains the new measurement tool implementations
// Will be integrated into CanvasMathWidgets.tsx

// ---- SVG coordinate conversion helper ----

function screenToSvg(svg: SVGSVGElement, clientX: number, clientY: number, svgW: number, svgH: number) {
  var rect = svg.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 }
  return {
    x: Math.max(0, Math.min(svgW, ((clientX - rect.left) / rect.width) * svgW)),
    y: Math.max(0, Math.min(svgH, ((clientY - rect.top) / rect.height) * svgH)),
  }
}

// Small button style helper
function msBtn(isDark: boolean, active?: boolean, color?: string) {
  var c = color || '#3b82f6'
  return {
    padding: '2px 7px', borderRadius: 3, fontSize: 10, fontWeight: 600 as const,
    cursor: 'pointer' as const, fontFamily: 'inherit',
    background: active ? (c + '20') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
    border: active ? ('1px solid ' + c + '60') : ('1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)')),
    color: active ? c : (isDark ? '#94a3b8' : '#64748b'),
  }
}
