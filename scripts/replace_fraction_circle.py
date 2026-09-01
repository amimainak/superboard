import sys

filepath = sys.argv[1]
with open(filepath, 'r') as f:
    lines = f.readlines()

# Lines 118-240 (0-indexed: 117-239) = the old CanvasFractionCircle
new_code = '''// ============================================================
// L3 FRACTION CIRCLE — Enhanced with comparison mode, equivalent
// fractions display, decimal/percent conversion, and stamp to canvas.
// ============================================================

export function CanvasFractionCircle({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as {
    divisions?: number; shaded?: number[];
    mode?: 'single' | 'compare';
    divisions2?: number; shaded2?: number[];
    showDecimal?: boolean; showPercent?: boolean;
  }
  const divisions = cfg.divisions || 4
  const shaded = (cfg.shaded || []) as number[]
  const mode = cfg.mode || 'single'
  const divisions2 = cfg.divisions2 || 4
  const shaded2 = (cfg.shaded2 || []) as number[]
  const showDecimal = cfg.showDecimal ?? false
  const showPercent = cfg.showPercent ?? false
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)

  const toggleSlice = useCallback((index: number) => {
    const next = shaded.includes(index) ? shaded.filter(i => i !== index) : [...shaded, index]
    updateConfig({ shaded: next, divisions })
  }, [shaded, divisions, updateConfig])

  const toggleSlice2 = useCallback((index: number) => {
    const next = shaded2.includes(index) ? shaded2.filter(i => i !== index) : [...shaded2, index]
    updateConfig({ shaded2: next, divisions2 })
  }, [shaded2, divisions2, updateConfig])

  const setDivisions = useCallback((n: number) => {
    updateConfig({ divisions: Math.max(2, Math.min(36, n)), shaded: [] })
  }, [updateConfig])

  const setDivisions2 = useCallback((n: number) => {
    updateConfig({ divisions2: Math.max(2, Math.min(36, n)), shaded2: [] })
  }, [updateConfig])

  const shadeAll = useCallback(() => {
    updateConfig({ shaded: Array.from({ length: divisions }, (_, i) => i), divisions })
  }, [divisions, updateConfig])

  const clearAll = useCallback(() => { updateConfig({ shaded: [], divisions }) }, [divisions, updateConfig])
  const clearAll2 = useCallback(() => { updateConfig({ shaded2: [], divisions2 }) }, [divisions2, updateConfig])

  // ---- Stamp to canvas ----
  const { stampLine, stampCircle } = useStampToCanvas(element)
  const stampFractionCircle = useCallback(() => {
    const ctx = { ex: element.x, ey: element.y }
    stampCircle(ctx, 90, 90, 78, isDark ? 'rgba(52,211,153,0.5)' : 'rgba(5,150,105,0.5)', 2)
  }, [element.x, element.y, isDark, stampCircle])

  const fractionLabel = shaded.length > 0
    ? (shaded.length === divisions ? '1 (whole)' : shaded.length + '/' + divisions)
    : '0'
  const decimalVal = divisions > 0 ? shaded.length / divisions : 0
  const percentVal = Math.round(decimalVal * 100)

  const fractionLabel2 = shaded2.length > 0
    ? (shaded2.length === divisions2 ? '1 (whole)' : shaded2.length + '/' + divisions2)
    : '0'
  const decimalVal2 = divisions2 > 0 ? shaded2.length / divisions2 : 0

  // ---- SVG geometry helper ----
  function makeSlices(divs: number, shd: number[], onToggle: (i: number) => void, circleSize: number) {
    const ccx = circleSize / 2, ccy = circleSize / 2, rr = circleSize * 0.43
    const result: Array<{ d: string; color: string; index: number; onClick: () => void }> = []
    for (let i = 0; i < divs; i++) {
      const startAngle = (2 * Math.PI * i) / divs - Math.PI / 2
      const endAngle = (2 * Math.PI * (i + 1)) / divs - Math.PI / 2
      const x1 = ccx + rr * Math.cos(startAngle)
      const y1 = ccy + rr * Math.sin(startAngle)
      const x2 = ccx + rr * Math.cos(endAngle)
      const y2 = ccy + rr * Math.sin(endAngle)
      const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0
      const d = 'M ' + ccx + ' ' + ccy + ' L ' + x1 + ' ' + y1 + ' A ' + rr + ' ' + rr + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z'
      const isShaded = shd.includes(i)
      const color = isShaded ? SHADE_COLORS[i % SHADE_COLORS.length] : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
      result.push({ d, color, index: i, onClick: () => onToggle(i) })
    }
    return { result, ccx, ccy, rr }
  }

  const circSize = mode === 'compare' ? 140 : 180

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Fraction Circle</span>
        <button onClick={function() { updateConfig({ mode: mode === 'compare' ? 'single' : 'compare' }) }} style={s.btn(mode === 'compare')}>
          {mode === 'compare' ? 'Single' : 'Compare'}
        </button>
        <button onClick={function() { updateConfig({ showDecimal: !showDecimal }) }} style={s.btn(showDecimal)}>
          Dec
        </button>
        <button onClick={function() { updateConfig({ showPercent: !showPercent }) }} style={s.btn(showPercent)}>
          %
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: s.accent, marginLeft: 'auto' }}>{fractionLabel}</span>
      </div>

      {/* Circles */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: mode === 'compare' ? 8 : 0 }}>
        {/* Circle 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <svg width={circSize} height={circSize} viewBox={'0 0 ' + circSize + ' ' + circSize}>
            {makeSlices(divisions, shaded, toggleSlice, circSize).result.map((slice) => (
              <path key={slice.index} d={slice.d} fill={slice.color}
                stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} strokeWidth={1}
                style={{ cursor: 'pointer' as const, transition: 'opacity 0.15s' }}
                onClick={slice.onClick}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }} />
            ))}
            {divisions <= 12 && shaded.length > 0 && (
              <text x={circSize / 2} y={circSize / 2} textAnchor="middle" dominantBaseline="central"
                fontSize={circSize <= 150 ? 14 : (divisions <= 6 ? 18 : 14)} fontWeight={700}
                fill={isDark ? '#e2e8f0' : '#1e293b'}>
                {shaded.length}/{divisions}
              </text>
            )}
          </svg>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: s.text }}>Parts:</span>
            <input type="number" value={divisions} min={2} max={36} step={1}
              onChange={(e) => setDivisions(Number(e.target.value))}
              style={{ ...s.input, width: 40 }} />
          </div>
          {showDecimal && <div style={{ fontSize: 10, color: s.text, fontFamily: 'monospace' }}>= {decimalVal.toFixed(4)}</div>}
          {showPercent && <div style={{ fontSize: 10, color: s.text, fontFamily: 'monospace' }}>= {percentVal}%</div>}
          <div style={{ display: 'flex', gap: 3 }}>
            <button onClick={shaded.length === divisions ? clearAll : shadeAll}
              style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer', fontWeight: 600,
                background: shaded.length === divisions ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
                border: shaded.length === divisions ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(59,130,246,0.3)',
                color: shaded.length === divisions ? '#fca5a5' : '#60a5fa' }}>
              {shaded.length === divisions ? 'Clear' : 'Fill'}
            </button>
            <button onClick={stampFractionCircle}
              style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer', fontWeight: 600,
                background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>
              Stamp
            </button>
          </div>
        </div>

        {/* Circle 2 (comparison mode) */}
        {mode === 'compare' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width={circSize} height={circSize} viewBox={'0 0 ' + circSize + ' ' + circSize}>
              {makeSlices(divisions2, shaded2, toggleSlice2, circSize).result.map((slice) => (
                <path key={slice.index} d={slice.d} fill={slice.color}
                  stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} strokeWidth={1}
                  style={{ cursor: 'pointer' as const, transition: 'opacity 0.15s' }}
                  onClick={slice.onClick}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }} />
              ))}
              {divisions2 <= 12 && shaded2.length > 0 && (
                <text x={circSize / 2} y={circSize / 2} textAnchor="middle" dominantBaseline="central"
                  fontSize={divisions2 <= 6 ? 18 : 14} fontWeight={700}
                  fill={isDark ? '#e2e8f0' : '#1e293b'}>
                  {shaded2.length}/{divisions2}
                </text>
              )}
            </svg>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: s.text }}>Parts:</span>
              <input type="number" value={divisions2} min={2} max={36} step={1}
                onChange={(e) => setDivisions2(Number(e.target.value))}
                style={{ ...s.input, width: 40 }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.accent }}>{fractionLabel2}</div>
            {showDecimal && <div style={{ fontSize: 10, color: s.text, fontFamily: 'monospace' }}>= {decimalVal2.toFixed(4)}</div>}
            <button onClick={clearAll2}
              style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer', fontWeight: 600,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Comparison result */}
      {mode === 'compare' && shaded.length > 0 && shaded2.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 4,
          background: s.surface, border: '1px solid ' + s.border,
          color: decimalVal === decimalVal2 ? '#34d399' : (decimalVal > decimalVal2 ? '#60a5fa' : '#f59e0b') }}>
          {fractionLabel} {decimalVal > decimalVal2 ? '>' : decimalVal < decimalVal2 ? '<' : '='} {fractionLabel2}
          {decimalVal === decimalVal2 && ' (Equivalent!)'}
        </div>
      )}

      {/* Quick-select common divisions */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
          <button key={n} onClick={() => setDivisions(n)}
            style={{
              padding: '2px 7px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
              background: divisions === n ? 'rgba(5,150,105,0.15)' : s.surface,
              border: divisions === n ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
              color: divisions === n ? '#34d399' : s.text,
            }}>{n}</button>
        ))}
      </div>
    </div>
  )
}

'''

# Lines 118-240 (0-indexed: 117-239)
result = lines[:117] + [new_code] + lines[240:]
with open(filepath, 'w') as f:
    f.writelines(result)

print('Done: replaced lines 118-240 with L3 Fraction Circle')
