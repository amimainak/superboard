'use client'

import React, { useState } from 'react'

// ============================================================
// Math Toolkit — Utility Sub-Components
// Pure panel utilities (no canvas interaction)
// ============================================================

// ---- Scientific Calculator ----

export function Calculator({ isDark }: { isDark: boolean }) {
  const [display, setDisplay] = useState('0')
  const [expr, setExpr] = useState('')
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const subText = isDark ? '#94a3b8' : '#64748b'
  const accentBg = 'rgba(5,150,105,0.15)'
  const accentBorder = 'rgba(5,150,105,0.3)'
  const accentText = '#34d399'

  const handleBtn = (val: string) => {
    if (val === 'C') { setDisplay('0'); setExpr(''); return }
    if (val === 'DEL') { setDisplay(d => d.length <= 1 ? '0' : d.slice(0, -1)); return }
    if (val === '=') {
      try {
        const safe = display.replace(/[^0-9+\-*/.() ]/g, '')
        const result = Function('"use strict"; return (' + safe + ')')()
        setExpr(display + ' =')
        setDisplay(String(result))
      } catch {
        setExpr('Error')
        setDisplay('0')
      }
      return
    }
    if (val === 'sin' || val === 'cos' || val === 'tan' || val === 'sqrt' || val === 'log') {
      try {
        const n = parseFloat(display)
        const result = val === 'sin' ? Math.sin(n * Math.PI / 180)
          : val === 'cos' ? Math.cos(n * Math.PI / 180)
          : val === 'tan' ? Math.tan(n * Math.PI / 180)
          : val === 'sqrt' ? Math.sqrt(n)
          : Math.log10(n)
        setExpr(val + '(' + display + ') =')
        setDisplay(String(Math.round(result * 1000000) / 1000000))
      } catch { setDisplay('Error') }
      return
    }
    if (val === 'pi') { setDisplay(d => d === '0' ? String(Math.PI) : d + String(Math.PI)); return }
    if (display === '0' && !['+', '-', '*', '/', '.'].includes(val)) {
      setDisplay(val)
    } else {
      setDisplay(d => d + val)
    }
  }

  const btn = (label: string, val: string, span?: number, accent?: boolean) => (
    <button key={val} onClick={() => handleBtn(val)}
      style={{
        padding: '8px 4px', borderRadius: 4, fontSize: 12, fontWeight: 500,
        background: accent ? accentBg : bg,
        border: accent ? '1px solid ' + accentBorder : '1px solid ' + border,
        color: accent ? accentText : text,
        cursor: 'pointer', flex: span ? '0 0 ' + (span * 25 + '%') : '1 1 0',
        textAlign: 'center',
      }}
    >{label}</button>
  )

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ background: bg, border: '1px solid ' + border, borderRadius: 6, padding: '8px 10px', marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: subText, minHeight: 14, textAlign: 'right' }}>{expr || '\u00A0'}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: text, textAlign: 'right', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{display}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {btn('sin', 'sin')}{btn('cos', 'cos')}{btn('tan', 'tan')}{btn('sqrt', 'sqrt')}
        {btn('log', 'log')}{btn('pi', 'pi')}{btn('(', '(')}{btn(')', ')')}
        {btn('7', '7')}{btn('8', '8')}{btn('9', '9')}{btn('/', '/')}
        {btn('4', '4')}{btn('5', '5')}{btn('6', '6')}{btn('*', '*')}
        {btn('1', '1')}{btn('2', '2')}{btn('3', '3')}{btn('-', '-')}
        {btn('0', '0')}{btn('.', '.')}{btn('DEL', 'DEL')}{btn('+', '+')}
        {btn('C', 'C', 2)}{btn('=', '=', 2, true)}
      </div>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Current entry: <code style={{ fontFamily: 'monospace' }}>{display}</code></div>
          <div>Step 2: {expr ? <span>Last evaluated: <code style={{ fontFamily: 'monospace' }}>{expr} {display}</code></span> : 'Press = to evaluate the entry'}</div>
          <div>Step 3: Apply PEMDAS to: <code style={{ fontFamily: 'monospace' }}>{display.replace(/[^0-9+\-*/.() ]/g, '') || '?'}</code> (Parentheses → Exponents → ×÷ → +−)</div>
          <div>Step 4: Work left-to-right for same precedence (e.g., × and ÷)</div>
          {expr && !expr.includes('Error')
            ? <div>Step 5: Result: <b style={{ color: accentText }}>{display}</b></div>
            : <div style={{ color: subText }}>Step 5: {expr && expr.includes('Error') ? 'Last evaluation errored — check syntax' : 'Press = to see the result'}</div>}
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> PEMDAS: Parentheses, Exponents, Multiply/Divide, Add/Subtract. Without rules, "2+3×4" could be 20 or 14 — we agreed it's 14.
      </div>
</div>
  )
}

// ---- Unit Converter ----

const UNITS: Record<string, Record<string, number>> = {
  Length: { mm: 1, cm: 10, m: 1000, km: 1000000, inch: 25.4, ft: 304.8, yd: 914.4, mi: 1609344 },
  Weight: { mg: 1, g: 1000, kg: 1000000, lb: 453592, oz: 28349.5, ton: 1000000000 },
  Volume: { mL: 1, L: 1000, gal: 3785.41, qt: 946.353, cup: 236.588, fl_oz: 29.5735 },
  Temperature: {},
  Time: { ms: 1, sec: 1000, min: 60000, hr: 3600000, day: 86400000, week: 604800000 },
  Area: { mm2: 1, cm2: 100, m2: 1000000, km2: 1000000000000, acre: 4046856422, ha: 10000000000 },
}

export function UnitConverter({ isDark }: { isDark: boolean }) {
  const [category, setCategory] = useState('Length')
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('cm')
  const [value, setValue] = useState('1')
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const subText = isDark ? '#94a3b8' : '#64748b'
  const activeBg = 'rgba(5,150,105,0.15)'
  const activeBorder = 'rgba(5,150,105,0.3)'
  const activeText = '#34d399'

  const unitList = category === 'Temperature'
    ? ['C', 'F', 'K']
    : Object.keys(UNITS[category] || {})

  const convert = (v: number, from: string, to: string): number => {
    if (category === 'Temperature') {
      if (from === 'C' && to === 'F') return v * 9 / 5 + 32
      if (from === 'F' && to === 'C') return (v - 32) * 5 / 9
      if (from === 'C' && to === 'K') return v + 273.15
      if (from === 'K' && to === 'C') return v - 273.15
      if (from === 'F' && to === 'K') return (v - 32) * 5 / 9 + 273.15
      if (from === 'K' && to === 'F') return (v - 273.15) * 9 / 5 + 32
      return v
    }
    const factors = UNITS[category]
    if (!factors || !factors[from] || !factors[to]) return 0
    return v * factors[from] / factors[to]
  }

  const numVal = parseFloat(value)
  const result = isNaN(numVal) ? '\u2014' : String(Math.round(convert(numVal, fromUnit, toUnit) * 1000000) / 1000000)

  // Dynamic step helpers
  const isTemp = category === 'Temperature'
  const factors = UNITS[category]
  const conversionFactor = !isTemp && factors?.[fromUnit] && factors?.[toUnit]
    ? factors[fromUnit] / factors[toUnit]
    : null
  const factorStr = conversionFactor !== null
    ? String(Math.round(conversionFactor * 1000000) / 1000000)
    : '?'
  const tempFormulaText = (from: string, to: string): string => {
    const v = value || '?'
    if (from === to) return `${from} = ${to} (no change needed)`
    if (from === 'C' && to === 'F') return `F = ${v} × 9/5 + 32`
    if (from === 'F' && to === 'C') return `C = (${v} − 32) × 5/9`
    if (from === 'C' && to === 'K') return `K = ${v} + 273.15`
    if (from === 'K' && to === 'C') return `C = ${v} − 273.15`
    if (from === 'F' && to === 'K') return `K = (${v} − 32) × 5/9 + 273.15`
    if (from === 'K' && to === 'F') return `F = (${v} − 273.15) × 9/5 + 32`
    return '?'
  }
  const computedValue = !isNaN(numVal) ? convert(numVal, fromUnit, toUnit) : null
  const computedStr = computedValue !== null
    ? String(Math.round(computedValue * 1000000) / 1000000)
    : '?'

  const select = (val: string, onChange: (v: string) => void, options: string[]) => (
    <select value={val} onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '4px 6px', borderRadius: 4, fontSize: 11, border: '1px solid ' + border,
        background: bg, color: text, outline: 'none', cursor: 'pointer',
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  return (
    <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {Object.keys(UNITS).map(cat => (
          <button key={cat} onClick={() => { setCategory(cat); const opts = cat === 'Temperature' ? ['C', 'F', 'K'] : Object.keys(UNITS[cat]); setFromUnit(opts[0]); setToUnit(opts[1]) }}
            style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 10,
              background: category === cat ? activeBg : bg,
              border: category === cat ? '1px solid ' + activeBorder : '1px solid ' + border,
              color: category === cat ? activeText : subText, cursor: 'pointer',
            }}
          >{cat}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)}
          style={{
            width: 64, padding: '4px 6px', borderRadius: 4, fontSize: 11, textAlign: 'center',
            border: '1px solid ' + border, background: bg, color: text, outline: 'none',
          }}
        />
        {select(fromUnit, setFromUnit, unitList)}
        <span style={{ color: subText, fontSize: 12 }}>=</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: activeText, minWidth: 60, textAlign: 'center' }}>{result}</span>
        {select(toUnit, setToUnit, unitList)}
      </div>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Input: <b>{value || '?'}</b> {fromUnit} (category: {category})</div>
          <div>Step 2: {isTemp
            ? <span>Temperature formula ({fromUnit} → {toUnit}): <code style={{ fontFamily: 'monospace' }}>{tempFormulaText(fromUnit, toUnit)}</code></span>
            : <span>Conversion factor: 1 {fromUnit} = <b>{factorStr}</b> {toUnit}</span>}</div>
          {isTemp ? (
            <>
              <div>Step 3: Substitute {value || '?'} {fromUnit} into the formula</div>
              <div>Step 4: Compute → <b>{computedStr}</b> {toUnit}</div>
              <div>Step 5: Verify sign and magnitude make sense for temperature</div>
            </>
          ) : (
            <>
              <div>Step 3: Write as fraction: (<b>{factorStr}</b> {toUnit} / 1 {fromUnit})</div>
              <div>Step 4: Multiply: {value || '?'} {fromUnit} × (<b>{factorStr}</b> {toUnit} / 1 {fromUnit})</div>
              <div>Step 5: {fromUnit} cancels → <b>{computedStr}</b> {toUnit}</div>
            </>
          )}
          <div>Step 6: Answer: <b style={{ color: activeText }}>{result}</b> {toUnit}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Multiply by fractions equal to 1 (e.g., 1km/1000m). Units cancel, leaving desired unit. Track units to catch errors.
      </div>
</div>
  )
}

// ---- Formula Reference ----

const FORMULAS: Record<string, Record<string, { name: string; formula: string }[]>> = {
  elementary: {
    'Perimeter': [
      { name: 'Rectangle', formula: 'P = 2(l + w)' },
      { name: 'Square', formula: 'P = 4s' },
      { name: 'Triangle', formula: 'P = a + b + c' },
    ],
    'Area': [
      { name: 'Rectangle', formula: 'A = l x w' },
      { name: 'Square', formula: 'A = s\u00B2' },
      { name: 'Triangle', formula: 'A = 1/2 x b x h' },
      { name: 'Circle', formula: 'A = pi*r\u00B2' },
    ],
    'Volume': [
      { name: 'Cube', formula: 'V = s\u00B3' },
      { name: 'Rect. Prism', formula: 'V = l x w x h' },
    ],
  },
  middle: {
    'Circles': [
      { name: 'Circumference', formula: 'C = 2pi*r' },
      { name: 'Area', formula: 'A = pi*r\u00B2' },
      { name: 'Arc Length', formula: 'L = (theta/360) x 2pi*r' },
    ],
    'Pythagorean': [
      { name: 'Theorem', formula: 'a\u00B2 + b\u00B2 = c\u00B2' },
      { name: 'Distance', formula: 'd = sqrt((x2-x1)\u00B2 + (y2-y1)\u00B2)' },
    ],
    'Slope & Lines': [
      { name: 'Slope', formula: 'm = (y2 - y1)/(x2 - x1)' },
      { name: 'Point-Slope', formula: 'y - y1 = m(x - x1)' },
      { name: 'Slope-Intercept', formula: 'y = mx + b' },
    ],
    'Surface Area': [
      { name: 'Cylinder', formula: 'SA = 2pi*r\u00B2 + 2pi*rh' },
      { name: 'Sphere', formula: 'SA = 4pi*r\u00B2' },
      { name: 'Cone', formula: 'SA = pi*r\u00B2 + pi*rl' },
    ],
    'Volume': [
      { name: 'Cylinder', formula: 'V = pi*r\u00B2h' },
      { name: 'Sphere', formula: 'V = (4/3)pi*r\u00B3' },
      { name: 'Cone', formula: 'V = (1/3)pi*r\u00B2h' },
      { name: 'Pyramid', formula: 'V = (1/3)Bh' },
    ],
  },
  highschool: {
    'Trigonometry': [
      { name: 'sin(theta)', formula: 'opp / hyp' },
      { name: 'cos(theta)', formula: 'adj / hyp' },
      { name: 'tan(theta)', formula: 'opp / adj' },
      { name: 'sin\u00B2+cos\u00B2', formula: '= 1' },
      { name: 'Law of Sines', formula: 'a/sinA = b/sinB = c/sinC' },
      { name: 'Law of Cosines', formula: 'c\u00B2 = a\u00B2 + b\u00B2 - 2ab*cosC' },
      { name: 'Area (trig)', formula: 'A = 1/2 ab*sinC' },
    ],
    'Quadratics': [
      { name: 'Standard', formula: 'f(x) = ax\u00B2 + bx + c' },
      { name: 'Vertex', formula: 'f(x) = a(x-h)\u00B2 + k' },
      { name: 'Quad. Formula', formula: 'x = (-b +/- sqrt(b\u00B2-4ac)) / 2a' },
      { name: 'Discriminant', formula: 'Delta = b\u00B2 - 4ac' },
      { name: 'Vertex x', formula: 'x = -b/(2a)' },
    ],
    'Calculus': [
      { name: 'Power Rule', formula: 'd/dx[x^n] = nx^(n-1)' },
      { name: 'Product Rule', formula: '(fg)\u2019 = f\u2019g + fg\u2019' },
      { name: 'Chain Rule', formula: 'd/dx[f(g(x))] = f\u2019(g(x))*g\u2019(x)' },
      { name: 'Integration (power)', formula: 'integral x^n dx = x^(n+1)/(n+1) + C' },
    ],
    'Statistics': [
      { name: 'Mean', formula: 'x-bar = (sum x)/n' },
      { name: 'Std Dev', formula: 's = sqrt(sum(x-x-bar)\u00B2/(n-1))' },
      { name: 'Combination', formula: 'nCr = n! / (r!(n-r)!)' },
      { name: 'Permutation', formula: 'nPr = n! / (n-r)!' },
    ],
    'Sequences': [
      { name: 'Arithmetic Sum', formula: 'S = n/2 x (2a + (n-1)d)' },
      { name: 'Geometric Sum', formula: 'S = a(1-r^n)/(1-r)' },
      { name: 'Infinite Geom.', formula: 'S = a/(1-r) for |r|<1' },
    ],
  },
}

export function FormulaReference({ band, isDark }: { band: string; isDark: boolean }) {
  const [search, setSearch] = useState('')
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const subText = isDark ? '#94a3b8' : '#64748b'

  const sections = FORMULAS[band] || {}
  const lower = search.toLowerCase()
  const totalFormulas = Object.values(sections).reduce((sum, arr) => sum + arr.length, 0)
  const totalSections = Object.keys(sections).length
  const filteredCount = Object.entries(sections).reduce((sum, [section, formulas]) =>
    sum + formulas.filter(f =>
      !lower || f.name.toLowerCase().includes(lower) || f.formula.toLowerCase().includes(lower) || section.toLowerCase().includes(lower)
    ).length, 0)
  const bandLabel = band === 'elementary' ? 'Elementary' : band === 'middle' ? 'Middle School' : band === 'highschool' ? 'High School' : band

  return (
    <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        type="text"
        placeholder="Search formulas..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: '5px 8px', borderRadius: 4, fontSize: 11, border: '1px solid ' + border,
          background: bg, color: text, outline: 'none', width: '100%',
        }}
      />
      {Object.entries(sections).map(([section, formulas]) => {
        const filtered = formulas.filter(f =>
          !lower || f.name.toLowerCase().includes(lower) || f.formula.toLowerCase().includes(lower) || section.toLowerCase().includes(lower)
        )
        if (filtered.length === 0) return null
        return (
          <div key={section}>
            <div style={{ fontSize: 10, fontWeight: 700, color: subText, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{section}</div>
            {filtered.map(f => (
              <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid ' + border }}>
                <span style={{ fontSize: 11, color: subText }}>{f.name}</span>
                <code style={{ fontSize: 11, color: text, fontFamily: 'monospace', background: bg, padding: '1px 6px', borderRadius: 3 }}>{f.formula}</code>
              </div>
            ))}
          </div>
        )
      })}
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Selected band: <b>{bandLabel}</b> ({totalFormulas} formulas across {totalSections} sections)</div>
          <div>Step 2: {search
            ? <span>Searching for "<b>{search}</b>" — found <b style={{ color: '#34d399' }}>{filteredCount}</b> match{filteredCount !== 1 ? 's' : ''}</span>
            : <span>No search filter — showing all <b>{totalFormulas}</b> formulas</span>}</div>
          <div>Step 3: Identify the variable you're solving for (the unknown)</div>
          <div>Step 4: Find the formula above that relates the known and unknown variables</div>
          <div>Step 5: Rearrange to isolate the unknown, then substitute known values</div>
          <div>Step 6: Calculate and verify — do the units and magnitude make sense?</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Formulas are shortcuts encoding patterns. The quadratic formula looks complex but it's just completing the square generalized.
      </div>
</div>
  )
}

// ---- Multiplication Grid ----

export function MultiplicationGrid({ isDark }: { isDark: boolean }) {
  const [highlight, setHighlight] = useState<{ r: number; c: number } | null>(null)
  const text = isDark ? '#94a3b8' : '#475569'

  return (
    <div style={{ padding: '4px 16px 12px', overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 1, fontSize: 9, minWidth: 280 }}>
        <div style={{ padding: 2 }} />
        {Array.from({ length: 12 }, (_, i) => (
          <div key={'h-' + i} style={{ padding: 2, textAlign: 'center', fontWeight: 700, color: text, fontSize: 9 }}>{i + 1}</div>
        ))}
        {Array.from({ length: 12 }, (_, r) => (
          <React.Fragment key={'row-' + r}>
            <div style={{ padding: 2, textAlign: 'center', fontWeight: 700, color: text, fontSize: 9 }}>{r + 1}</div>
            {Array.from({ length: 12 }, (_, c) => {
              const isHL = highlight && (highlight.r === r || highlight.c === c)
              const isExact = highlight && highlight.r === r && highlight.c === c
              return (
                <div key={r + '-' + c}
                  onMouseEnter={() => setHighlight({ r, c })}
                  onMouseLeave={() => setHighlight(null)}
                  style={{
                    padding: 2, textAlign: 'center', cursor: 'default',
                    background: isExact ? 'rgba(5,150,105,0.25)' : isHL ? 'rgba(5,150,105,0.08)' : 'transparent',
                    color: isExact ? '#34d399' : text,
                    fontWeight: isExact ? 700 : 400,
                    borderRadius: 2, fontSize: 9,
                  }}
                >{(r + 1) * (c + 1)}</div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: {highlight
            ? <span>First number (left column): <b>{highlight.r + 1}</b></span>
            : 'Hover any cell to highlight a row × column pair'}</div>
          <div>Step 2: {highlight
            ? <span>Second number (top row): <b>{highlight.c + 1}</b></span>
            : 'Move your cursor over the grid to begin'}</div>
          <div>Step 3: {highlight
            ? <span>Follow row {highlight.r + 1} and column {highlight.c + 1} to their intersection</span>
            : 'The intersection of a row and column is the product'}</div>
          <div>Step 4: {highlight
            ? <span>Product: <b style={{ color: '#34d399' }}>{(highlight.r + 1) * (highlight.c + 1)}</b> (= {highlight.r + 1} × {highlight.c + 1})</span>
            : 'Hover to see the product for any pair'}</div>
          <div>Step 5: {highlight && highlight.r === highlight.c
            ? <span>You're on the diagonal — <b style={{ color: '#34d399' }}>{highlight.r + 1}² = {(highlight.r + 1) * (highlight.c + 1)}</b> is a perfect square</span>
            : 'Diagonal cells (1,4,9,16...) = perfect squares (n × n)'}</div>
          <div>Step 6: Multiplication = repeated addition (3×4 = 4+4+4 = 12)</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Multiplication = repeated addition. 3×4 = 3 rows of 4 = 12. The diagonal shows perfect squares (n×n = n²).
      </div>
</div>
  )
}

// ---- Base-10 Blocks ----

export function Base10Blocks({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'

  // Dynamic step data — mirrors the block types shown above
  const blockTypes = [
    { name: 'Thousands', shape: '10×10×10', value: 1000 },
    { name: 'Hundreds', shape: '10×10', value: 100 },
    { name: 'Tens Rod', shape: '10×1', value: 10 },
    { name: 'Ones Unit', shape: '1×1', value: 1 },
  ]
  const totalValue = blockTypes.reduce((s, b) => s + b.value, 0)

  return (
    <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ fontSize: 10, color: text, lineHeight: 1.3, margin: 0 }}>
        Drag these onto the canvas from the &quot;All&quot; tab stamps section, or draw them freehand using the grid background.
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['Thousands (10x10x10)', 'Hundreds (10x10)', 'Tens Rod (10x1)', 'Ones Unit (1x1)'].map(name => (
          <div key={name} style={{
            padding: '6px 10px', borderRadius: 4, fontSize: 10, color: text,
            background: bg, border: '1px solid ' + border, textAlign: 'center',
          }}>
            {name}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: text, lineHeight: 1.3 }}>
        <strong>Tip:</strong> Use the grid background (set to line mode) as a base-10 grid. Each cell = 1 unit.
      </div>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Base-10 means each position is 10× the previous (one place value = 10 of the next-smaller)</div>
          {blockTypes.map((b, i) => (
            <div key={b.name}>Step {2 + i}: <b>{b.name}</b> ({b.shape}) = <b style={{ color: '#34d399' }}>{b.value.toLocaleString()}</b> unit{b.value !== 1 ? 's' : ''}</div>
          ))}
          <div>Step 6: One of each block = <b>{totalValue.toLocaleString()}</b> units. 10 of any block = 1 of the next larger — that's why we "carry" in addition</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Base-10: each position is 10× the previous. 10 ones = 1 ten. Regrouping = exchanging: 10 pennies = 1 dime.
      </div>
</div>
  )
}

// ---- Flashcards ----

const ELEMENTARY_FLASHCARDS = [
  { front: '2 x 7', back: '14' },
  { front: '8 x 6', back: '48' },
  { front: '9 x 7', back: '63' },
  { front: '12 / 4', back: '3' },
  { front: '1/2 + 1/4', back: '3/4' },
  { front: '3/5 of 20', back: '12' },
  { front: 'Perimeter: 5 x 3 rect', back: '16' },
  { front: 'Area: 5 x 3 rect', back: '15 sq units' },
]

export function Flashcards({ isDark }: { isDark: boolean }) {
  const [flipped, setFlipped] = useState(false)
  const [index, setIndex] = useState(0)
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const subText = isDark ? '#94a3b8' : '#64748b'

  const cards = ELEMENTARY_FLASHCARDS
  const card = cards[index % cards.length]

  return (
    <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          width: '100%', minHeight: 60, padding: '16px 12px', borderRadius: 8,
          background: flipped ? 'rgba(5,150,105,0.1)' : bg,
          border: '1px solid ' + (flipped ? 'rgba(5,150,105,0.3)' : border),
          cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease',
        }}
      >
        <div style={{ fontSize: 10, color: subText, marginBottom: 6 }}>{flipped ? 'Answer' : 'Question'}</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: flipped ? '#34d399' : text, fontFamily: flipped ? 'monospace' : 'inherit' }}>
          {flipped ? card.back : card.front}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => { setIndex(i => (i - 1 + cards.length) % cards.length); setFlipped(false) }}
          style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, background: bg, border: '1px solid ' + border, color: text, cursor: 'pointer' }}
        >Prev</button>
        <span style={{ fontSize: 10, color: subText }}>{(index % cards.length) + 1} / {cards.length}</span>
        <button onClick={() => { setIndex(i => (i + 1) % cards.length); setFlipped(false) }}
          style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, background: bg, border: '1px solid ' + border, color: text, cursor: 'pointer' }}
        >Next</button>
      </div>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Card <b>{(index % cards.length) + 1}</b> / {cards.length} — question: <code style={{ fontFamily: 'monospace' }}>{card.front}</code></div>
          <div>Step 2: {flipped
            ? 'Card is flipped — answer revealed below'
            : 'Try to recall the answer BEFORE flipping the card'}</div>
          <div>Step 3: {flipped
            ? <span>Answer: <b style={{ color: '#34d399' }}>{card.back}</b></span>
            : 'Click the card to flip and check your answer'}</div>
          <div>Step 4: {flipped
            ? 'Were you right? If wrong, study the answer before moving on'
            : 'Use Prev / Next to navigate the deck'}</div>
          <div>Step 5: Review wrong cards more frequently (spaced repetition flattens the forgetting curve)</div>
          <div>Step 6: Effortful recall — not re-reading — is what strengthens memory</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Spaced repetition: review at increasing intervals. The brain forgets exponentially, but each review flattens the curve.
      </div>
</div>
  )
}

// ---- Proof Builder ----

export function ProofBuilder({ isDark }: { isDark: boolean }) {
  const [steps, setSteps] = useState<Array<{ statement: string; reason: string }>>([
    { statement: '', reason: '' },
  ])
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const subText = isDark ? '#94a3b8' : '#64748b'

  const updateStep = (i: number, field: 'statement' | 'reason', value: string) => {
    setSteps(prev => prev.map((s, j) => j === i ? { ...s, [field]: value } : s))
  }

  const addStep = () => setSteps(prev => [...prev, { statement: '', reason: '' }])
  const removeStep = (i: number) => { if (steps.length > 1) setSteps(prev => prev.filter((_, j) => j !== i)) }

  const inputStyle: React.CSSProperties = {
    padding: '3px 6px', borderRadius: 3, fontSize: 10, width: '100%',
    border: '1px solid ' + border, background: bg, color: text, outline: 'none',
  }

  // Dynamic step stats derived from the user's proof
  const completeSteps = steps.filter(s => s.statement.trim() && s.reason.trim()).length
  const partialSteps = steps.filter(s => s.statement.trim() && !s.reason.trim()).length
  const emptySteps = steps.filter(s => !s.statement.trim()).length
  const isComplete = steps.length > 0 && completeSteps === steps.length && completeSteps > 0

  return (
    <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4, fontSize: 10, fontWeight: 700, color: subText, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        <span style={{ width: 24 }}>#</span>
        <span style={{ flex: 1 }}>Statement</span>
        <span style={{ flex: 1 }}>Reason</span>
        <span style={{ width: 20 }} />
      </div>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ width: 24, fontSize: 11, color: subText, textAlign: 'center' }}>{i + 1}</span>
          <input value={step.statement} onChange={(e) => updateStep(i, 'statement', e.target.value)}
            placeholder="Statement..." style={inputStyle} />
          <input value={step.reason} onChange={(e) => updateStep(i, 'reason', e.target.value)}
            placeholder="Given, SAS, ..." style={inputStyle} />
          <button onClick={() => removeStep(i)} style={{
            width: 20, height: 20, borderRadius: 3, fontSize: 12, border: 'none',
            background: 'transparent', color: '#ef4444', cursor: 'pointer', opacity: 0.6,
          }}>x</button>
        </div>
      ))}
      <button onClick={addStep} style={{
        padding: '4px 10px', borderRadius: 4, fontSize: 10, alignSelf: 'flex-start',
        background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)',
        color: '#34d399', cursor: 'pointer', fontWeight: 600,
      }}>+ Add Step</button>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: State what you need to prove (the conclusion)</div>
          <div>Step 2: List what you know (the given / assumptions)</div>
          <div>Step 3: Your proof has <b>{steps.length}</b> step{steps.length !== 1 ? 's' : ''} — <b style={{ color: '#34d399' }}>{completeSteps}</b> fully justified, <b>{partialSteps}</b> missing a reason, <b>{emptySteps}</b> empty</div>
          <div>Step 4: Each step must follow logically from the previous one (justified)</div>
          <div>Step 5: Use definitions, theorems, and axioms as justification (e.g., "Given", "SAS", "Substitution")</div>
          <div>Step 6: {isComplete
            ? <span><b style={{ color: '#34d399' }}>✓ Every step is justified — your proof is complete!</b></span>
            : <span>A proof is complete only when every step has both a statement and a reason — fill in the gaps above</span>}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A proof: each step follows from the previous. Like building with blocks — if any step is wrong, the whole proof collapses.
      </div>
</div>
  )
}

// ---- Hundreds Chart ----

function ordinalSuf(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

export function HundredsChart({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [skip, setSkip] = useState(4)
  const [hover, setHover] = useState<number | null>(12)

  const multiples: number[] = []
  for (let n = skip; n <= 100; n += skip) multiples.push(n)

  const isMultiple = (n: number) => n % skip === 0
  const multipleCount = multiples.length
  const multiplesStr = multipleCount > 6
    ? multiples.slice(0, 3).join(', ') + ' ... ' + multiples.slice(-2).join(', ')
    : multiples.join(', ')

  const hoverRow = hover !== null ? Math.floor((hover - 1) / 10) + 1 : null
  const hoverCol = hover !== null ? ((hover - 1) % 10) + 1 : null
  const hoverIsMult = hover !== null && isMultiple(hover)
  const hoverMultIdx: number | null = (hover !== null && hoverIsMult) ? hover / skip : null

  const nearestMults = (n: number, s: number): string => {
    const lo = Math.floor(n / s) * s
    const hi = lo + s
    return lo === 0 ? `${hi}` : `${lo} and ${hi}`
  }

  const patternShape = skip === 5 ? 'two vertical columns (5s end in 0 or 5)'
    : skip === 9 ? 'a diagonal staircase (ones digit drops by 1 each row)'
    : skip === 10 ? 'a single right column (all multiples of 10)'
    : skip === 2 ? 'two vertical columns (every even number)'
    : skip === 11 ? 'a wrapping diagonal (every 11th cell)'
    : 'vertical stripes shifting right each row'

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ fontSize: 10, color: subText, marginBottom: 6 }}>🔢 Hundreds Chart — skip count to see patterns</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <button key={n} onClick={() => setSkip(n)}
            style={{
              padding: '3px 7px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
              background: skip === n ? 'rgba(5,150,105,0.18)' : bg,
              border: '1px solid ' + (skip === n ? 'rgba(5,150,105,0.4)' : border),
              color: skip === n ? accentText : text, fontWeight: skip === n ? 700 : 400,
            }}>×{n}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 1, fontSize: 9 }}>
        {Array.from({ length: 100 }, (_, i) => {
          const n = i + 1
          const isMult = isMultiple(n)
          const isHover = hover === n
          const inRow = hover !== null && hoverRow === Math.floor((n - 1) / 10) + 1
          const inCol = hover !== null && hoverCol === ((n - 1) % 10) + 1
          return (
            <div key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              style={{
                padding: '4px 0', textAlign: 'center', cursor: 'default', borderRadius: 2,
                background: isHover ? 'rgba(5,150,105,0.45)'
                  : isMult && (inRow || inCol) ? 'rgba(5,150,105,0.32)'
                  : isMult ? 'rgba(5,150,105,0.2)'
                  : (inRow || inCol) ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
                  : 'transparent',
                color: isHover ? accentText : isMult ? accentText : (inRow || inCol) ? bright : text,
                fontWeight: isHover ? 700 : isMult ? 600 : 400,
              }}>{n}</div>
          )
        })}
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: bright }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Pattern: skip-count by <b>{skip}</b> (the {skip}-times table)</div>
        <div>Step 2: Multiples of {skip} between 1-100: <b>{multipleCount}</b> numbers ({multiplesStr})</div>
        <div>Step 3: {hover !== null
          ? <span>Hovering cell <b>{hover}</b> — in row <b>{hoverRow}</b>, column <b>{hoverCol}</b></span>
          : 'Hover any cell to highlight its row, column, and itself'}</div>
        <div>Step 4: {hoverMultIdx !== null
          ? <span>{hover} ÷ {skip} = <b>{hoverMultIdx}</b>, so {hover} is the <b>{hoverMultIdx}{ordinalSuf(hoverMultIdx)}</b> multiple of {skip}</span>
          : hover !== null
            ? <span>{hover} is NOT a multiple of {skip} (nearest multiples: {nearestMults(hover, skip)})</span>
            : 'Hover a multiple to see its index in the times table'}</div>
        <div>Step 5: {hoverMultIdx !== null
          ? <span><b style={{ color: accentText }}>{skip} × {hoverMultIdx} = {hover}</b> ✓ (verifies the pattern)</span>
          : 'Multiples form a regular pattern across the chart'}</div>
        <div>Step 6: Pattern shape: {patternShape}</div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Skip-counting is multiplication in disguise — every Nth number is a multiple of N. The 9s form a diagonal because each row adds 10 but the pattern only advances by 9, so the ones digit drops by 1 each row.
      </div>
    </div>
  )
}

// ---- Fact Family Triangle ----

export function FactFamilyTriangle({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [partA, setPartA] = useState(3)
  const [partB, setPartB] = useState(4)
  const whole = partA * partB

  const W = 240, H = 180
  const top = { x: W / 2, y: 26 }
  const bl = { x: 32, y: H - 28 }
  const br = { x: W - 32, y: H - 28 }

  const inputStyle: React.CSSProperties = {
    width: 42, padding: '2px 4px', fontSize: 11, textAlign: 'center',
    border: '1px solid ' + border, background: bg, color: bright, borderRadius: 3, outline: 'none',
  }

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ fontSize: 10, color: subText, marginBottom: 6 }}>🔺 Fact Family — multiplication & division are inverse</div>
      <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
        <polygon points={`${top.x},${top.y} ${bl.x},${bl.y} ${br.x},${br.y}`}
          fill={isDark ? 'rgba(5,150,105,0.06)' : 'rgba(5,150,105,0.04)'}
          stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} strokeWidth={1.5} />
        <line x1={top.x} y1={top.y} x2={(bl.x + br.x) / 2} y2={(bl.y + br.y) / 2}
          stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth={1} strokeDasharray="3 3" />
        <text x={top.x} y={top.y - 6} textAnchor="middle" fontSize={20} fontWeight={700} fill={accentText}>{whole}</text>
        <text x={top.x} y={top.y - 18} textAnchor="middle" fontSize={8} fill={subText} letterSpacing={0.5}>WHOLE (product)</text>
        <text x={bl.x - 6} y={bl.y + 2} textAnchor="end" fontSize={20} fontWeight={700} fill={bright}>{partA}</text>
        <text x={bl.x - 6} y={bl.y + 14} textAnchor="end" fontSize={8} fill={subText} letterSpacing={0.5}>PART A</text>
        <text x={br.x + 6} y={br.y + 2} textAnchor="start" fontSize={20} fontWeight={700} fill={bright}>{partB}</text>
        <text x={br.x + 6} y={br.y + 14} textAnchor="start" fontSize={8} fill={subText} letterSpacing={0.5}>PART B</text>
        <text x={(top.x + bl.x) / 2 - 4} y={(top.y + bl.y) / 2} textAnchor="end" fontSize={14} fill={subText}>×</text>
        <text x={(top.x + br.x) / 2 + 4} y={(top.y + br.y) / 2} textAnchor="start" fontSize={14} fill={subText}>÷</text>
        <text x={(bl.x + br.x) / 2} y={(bl.y + br.y) / 2 + 4} textAnchor="middle" fontSize={9} fill={subText}>part × part = whole</text>
      </svg>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6, fontSize: 10, color: subText }}>
        <label>Part A: <input type="number" min={1} max={20} value={partA}
          onChange={e => setPartA(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} style={inputStyle} /></label>
        <label>Part B: <input type="number" min={1} max={20} value={partB}
          onChange={e => setPartB(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} style={inputStyle} /></label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 6 }}>
        <div style={{ padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 4, fontSize: 11, color: bright, textAlign: 'center' }}>
          <span style={{ color: subText, fontSize: 9 }}>× </span>{partA} × {partB} = <b style={{ color: accentText }}>{whole}</b>
        </div>
        <div style={{ padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 4, fontSize: 11, color: bright, textAlign: 'center' }}>
          <span style={{ color: subText, fontSize: 9 }}>× </span>{partB} × {partA} = <b style={{ color: accentText }}>{whole}</b>
        </div>
        <div style={{ padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 4, fontSize: 11, color: bright, textAlign: 'center' }}>
          <span style={{ color: subText, fontSize: 9 }}>÷ </span>{whole} ÷ {partA} = <b style={{ color: accentText }}>{partB}</b>
        </div>
        <div style={{ padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 4, fontSize: 11, color: bright, textAlign: 'center' }}>
          <span style={{ color: subText, fontSize: 9 }}>÷ </span>{whole} ÷ {partB} = <b style={{ color: accentText }}>{partA}</b>
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: bright }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Whole (top) = <b>{whole}</b>, Part A (bottom-left) = <b>{partA}</b>, Part B (bottom-right) = <b>{partB}</b></div>
        <div>Step 2: Part × Part = Whole → <b>{partA} × {partB} = {whole}</b></div>
        <div>Step 3: Reverse: Whole ÷ Part A = Part B → <b>{whole} ÷ {partA} = {partB}</b></div>
        <div>Step 4: Reverse: Whole ÷ Part B = Part A → <b>{whole} ÷ {partB} = {partA}</b></div>
        <div>Step 5: Commutative: <b>{partB} × {partA} = {whole}</b> (same as Step 2, order swapped)</div>
        <div>Step 6: 4 equations, 1 fact family — they're all the same relationship</div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Multiplication and division are inverse operations — they undo each other. If 3 × 4 = 12, then 12 ÷ 4 brings you back to 3. The triangle makes this visible: the whole (top) splits into two parts (bottom).
      </div>
    </div>
  )
}

// ---- Bar Model Builder (Singapore Math) ----

type BarType = 'ppw' | 'compare' | 'groups' | 'compare-diff'

export function BarModelBuilder({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [type, setType] = useState<BarType>('compare')
  const [a, setA] = useState(3)
  const [b, setB] = useState(5)

  const inputStyle: React.CSSProperties = {
    width: 38, padding: '2px 4px', fontSize: 10, textAlign: 'center',
    border: '1px solid ' + border, background: bg, color: bright, borderRadius: 3, outline: 'none',
  }

  const total = type === 'groups' ? a * b : a + b
  const diff = Math.abs(b - a)
  const maxVal = type === 'groups' ? a * b : Math.max(a, b, 1)
  const totalWidth = 200
  const barHeight = 26
  const extra = type === 'compare-diff' ? Math.max(0, b - a) : 0

  const typeLabels: Record<BarType, string> = {
    'ppw': 'Part-Part-Whole',
    'compare': 'Comparison',
    'groups': 'Equal Groups',
    'compare-diff': 'Compare + Diff',
  }

  const aLabel = type === 'ppw' ? 'Part A'
    : type === 'groups' ? 'Group size'
    : 'Bar A'
  const bLabel = type === 'ppw' ? 'Part B'
    : type === 'groups' ? '# groups'
    : 'Bar B'

  const renderBar = (units: number, color: string, label: string, highlightExtra?: number) => {
    const w = (units / maxVal) * totalWidth
    const highlightW = highlightExtra ? (highlightExtra / maxVal) * totalWidth : 0
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{ width: 52, fontSize: 9, color: subText, textAlign: 'right' }}>{label}</div>
        <div style={{ position: 'relative', width: w, height: barHeight, background: color, borderRadius: 3, border: '1px solid ' + border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {highlightExtra && highlightExtra > 0 ? (
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: highlightW, background: 'rgba(167,139,250,0.4)', borderRadius: '0 3px 3px 0', borderLeft: '1px dashed rgba(167,139,250,0.7)' }} />
          ) : null}
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{units}</span>
        </div>
      </div>
    )
  }

  const wordProblem = type === 'ppw' ? `Part (${a}) + Part (${b}) = Whole (${total})`
    : type === 'compare' ? `Bar ${b > a ? 'B' : 'A'} is ${diff} ${diff === 1 ? 'unit' : 'units'} more; together they are ${total}`
    : type === 'groups' ? `${b} ${b === 1 ? 'group' : 'groups'} of ${a} = ${total}`
    : `Bar B has ${extra} extra ${extra === 1 ? 'unit' : 'units'} — the difference is ${extra}`

  const addendsStr = b <= 6
    ? Array.from({ length: b }, () => a).join(' + ')
    : Array.from({ length: 6 }, () => a).join(' + ') + ' ...'

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ fontSize: 10, color: subText, marginBottom: 6 }}>📊 Bar Model — visualize word problems</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: 8 }}>
        {(['ppw', 'compare', 'groups', 'compare-diff'] as BarType[]).map(t => (
          <button key={t} onClick={() => setType(t)}
            style={{
              padding: '4px 6px', borderRadius: 4, fontSize: 9, cursor: 'pointer',
              background: type === t ? 'rgba(5,150,105,0.18)' : bg,
              border: '1px solid ' + (type === t ? 'rgba(5,150,105,0.4)' : border),
              color: type === t ? accentText : text, fontWeight: type === t ? 700 : 400,
            }}>{typeLabels[t]}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, fontSize: 10, color: subText }}>
        <label>{aLabel}: <input type="number" min={1} max={12} value={a}
          onChange={e => setA(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))} style={inputStyle} /></label>
        <label>{bLabel}: <input type="number" min={1} max={12} value={b}
          onChange={e => setB(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))} style={inputStyle} /></label>
      </div>
      <div style={{ padding: '8px 6px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 6, marginBottom: 6, minHeight: 70 }}>
        {type === 'ppw' && (
          <>
            {renderBar(a, 'rgba(5,150,105,0.55)', 'Part A')}
            {renderBar(b, 'rgba(5,150,105,0.35)', 'Part B')}
            <div style={{ marginTop: 4, fontSize: 10, color: subText, textAlign: 'center' }}>Whole = {a} + {b} = <b style={{ color: accentText }}>{total}</b></div>
          </>
        )}
        {type === 'compare' && (
          <>
            {renderBar(a, 'rgba(59,130,246,0.55)', 'Bar A')}
            {renderBar(b, 'rgba(167,139,250,0.55)', 'Bar B')}
            <div style={{ marginTop: 4, fontSize: 10, color: subText, textAlign: 'center' }}>Difference = |{b} − {a}| = <b style={{ color: accentText }}>{diff}</b>; Total = <b style={{ color: accentText }}>{total}</b></div>
          </>
        )}
        {type === 'groups' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 52, fontSize: 9, color: subText, textAlign: 'right' }}>Total</div>
              <div style={{ display: 'flex', width: totalWidth, height: barHeight, borderRadius: 3, border: '1px solid ' + border, overflow: 'hidden' }}>
                {Array.from({ length: b }, (_, i) => (
                  <div key={i} style={{ flex: 1, background: i % 2 === 0 ? 'rgba(5,150,105,0.55)' : 'rgba(5,150,105,0.35)', borderRight: i < b - 1 ? '1px solid ' + (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)') : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 4, fontSize: 10, color: subText, textAlign: 'center' }}>{b} {b === 1 ? 'group' : 'groups'} of {a} = <b style={{ color: accentText }}>{total}</b></div>
          </>
        )}
        {type === 'compare-diff' && (
          <>
            {renderBar(a, 'rgba(59,130,246,0.55)', 'Bar A')}
            {renderBar(b, 'rgba(167,139,250,0.55)', 'Bar B', extra)}
            <div style={{ marginTop: 4, fontSize: 10, color: subText, textAlign: 'center' }}>Extra (purple) = {b} − {a} = <b style={{ color: '#a78bfa' }}>{extra}</b></div>
          </>
        )}
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: bright }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Model type: <b>{typeLabels[type]}</b></div>
        {type === 'ppw' && (
          <>
            <div>Step 2: Part A = <b>{a}</b> units</div>
            <div>Step 3: Part B = <b>{b}</b> units</div>
            <div>Step 4: Whole = Part A + Part B = <b style={{ color: accentText }}>{a} + {b} = {total}</b></div>
            <div>Step 5: Use when the problem says "altogether", "in all", or "total"</div>
            <div>Step 6: Word problem: {wordProblem}</div>
          </>
        )}
        {type === 'compare' && (
          <>
            <div>Step 2: Bar A = <b>{a}</b> units ({a > b ? 'larger' : a < b ? 'smaller' : 'equal'})</div>
            <div>Step 3: Bar B = <b>{b}</b> units ({b > a ? 'larger' : b < a ? 'smaller' : 'equal'})</div>
            <div>Step 4: Difference = |{b} − {a}| = <b style={{ color: accentText }}>{diff}</b></div>
            <div>Step 5: Total = {a} + {b} = <b>{total}</b></div>
            <div>Step 6: Word problem: {wordProblem}</div>
          </>
        )}
        {type === 'groups' && (
          <>
            <div>Step 2: Group size = <b>{a}</b> units, Number of groups = <b>{b}</b></div>
            <div>Step 3: Total = group size × number of groups = <b style={{ color: accentText }}>{a} × {b} = {total}</b></div>
            <div>Step 4: Repeated addition: {addendsStr} = {total}</div>
            <div>Step 5: Multiplication: {b} × {a} = <b>{total}</b> (same as Step 3)</div>
            <div>Step 6: Word problem: {wordProblem}</div>
          </>
        )}
        {type === 'compare-diff' && (
          <>
            <div>Step 2: Bar A = <b>{a}</b> units (the smaller)</div>
            <div>Step 3: Bar B = <b>{b}</b> units (larger; extra shown in purple)</div>
            <div>Step 4: Extra (purple) = {b} − {a} = <b style={{ color: '#a78bfa' }}>{extra}</b></div>
            <div>Step 5: Use when the problem says "how many more" or "how many fewer"</div>
            <div>Step 6: Word problem: {wordProblem}</div>
          </>
        )}
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Bar models turn words into pictures. Instead of guessing the operation, students see the relationship: parts combine into a whole (addition), or one bar's extra is the difference (subtraction). The model decides the operation — not the keyword.
      </div>
    </div>
  )
}

// ---- Elapsed Time Explorer ----

export function ElapsedTimeExplorer({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [startH, setStartH] = useState(1)
  const [startM, setStartM] = useState(45)
  const [endH, setEndH] = useState(3)
  const [endM, setEndM] = useState(15)
  const [drag, setDrag] = useState<null | { which: 'start' | 'end'; hand: 'hour' | 'minute' }>(null)

  const fmt = (h: number, m: number) => `${h}:${m.toString().padStart(2, '0')}`

  // Normalize 12 -> 0 for arithmetic
  const startHNorm = startH % 12
  const endHNorm = endH % 12
  const startTotal = startHNorm * 60 + startM
  const endTotal = endHNorm * 60 + endM
  let elapsed = endTotal - startTotal
  if (elapsed < 0) elapsed += 12 * 60
  const elapsedH = Math.floor(elapsed / 60)
  const elapsedM = elapsed % 60

  // Jump method
  const jump1 = startM === 0 ? 0 : (60 - startM)
  const afterJump1H = (startHNorm + (startM === 0 ? 0 : 1)) % 12
  const afterJump1HDisplay = afterJump1H === 0 ? 12 : afterJump1H
  let hourDiff = endHNorm - afterJump1H
  if (hourDiff < 0) hourDiff += 12
  const jump2 = hourDiff * 60
  const jump3 = endM

  const elapsedStr = elapsedH === 0
    ? `${elapsedM} minute${elapsedM !== 1 ? 's' : ''}`
    : elapsedM === 0
      ? `${elapsedH} hour${elapsedH !== 1 ? 's' : ''}`
      : `${elapsedH} hour${elapsedH !== 1 ? 's' : ''} ${elapsedM} minute${elapsedM !== 1 ? 's' : ''}`

  const minuteClockPos = (m: number) => {
    const p = Math.floor(m / 5)
    return p === 0 ? 12 : p
  }
  const hourHandDesc = (h: number, m: number) => {
    if (m > 30) {
      const next = (h % 12) + 1
      return `near ${next === 13 ? 1 : next}`
    } else if (m > 0) {
      return `past ${h}`
    }
    return `on ${h}`
  }

  // SVG clock geometry
  const W = 100, H = 100, R = 45, cx = 50, cy = 50

  const updateHand = (which: 'start' | 'end', hand: 'hour' | 'minute', angle: number) => {
    if (hand === 'minute') {
      const m = Math.round((angle / 360) * 60) % 60
      if (which === 'start') setStartM(m)
      else setEndM(m)
    } else {
      const hRaw = Math.round((angle / 360) * 12) % 12
      const h = hRaw === 0 ? 12 : hRaw
      if (which === 'start') setStartH(h)
      else setEndH(h)
    }
  }

  const handlePointerDown = (which: 'start' | 'end') => (e: React.PointerEvent<SVGSVGElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ }
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - cx
    const y = e.clientY - rect.top - cy
    const dist = Math.sqrt(x * x + y * y)
    const hand: 'hour' | 'minute' = dist < R * 0.55 ? 'hour' : 'minute'
    const angle = (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360
    setDrag({ which, hand })
    updateHand(which, hand, angle)
  }

  const handlePointerMove = (which: 'start' | 'end') => (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag || drag.which !== which) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - cx
    const y = e.clientY - rect.top - cy
    const angle = (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360
    updateHand(drag.which, drag.hand, angle)
  }

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    setDrag(null)
  }

  const renderClock = (which: 'start' | 'end', h: number, m: number) => {
    const hourAngle = ((h % 12) + m / 60) * 30
    const minAngle = m * 6
    const hourX = cx + Math.sin(hourAngle * Math.PI / 180) * (R * 0.5)
    const hourY = cy - Math.cos(hourAngle * Math.PI / 180) * (R * 0.5)
    const minX = cx + Math.sin(minAngle * Math.PI / 180) * (R * 0.85)
    const minY = cy - Math.cos(minAngle * Math.PI / 180) * (R * 0.85)
    return (
      <svg width={W} height={H}
        onPointerDown={handlePointerDown(which)}
        onPointerMove={handlePointerMove(which)}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none', cursor: drag && drag.which === which ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        <circle cx={cx} cy={cy} r={R} fill={bg} stroke={border} strokeWidth={1.5} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = i * 30 * Math.PI / 180
          const x1 = cx + Math.sin(a) * (R - 4)
          const y1 = cy - Math.cos(a) * (R - 4)
          const x2 = cx + Math.sin(a) * R
          const y2 = cy - Math.cos(a) * R
          return <line key={'tick-' + i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={subText} strokeWidth={1} style={{ pointerEvents: 'none' }} />
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const num = i === 0 ? 12 : i
          const a = i * 30 * Math.PI / 180
          const x = cx + Math.sin(a) * (R - 11)
          const y = cy - Math.cos(a) * (R - 11)
          return <text key={'num-' + num} x={x} y={y + 3} textAnchor="middle" fontSize={8} fill={text} style={{ pointerEvents: 'none' }}>{num}</text>
        })}
        <line x1={cx} y1={cy} x2={hourX} y2={hourY} stroke={bright} strokeWidth={3} strokeLinecap="round" style={{ pointerEvents: 'none' }} />
        <line x1={cx} y1={cy} x2={minX} y2={minY} stroke={accentText} strokeWidth={2} strokeLinecap="round" style={{ pointerEvents: 'none' }} />
        <circle cx={cx} cy={cy} r={2.5} fill={bright} style={{ pointerEvents: 'none' }} />
      </svg>
    )
  }

  // Proportional widths for the jump bar
  const totalJump = jump1 + jump2 + jump3 || 1
  const j1Pct = (jump1 / totalJump) * 100
  const j2Pct = (jump2 / totalJump) * 100
  const j3Pct = (jump3 / totalJump) * 100

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ fontSize: 10, color: subText, marginBottom: 6 }}>⏰ Elapsed Time — drag the hands to find the duration</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          {renderClock('start', startH, startM)}
          <div style={{ fontSize: 9, color: subText, marginTop: 2 }}>Start</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: bright }}>{fmt(startH, startM)}</div>
        </div>
        <div style={{ fontSize: 18, color: accentText, padding: '0 4px' }}>→</div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          {renderClock('end', endH, endM)}
          <div style={{ fontSize: 9, color: subText, marginTop: 2 }}>End</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: bright }}>{fmt(endH, endM)}</div>
        </div>
      </div>

      <div style={{ marginTop: 4, padding: '8px 6px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 6, border: '1px solid ' + border }}>
        <div style={{ fontSize: 9, color: subText, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', justifyContent: 'space-between' }}>
          <span>Jump Method</span>
          <span style={{ color: accentText, fontWeight: 700 }}>Total: {elapsedStr}</span>
        </div>
        <div style={{ display: 'flex', height: 18, borderRadius: 3, overflow: 'hidden', border: '1px solid ' + border }}>
          <div style={{ width: `${j1Pct}%`, background: 'rgba(59,130,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 600 }}>{jump1 > 0 ? `+${jump1}m` : ''}</div>
          <div style={{ width: `${j2Pct}%`, background: 'rgba(5,150,105,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 600, borderLeft: jump1 > 0 ? '1px solid ' + border : 'none' }}>{jump2 > 0 ? `+${jump2}m` : ''}</div>
          <div style={{ width: `${j3Pct}%`, background: 'rgba(167,139,250,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 600, borderLeft: jump2 > 0 ? '1px solid ' + border : 'none' }}>{jump3 > 0 ? `+${jump3}m` : ''}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: subText, marginTop: 3 }}>
          <span>{fmt(startH, startM)}</span>
          <span>{fmt(endH, endM)}</span>
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: bright }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Start time: <b>{fmt(startH, startM)}</b> (hour hand {hourHandDesc(startH, startM)}, minute hand at {minuteClockPos(startM)})</div>
        <div>Step 2: End time: <b>{fmt(endH, endM)}</b> (hour hand {hourHandDesc(endH, endM)}, minute hand at {minuteClockPos(endM)})</div>
        <div>Step 3: Jump 1: from {fmt(startH, startM)} to {fmt(afterJump1HDisplay, 0)} = <b style={{ color: '#60a5fa' }}>{jump1} minute{jump1 !== 1 ? 's' : ''}</b></div>
        <div>Step 4: Jump 2: from {fmt(afterJump1HDisplay, 0)} to {fmt(endH, 0)} = <b style={{ color: accentText }}>{jump2} minute{jump2 !== 1 ? 's' : ''} ({hourDiff} {hourDiff === 1 ? 'hour' : 'hours'})</b></div>
        <div>Step 5: Jump 3: from {fmt(endH, 0)} to {fmt(endH, endM)} = <b style={{ color: '#a78bfa' }}>{jump3} minute{jump3 !== 1 ? 's' : ''}</b></div>
        <div>Step 6: Total elapsed = {jump1} + {jump2} + {jump3} = <b style={{ color: accentText }}>{elapsed} min</b> = <b style={{ color: accentText }}>{elapsedStr}</b></div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The "jump method" breaks elapsed time into friendly chunks: first hop to the next hour (so you're working with whole hours), then count the hours, then add the leftover minutes. It avoids subtraction-with-borrowing across hours — the #1 place students slip up.
      </div>
    </div>
  )
}

// ---- Algebra Balance Scale (Middle School 6-8) ----

export function AlgebraBalanceScale({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const PRESETS = [
    { name: '2x + 3 = 11', coef: 2, constLeft: 3, right: 11 },
    { name: '3x − 5 = 10', coef: 3, constLeft: -5, right: 10 },
    { name: '5x + 2 = 17', coef: 5, constLeft: 2, right: 17 },
  ]
  const [presetIdx, setPresetIdx] = useState(0)
  const [coef, setCoef] = useState(2)
  const [constLeft, setConstLeft] = useState(3)
  const [right, setRight] = useState(11)
  const [ops, setOps] = useState<Array<{ label: string; to: string }>>([])

  const loadPreset = (i: number) => {
    const p = PRESETS[i]
    setPresetIdx(i); setCoef(p.coef); setConstLeft(p.constLeft); setRight(p.right); setOps([])
  }
  const eqStr = (c: number, k: number, r: number) => `${c === 1 ? '' : c}x${k === 0 ? '' : k > 0 ? ' + ' + k : ' − ' + (-k)} = ${r}`
  const beforeEq = eqStr(PRESETS[presetIdx].coef, PRESETS[presetIdx].constLeft, PRESETS[presetIdx].right)

  const doSubtractConst = () => {
    if (constLeft === 0) return
    const newRight = right - constLeft
    const opLabel = constLeft > 0 ? `Subtract ${constLeft} from both sides` : `Add ${-constLeft} to both sides`
    const toEq = eqStr(coef, 0, newRight)
    setOps([...ops, { label: opLabel, to: toEq }])
    setRight(newRight); setConstLeft(0)
  }
  const doDivide = () => {
    if (coef === 1) return
    if (right % coef !== 0) return
    const newRight = right / coef
    setOps([...ops, { label: `Divide both sides by ${coef}`, to: `x = ${newRight}` }])
    setCoef(1); setRight(newRight); setConstLeft(0)
  }
  const reset = () => loadPreset(presetIdx)

  const solved = coef === 1 && constLeft === 0
  const currentEq = eqStr(coef, constLeft, right)
  const xTileCount = coef
  const leftOnesCount = constLeft > 0 ? constLeft : 0
  const leftNegCount = constLeft < 0 ? -constLeft : 0
  const rightOnesCount = right > 0 ? right : 0

  const Tile = ({ children, color, size = 14 }: { children?: React.ReactNode; color: string; size?: number }) => (
    <div style={{ width: size, height: size, borderRadius: 3, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>{children}</div>
  )

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => loadPreset(i)} style={{
            padding: '3px 7px', borderRadius: 4, fontSize: 10,
            background: i === presetIdx ? 'rgba(5,150,105,0.15)' : bg,
            border: '1px solid ' + (i === presetIdx ? 'rgba(5,150,105,0.3)' : border),
            color: i === presetIdx ? accentText : text, cursor: 'pointer', fontFamily: 'monospace',
          }}>{p.name}</button>
        ))}
      </div>

      <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: bright, fontFamily: 'monospace', marginBottom: 8, padding: '5px 0', background: bg, borderRadius: 4, border: '1px solid ' + border }}>
        {currentEq}{solved && <span style={{ marginLeft: 6, color: accentText }}>✓</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8, color: subText, marginBottom: 2, textAlign: 'center', letterSpacing: 0.5 }}>LEFT</div>
          <div style={{ minHeight: 38, padding: 4, background: bg, border: '1px solid ' + border, borderRadius: 4, display: 'flex', flexWrap: 'wrap', gap: 2, alignContent: 'flex-start' }}>
            {Array.from({ length: Math.min(xTileCount, 6) }).map((_, i) => <Tile key={'x' + i} color="#3b82f6">x</Tile>)}
            {xTileCount > 6 && <span style={{ fontSize: 9, color: text, alignSelf: 'center' }}>×{xTileCount - 6}</span>}
            {Array.from({ length: Math.min(leftOnesCount, 10) }).map((_, i) => <Tile key={'lo' + i} color="#10b981" size={10} />)}
            {leftOnesCount > 10 && <span style={{ fontSize: 9, color: text, alignSelf: 'center' }}>+{leftOnesCount - 10}</span>}
            {leftNegCount > 0 && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, alignSelf: 'center' }}>−{leftNegCount}</span>}
            {xTileCount === 0 && leftOnesCount === 0 && leftNegCount === 0 && <span style={{ fontSize: 9, color: subText, alignSelf: 'center' }}>empty</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 16, color: subText, fontWeight: 700 }}>=</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8, color: subText, marginBottom: 2, textAlign: 'center', letterSpacing: 0.5 }}>RIGHT</div>
          <div style={{ minHeight: 38, padding: 4, background: bg, border: '1px solid ' + border, borderRadius: 4, display: 'flex', flexWrap: 'wrap', gap: 2, alignContent: 'flex-start' }}>
            {Array.from({ length: Math.min(rightOnesCount, 15) }).map((_, i) => <Tile key={'ro' + i} color="#f59e0b" size={10} />)}
            {rightOnesCount > 15 && <span style={{ fontSize: 9, color: text, alignSelf: 'center' }}>+{rightOnesCount - 15}</span>}
            {rightOnesCount === 0 && <span style={{ fontSize: 9, color: subText, alignSelf: 'center' }}>empty</span>}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 9, color: accentText, marginBottom: 6, fontWeight: 600 }}>
        ⚖ Balanced — same operation applied to both sides
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        <button onClick={doSubtractConst} disabled={constLeft === 0} style={{
          padding: '4px 6px', borderRadius: 4, fontSize: 9, cursor: constLeft === 0 ? 'not-allowed' : 'pointer',
          background: constLeft === 0 ? bg : 'rgba(5,150,105,0.1)', border: '1px solid ' + (constLeft === 0 ? border : 'rgba(5,150,105,0.3)'),
          color: constLeft === 0 ? subText : accentText, fontWeight: 600,
        }}>{constLeft > 0 ? `Subtract ${constLeft}` : constLeft < 0 ? `Add ${-constLeft}` : 'Constant = 0'}</button>
        <button onClick={doDivide} disabled={coef === 1 || right % coef !== 0} style={{
          padding: '4px 6px', borderRadius: 4, fontSize: 9, cursor: (coef === 1 || right % coef !== 0) ? 'not-allowed' : 'pointer',
          background: (coef === 1 || right % coef !== 0) ? bg : 'rgba(5,150,105,0.1)',
          border: '1px solid ' + ((coef === 1 || right % coef !== 0) ? border : 'rgba(5,150,105,0.3)'),
          color: (coef === 1 || right % coef !== 0) ? subText : accentText, fontWeight: 600,
        }}>{coef === 1 ? 'x isolated' : `Divide by ${coef}`}</button>
        <button onClick={reset} style={{
          padding: '4px 8px', borderRadius: 4, fontSize: 9, cursor: 'pointer',
          background: bg, border: '1px solid ' + border, color: text,
        }}>Reset</button>
      </div>

      {ops.length > 0 && (
        <div style={{ marginBottom: 6, padding: 4, background: bg, border: '1px solid ' + border, borderRadius: 4 }}>
          {ops.map((op, i) => (
            <div key={i} style={{ fontSize: 9, color: text, padding: '2px 0', display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ color: subText }}>{i + 1}.</span>
              <span style={{ flex: 1 }}>{op.label}</span>
              <span style={{ fontFamily: 'monospace', color: accentText }}>{op.to}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Original equation: <b style={{ fontFamily: 'monospace' }}>{beforeEq}</b></div>
        <div>Step 2: Left side: <b>{xTileCount}</b> x-tile{xTileCount !== 1 ? 's' : ''}{constLeft !== 0 ? (constLeft > 0 ? ` + ${constLeft} one-tile${constLeft !== 1 ? 's' : ''}` : ` − ${-constLeft} one-tile${-constLeft !== 1 ? 's' : ''}`) : ''} | Right side: <b>{rightOnesCount}</b> one-tile{rightOnesCount !== 1 ? 's' : ''}</div>
        {ops.length === 0 ? (
          <div>Step 3: Click an operation button — the same action happens on BOTH sides to keep balance</div>
        ) : (
          ops.map((op, i) => (
            <div key={i}>Step {3 + i}: <b>{op.label}</b> → <span style={{ fontFamily: 'monospace', color: accentText }}>{op.to}</span></div>
          ))
        )}
        <div>Step {3 + ops.length}: {solved
          ? <span><b style={{ color: accentText }}>Solved! x = {right}</b> — each x-tile equals {right} one-tiles</span>
          : <span>Next: {constLeft !== 0 ? 'remove the constant (subtract it from both sides)' : coef !== 1 ? `divide both sides by ${coef}` : 'in progress'}</span>}</div>
        <div>Step {4 + ops.length}: Key principle — whatever you do to one side, you MUST do to the other to keep the scale balanced</div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A balanced scale = a true equation. &quot;Solving&quot; means isolating x by strategically undoing operations — subtract to undo addition, divide to undo multiplication — always on BOTH sides.
      </div>
    </div>
  )
}

// ---- Integer Chips (Middle School 6-8) ----

export function IntegerChips({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [yellows, setYellows] = useState(0)
  const [reds, setReds] = useState(0)
  const [pairs, setPairs] = useState(0)
  const [combineDone, setCombineDone] = useState(false)
  const [challengeOn, setChallengeOn] = useState(false)
  const [target, setTarget] = useState(0)

  const sum = yellows - reds

  const addYellow = () => { setYellows(y => y + 1); setPairs(0); setCombineDone(false) }
  const addRed = () => { setReds(r => r + 1); setPairs(0); setCombineDone(false) }
  const combine = () => {
    const p = Math.min(yellows, reds)
    setPairs(p)
    setYellows(y => y - p)
    setReds(r => r - p)
    setCombineDone(true)
  }
  const reset = () => { setYellows(0); setReds(0); setPairs(0); setCombineDone(false) }
  const newChallenge = () => {
    setTarget(Math.floor(Math.random() * 11) - 5)
    setChallengeOn(true)
    reset()
  }

  const total = yellows + reds
  const maxChips = 22
  const shownYellows = Math.min(yellows, maxChips)
  const shownReds = Math.min(reds, maxChips - shownYellows)

  const challengeMet = challengeOn && sum === target && (yellows > 0 || reds > 0)

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 4, fontSize: 11 }}>
        <span style={{ color: subText }}>Sum: <b style={{ color: sum > 0 ? accentText : sum < 0 ? '#ef4444' : bright, fontFamily: 'monospace' }}>{sum > 0 ? '+' : ''}{sum}</b></span>
        {challengeOn && (
          <span style={{ color: subText }}>Target: <b style={{ color: target > 0 ? accentText : target < 0 ? '#ef4444' : bright, fontFamily: 'monospace' }}>{target > 0 ? '+' : ''}{target}</b> {challengeMet ? '✓' : ''}</span>
        )}
      </div>

      <div style={{ position: 'relative', height: 80, marginBottom: 6, background: bg, border: '1px solid ' + border, borderRadius: 4, overflow: 'hidden' }}>
        <svg width="100%" height="80" viewBox="0 0 260 80" style={{ display: 'block' }}>
          {Array.from({ length: shownYellows }).map((_, i) => {
            const x = 14 + (i % 11) * 22
            const y = 18 + Math.floor(i / 11) * 22
            return <g key={'y' + i}>
              <circle cx={x} cy={y} r="9" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />
              <text x={x} y={y + 3} textAnchor="middle" fontSize="8" fill="#92400e" fontWeight="700">+1</text>
            </g>
          })}
          {Array.from({ length: shownReds }).map((_, i) => {
            const idx = shownYellows + i
            const x = 14 + (idx % 11) * 22
            const y = 18 + Math.floor(idx / 11) * 22
            return <g key={'r' + i}>
              <circle cx={x} cy={y} r="9" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
              <text x={x} y={y + 3} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700">−1</text>
            </g>
          })}
          {total === 0 && <text x="130" y="42" textAnchor="middle" fontSize="10" fill={subText}>Click &quot;Add Yellow&quot; or &quot;Add Red&quot; to begin</text>}
          {total > maxChips && <text x="130" y="74" textAnchor="middle" fontSize="9" fill={subText}>(showing first {maxChips} of {total})</text>}
        </svg>
      </div>

      {combineDone && pairs > 0 && (
        <div style={{ marginBottom: 6, padding: '4px 6px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 4, fontSize: 10, color: accentText }}>
          {pairs} zero pair{pairs !== 1 ? 's' : ''} formed — {pairs} yellow + {pairs} red = 0
        </div>
      )}
      {combineDone && pairs === 0 && (yellows > 0 || reds > 0) && (
        <div style={{ marginBottom: 6, padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 4, fontSize: 10, color: subText }}>
          No zero pairs possible — all chips are the same color
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        <button onClick={addYellow} style={{ padding: '4px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24', fontWeight: 600 }}>+ Add Yellow (+1)</button>
        <button onClick={addRed} style={{ padding: '4px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', fontWeight: 600 }}>+ Add Red (−1)</button>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        <button onClick={combine} disabled={yellows === 0 || reds === 0} style={{
          padding: '4px 8px', borderRadius: 4, fontSize: 10, cursor: (yellows === 0 || reds === 0) ? 'not-allowed' : 'pointer',
          background: (yellows === 0 || reds === 0) ? bg : 'rgba(5,150,105,0.1)',
          border: '1px solid ' + ((yellows === 0 || reds === 0) ? border : 'rgba(5,150,105,0.3)'),
          color: (yellows === 0 || reds === 0) ? subText : accentText, fontWeight: 600,
        }}>Combine Pairs</button>
        <button onClick={reset} style={{ padding: '4px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', background: bg, border: '1px solid ' + border, color: text }}>Reset</button>
        <button onClick={newChallenge} style={{ padding: '4px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', fontWeight: 600 }}>New Challenge</button>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Yellows: <b style={{ color: '#fbbf24' }}>{yellows}</b> (value +{yellows}) | Reds: <b style={{ color: '#ef4444' }}>{reds}</b> (value −{reds})</div>
        <div>Step 2: Total chips: <b>{yellows + reds}</b> ({yellows} yellow + {reds} red)</div>
        <div>Step 3: Form zero pairs — each yellow + red pair = 0 (they &quot;cancel out&quot;)</div>
        {combineDone ? (
          <>
            <div>Step 4: <b>{pairs}</b> zero pair{pairs !== 1 ? 's' : ''} formed → {pairs} yellow + {pairs} red cancel out</div>
            <div>Step 5: Remaining: <b>{yellows}</b> yellow{yellows !== 1 ? 's' : ''}{reds > 0 ? ` and ${reds} red${reds !== 1 ? 's' : ''}` : (yellows === 0 && reds === 0 ? ' (all canceled)' : '')}</div>
            <div>Step 6: Sum = <b style={{ color: accentText }}>{sum > 0 ? '+' : ''}{sum}</b> {sum === 0 ? '(zero!)' : '✓'}</div>
          </>
        ) : (
          <>
            <div>Step 4: Click &quot;Combine Pairs&quot; to cancel out opposite-colored chips</div>
            <div>Step 5: After combining, the unpaired chips reveal the final sum</div>
            <div>Step 6: Preview sum (no combine yet): <b>{sum > 0 ? '+' : ''}{sum}</b></div>
          </>
        )}
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The &quot;zero pair&quot; — one positive and one negative — is the foundation of integer arithmetic. −3 + 5 = 2 because 3 of the 5 positives pair with all 3 negatives (cancelling to 0), leaving 2 positives.
      </div>
    </div>
  )
}

// ---- Percent Double Number Line (Middle School 6-8) ----

export function PercentDoubleNumberLine({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [whole, setWhole] = useState(80)
  const [percent, setPercent] = useState(25)
  const [unknown, setUnknown] = useState<'part' | 'whole' | 'percent'>('part')

  const part = whole * percent / 100

  const simplifyFraction = (n: number, d: number): [number, number] => {
    if (d === 0 || n === 0) return [n, d]
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const g = gcd(Math.abs(n), Math.abs(d))
    return [n / g, d / g]
  }
  const [numP, denP] = simplifyFraction(percent, 100)

  const W = 240, H = 80
  const margin = 20
  const lineLen = W - 2 * margin
  const partX = margin + (whole === 0 ? 0 : (part / whole)) * lineLen
  const pctX = margin + (percent / 100) * lineLen

  const inputStyle: React.CSSProperties = {
    width: 50, padding: '2px 4px', borderRadius: 3, fontSize: 10,
    border: '1px solid ' + border, background: bg, color: bright, textAlign: 'center', outline: 'none',
  }

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
        {(['part', 'whole', 'percent'] as const).map(u => (
          <button key={u} onClick={() => setUnknown(u)} style={{
            padding: '3px 7px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
            background: unknown === u ? 'rgba(5,150,105,0.15)' : bg,
            border: '1px solid ' + (unknown === u ? 'rgba(5,150,105,0.3)' : border),
            color: unknown === u ? accentText : text, fontWeight: 600,
          }}>Find {u}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 10, alignItems: 'center', justifyContent: 'center' }}>
        <label style={{ color: subText }}>
          Whole: <input type="number" value={whole} disabled={unknown === 'whole'} onChange={e => setWhole(Math.max(0, +e.target.value))} style={{ ...inputStyle, opacity: unknown === 'whole' ? 0.5 : 1 }} />
        </label>
        <label style={{ color: subText }}>
          %: <input type="number" value={percent} disabled={unknown === 'percent'} onChange={e => setPercent(Math.max(0, Math.min(100, +e.target.value)))} style={{ ...inputStyle, opacity: unknown === 'percent' ? 0.5 : 1 }} />
        </label>
      </div>

      <div style={{ textAlign: 'center', fontSize: 13, fontFamily: 'monospace', color: bright, marginBottom: 6, padding: '4px', background: bg, border: '1px solid ' + border, borderRadius: 4 }}>
        {unknown === 'part' && <>Part = <b style={{ color: accentText }}>{part}</b></>}
        {unknown === 'whole' && <>Whole = <b style={{ color: accentText }}>{whole}</b> <span style={{ color: subText, fontSize: 10 }}>(given)</span></>}
        {unknown === 'percent' && <>Percent = <b style={{ color: accentText }}>{percent}%</b> <span style={{ color: subText, fontSize: 10 }}>(given)</span></>}
      </div>

      <div style={{ marginBottom: 6 }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
          <text x={W / 2} y="11" textAnchor="middle" fontSize="8" fill={subText} fontWeight="700">WHOLE</text>
          <line x1={margin} y1="20" x2={W - margin} y2="20" stroke={text} strokeWidth="1" />
          <line x1={margin} y1="16" x2={margin} y2="24" stroke={text} strokeWidth="1" />
          <line x1={W - margin} y1="16" x2={W - margin} y2="24" stroke={text} strokeWidth="1" />
          <text x={margin} y="14" textAnchor="middle" fontSize="8" fill={subText}>0</text>
          <text x={W - margin} y="14" textAnchor="middle" fontSize="8" fill={subText}>{whole}</text>
          {part > 0 && part <= whole && whole > 0 && (
            <>
              <line x1={partX} y1="16" x2={partX} y2="24" stroke={accentText} strokeWidth="2" />
              <text x={partX} y="36" textAnchor="middle" fontSize="9" fill={accentText} fontWeight="700">{part}</text>
            </>
          )}

          <line x1={partX} y1="24" x2={pctX} y2="56" stroke={accentText} strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />

          {percent >= 0 && percent <= 100 && (
            <>
              <line x1={pctX} y1="56" x2={pctX} y2="64" stroke={accentText} strokeWidth="2" />
              <text x={pctX} y="52" textAnchor="middle" fontSize="9" fill={accentText} fontWeight="700">{percent}%</text>
            </>
          )}
          <line x1={margin} y1="60" x2={W - margin} y2="60" stroke={text} strokeWidth="1" />
          <line x1={margin} y1="56" x2={margin} y2="64" stroke={text} strokeWidth="1" />
          <line x1={W - margin} y1="56" x2={W - margin} y2="64" stroke={text} strokeWidth="1" />
          <text x={margin} y="74" textAnchor="middle" fontSize="8" fill={subText}>0%</text>
          <text x={W - margin} y="74" textAnchor="middle" fontSize="8" fill={subText}>100%</text>
          <text x={W / 2} y="78" textAnchor="middle" fontSize="8" fill={subText} fontWeight="700">PERCENT</text>
        </svg>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Whole = <b>{whole}</b> (top number line, 0 to {whole})</div>
        <div>Step 2: Percent = <b>{percent}%</b> (bottom number line, 0% to 100%)</div>
        <div>Step 3: Set up ratio: <span style={{ fontFamily: 'monospace' }}>part/{whole} = {percent}/100</span></div>
        <div>Step 4: Simplify: {percent}/100 = <b>{numP}/{denP}</b>{denP === 1 ? ' (= 1)' : ''}</div>
        <div>Step 5: Solve: part = ({percent}/100) × {whole} = <b style={{ color: accentText }}>{part}</b></div>
        <div>Step 6: ✓ {percent}% of {whole} = <b style={{ color: accentText }}>{part}</b></div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Percent is just a ratio out of 100. The double number line shows that 25% of 80 = 20 because &quot;25 out of 100&quot; aligns with &quot;20 out of 80&quot; — same fraction, different labels.
      </div>
    </div>
  )
}

// ---- Two-Step Equation Solver (Middle School 6-8) ----

export function TwoStepEquationSolver({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const PRESETS = [
    { name: '3x + 5 = 17', coef: 3, constLeft: 5, right: 17 },
    { name: '2x + 7 = 15', coef: 2, constLeft: 7, right: 15 },
    { name: '4x − 3 = 13', coef: 4, constLeft: -3, right: 13 },
  ]
  const [presetIdx, setPresetIdx] = useState(0)
  const [step, setStep] = useState(0)
  const [showCheck, setShowCheck] = useState(false)

  const p = PRESETS[presetIdx]
  const eq = (c: number, k: number, r: number) => `${c}x${k === 0 ? '' : k > 0 ? ' + ' + k : ' − ' + (-k)} = ${r}`
  const origEq = eq(p.coef, p.constLeft, p.right)

  const newRight = p.right - p.constLeft
  const afterSub = `${p.coef}x = ${newRight}`
  const subOp = p.constLeft > 0 ? `Subtract ${p.constLeft} from both sides` : `Add ${-p.constLeft} to both sides`
  const subJust = p.constLeft > 0 ? `undoes the +${p.constLeft}` : `undoes the −${-p.constLeft}`

  const solution = newRight / p.coef
  const afterDiv = `x = ${solution}`
  const divJust = `undoes the ×${p.coef}`

  const checkResult = p.coef * solution + p.constLeft

  const loadPreset = (i: number) => { setPresetIdx(i); setStep(0); setShowCheck(false) }
  const nextStep = () => setStep(s => Math.min(4, s + 1))
  const reset = () => { setStep(0); setShowCheck(false) }

  const cards = [
    { label: '1. Original', eq: origEq, op: 'Identify form: ax + b = c', just: `a=${p.coef}, b=${p.constLeft}, c=${p.right}` },
    { label: '2. Subtract constant', eq: afterSub, op: subOp, just: subJust },
    { label: '3. Divide by coefficient', eq: afterDiv, op: `Divide both sides by ${p.coef}`, just: divJust },
    { label: '4. Solution', eq: `x = ${solution}`, op: 'Variable isolated', just: 'Solution found' },
  ]

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => loadPreset(i)} style={{
            padding: '3px 7px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
            background: i === presetIdx ? 'rgba(5,150,105,0.15)' : bg,
            border: '1px solid ' + (i === presetIdx ? 'rgba(5,150,105,0.3)' : border),
            color: i === presetIdx ? accentText : text, fontFamily: 'monospace',
          }}>{p.name}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
        {cards.map((card, i) => {
          const active = step >= i + 1
          return (
            <div key={i} style={{
              padding: '5px 7px', borderRadius: 4, fontSize: 10, transition: 'all 0.2s',
              background: active ? (i === 3 ? 'rgba(5,150,105,0.1)' : 'rgba(59,130,246,0.08)') : bg,
              border: '1px solid ' + (active ? (i === 3 ? 'rgba(5,150,105,0.3)' : 'rgba(59,130,246,0.3)') : border),
              opacity: active ? 1 : 0.5,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: active ? (i === 3 ? accentText : '#60a5fa') : subText, textTransform: 'uppercase', letterSpacing: 0.5 }}>{card.label}</span>
                {active && <span style={{ fontSize: 10, color: i === 3 ? accentText : '#60a5fa' }}>✓</span>}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: active ? bright : subText, fontWeight: 600, marginBottom: 2 }}>
                {card.eq}
              </div>
              {active && (
                <div style={{ fontSize: 9, color: text, lineHeight: 1.3 }}>
                  <span style={{ color: subText }}>op:</span> {card.op}<br />
                  <span style={{ color: subText }}>why:</span> {card.just}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {step >= 4 && (
        <div style={{
          padding: '6px 7px', borderRadius: 4, fontSize: 10, marginBottom: 6,
          background: showCheck ? 'rgba(5,150,105,0.1)' : bg,
          border: '1px solid ' + (showCheck ? 'rgba(5,150,105,0.3)' : border),
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: showCheck ? accentText : subText, textTransform: 'uppercase', letterSpacing: 0.5 }}>5. Check</span>
            {!showCheck && (
              <button onClick={() => setShowCheck(true)} style={{
                padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer',
                background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)',
                color: accentText, fontWeight: 600,
              }}>Verify</button>
            )}
          </div>
          {showCheck && (
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: bright }}>
              {p.coef}({solution}) {p.constLeft >= 0 ? '+' : '−'} {Math.abs(p.constLeft)} = {p.coef * solution} {p.constLeft >= 0 ? '+' : '−'} {Math.abs(p.constLeft)} = <b style={{ color: accentText }}>{checkResult}</b> {checkResult === p.right ? '✓' : '✗'}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 6, alignItems: 'center' }}>
        <button onClick={nextStep} disabled={step >= 4} style={{
          padding: '4px 10px', borderRadius: 4, fontSize: 10, cursor: step >= 4 ? 'not-allowed' : 'pointer',
          background: step >= 4 ? bg : 'rgba(5,150,105,0.15)',
          border: '1px solid ' + (step >= 4 ? border : 'rgba(5,150,105,0.3)'),
          color: step >= 4 ? subText : accentText, fontWeight: 600,
        }}>{step === 0 ? 'Start' : step >= 4 ? 'Done' : 'Next Step →'}</button>
        <button onClick={reset} style={{
          padding: '4px 10px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
          background: bg, border: '1px solid ' + border, color: text,
        }}>Reset</button>
        <span style={{ marginLeft: 'auto', fontSize: 9, color: subText }}>Step {step}/4</span>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Original: <b style={{ fontFamily: 'monospace' }}>{origEq}</b></div>
        <div>Step 2: {step >= 2 ? <span>{subOp}: <b style={{ fontFamily: 'monospace' }}>{afterSub}</b> ({subJust})</span> : 'Pending: subtract the constant to isolate the x-term'}</div>
        <div>Step 3: {step >= 3 ? <span>Divide both sides by {p.coef}: <b style={{ fontFamily: 'monospace' }}>{afterDiv}</b> ({divJust})</span> : 'Pending: divide by the coefficient to isolate x'}</div>
        <div>Step 4: {step >= 4 ? <span>Solution: <b style={{ color: accentText, fontFamily: 'monospace' }}>x = {solution}</b></span> : 'Pending: solution reached after both inverse operations'}</div>
        <div>Step 5: {showCheck ? <span>Check: {p.coef}({solution}) {p.constLeft >= 0 ? '+' : '−'} {Math.abs(p.constLeft)} = {checkResult} {checkResult === p.right ? '✓' : '✗'}</span> : 'Verify by substituting the solution back into the original equation'}</div>
        <div>Step 6: <b>Order matters:</b> undo addition/subtraction FIRST, then multiplication/division (reverse of order of operations)</div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Solving = &quot;undoing&quot; operations in reverse order. The equation was built by multiplying x by a, then adding b — to solve, subtract b first, then divide by a. Always verify by checking your answer in the original equation.
      </div>
    </div>
  )
}

// ---- Transformations Explorer (Middle School 6-8) ----

export function TransformationsExplorer({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [transform, setTransform] = useState<'translate' | 'reflect' | 'rotate' | 'dilate'>('translate')
  const [dx, setDx] = useState(2)
  const [dy, setDy] = useState(1)
  const [axis, setAxis] = useState<'x' | 'y' | 'yx'>('y')
  const [angle, setAngle] = useState(90)
  const [dir, setDir] = useState<'CW' | 'CCW'>('CCW')
  const [scale, setScale] = useState(2)

  const ORIG: [number, number][] = [[2, 1], [4, 1], [3, 3]]

  const transformed: [number, number][] = ORIG.map(([x, y]): [number, number] => {
    if (transform === 'translate') return [x + dx, y + dy]
    if (transform === 'reflect') {
      if (axis === 'x') return [x, -y]
      if (axis === 'y') return [-x, y]
      return [y, x]
    }
    if (transform === 'rotate') {
      const rad = (angle * (dir === 'CW' ? -1 : 1)) * Math.PI / 180
      const c = Math.cos(rad), s = Math.sin(rad)
      return [Math.round(x * c - y * s), Math.round(x * s + y * c)]
    }
    return [x * scale, y * scale]
  })

  const ruleStr = () => {
    if (transform === 'translate') return `(x, y) → (x + ${dx}, y + ${dy})`
    if (transform === 'reflect') {
      if (axis === 'x') return '(x, y) → (x, −y) — flip y-sign'
      if (axis === 'y') return '(x, y) → (−x, y) — flip x-sign'
      return '(x, y) → (y, x) — swap x and y'
    }
    if (transform === 'rotate') {
      const dirTxt = dir === 'CW' ? 'clockwise' : 'counterclockwise'
      return `(x, y) → rotate ${angle}° ${dirTxt} about origin`
    }
    return `(x, y) → (${scale}x, ${scale}y) — scale by ${scale}`
  }

  const RANGE = 6
  const W = 240, H = 220
  const cx = W / 2, cy = H / 2
  const unit = (W / 2) / RANGE

  const toPx = (pt: number[]): [number, number] => [cx + pt[0] * unit, cy - pt[1] * unit]

  const origPts = ORIG.map(toPx)
  const newPts = transformed.map(toPx)

  const origPath = `M ${origPts[0][0]} ${origPts[0][1]} L ${origPts[1][0]} ${origPts[1][1]} L ${origPts[2][0]} ${origPts[2][1]} Z`
  const newPath = `M ${newPts[0][0]} ${newPts[0][1]} L ${newPts[1][0]} ${newPts[1][1]} L ${newPts[2][0]} ${newPts[2][1]} Z`

  const btn = (active: boolean): React.CSSProperties => ({
    padding: '3px 7px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
    background: active ? 'rgba(5,150,105,0.15)' : bg,
    border: '1px solid ' + (active ? 'rgba(5,150,105,0.3)' : border),
    color: active ? accentText : text, fontWeight: 600,
  })

  const transformLabels: Record<string, string> = {
    translate: 'Translation (slide)',
    reflect: 'Reflection (flip)',
    rotate: 'Rotation (turn)',
    dilate: 'Dilation (resize)',
  }

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
        {(['translate', 'reflect', 'rotate', 'dilate'] as const).map(t => (
          <button key={t} onClick={() => setTransform(t)} style={btn(transform === t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {transform === 'translate' && (
        <div style={{ marginBottom: 6, fontSize: 10, color: text }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ width: 32, color: subText }}>dx:</span>
            <input type="range" min={-5} max={5} value={dx} onChange={e => setDx(+e.target.value)} style={{ flex: 1 }} />
            <span style={{ width: 24, fontFamily: 'monospace', color: accentText }}>{dx}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 32, color: subText }}>dy:</span>
            <input type="range" min={-5} max={5} value={dy} onChange={e => setDy(+e.target.value)} style={{ flex: 1 }} />
            <span style={{ width: 24, fontFamily: 'monospace', color: accentText }}>{dy}</span>
          </label>
        </div>
      )}
      {transform === 'reflect' && (
        <div style={{ marginBottom: 6, fontSize: 10, display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ color: subText }}>Axis:</span>
          {(['x', 'y', 'yx'] as const).map(a => (
            <button key={a} onClick={() => setAxis(a)} style={btn(axis === a)}>{a === 'x' ? 'x-axis' : a === 'y' ? 'y-axis' : 'y=x'}</button>
          ))}
        </div>
      )}
      {transform === 'rotate' && (
        <div style={{ marginBottom: 6, fontSize: 10, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: subText }}>Angle:</span>
          {[90, 180, 270].map(a => (
            <button key={a} onClick={() => setAngle(a)} style={btn(angle === a)}>{a}°</button>
          ))}
          <span style={{ color: subText, marginLeft: 4 }}>Dir:</span>
          {(['CCW', 'CW'] as const).map(d => (
            <button key={d} onClick={() => setDir(d)} style={btn(dir === d)}>{d}</button>
          ))}
        </div>
      )}
      {transform === 'dilate' && (
        <div style={{ marginBottom: 6, fontSize: 10, color: text }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 50, color: subText }}>Scale:</span>
            <input type="range" min={0.5} max={3} step={0.5} value={scale} onChange={e => setScale(+e.target.value)} style={{ flex: 1 }} />
            <span style={{ width: 30, fontFamily: 'monospace', color: accentText }}>{scale}×</span>
          </label>
        </div>
      )}

      <div style={{ marginBottom: 6 }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', background: bg, border: '1px solid ' + border, borderRadius: 4 }}>
          {Array.from({ length: RANGE * 2 + 1 }).map((_, i) => {
            const x = cx + (i - RANGE) * unit
            return <line key={'vg' + i} x1={x} y1={0} x2={x} y2={H} stroke={border} strokeWidth="0.5" opacity={0.5} />
          })}
          {Array.from({ length: RANGE * 2 + 1 }).map((_, i) => {
            const y = cy + (i - RANGE) * unit
            return <line key={'hg' + i} x1={0} y1={y} x2={W} y2={y} stroke={border} strokeWidth="0.5" opacity={0.5} />
          })}
          <line x1={0} y1={cy} x2={W} y2={cy} stroke={text} strokeWidth="1" />
          <line x1={cx} y1={0} x2={cx} y2={H} stroke={text} strokeWidth="1" />
          <text x={W - 6} y={cy - 4} textAnchor="end" fontSize="8" fill={subText}>x</text>
          <text x={cx + 4} y={8} textAnchor="start" fontSize="8" fill={subText}>y</text>
          {transform === 'reflect' && axis === 'x' && (
            <line x1={0} y1={cy} x2={W} y2={cy} stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4,2" />
          )}
          {transform === 'reflect' && axis === 'y' && (
            <line x1={cx} y1={0} x2={cx} y2={H} stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4,2" />
          )}
          {transform === 'reflect' && axis === 'yx' && (
            <line x1={0} y1={H} x2={W} y2={0} stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4,2" />
          )}
          <path d={origPath} fill="rgba(148,163,184,0.3)" stroke={subText} strokeWidth="1.5" />
          <path d={newPath} fill="rgba(52,211,153,0.25)" stroke={accentText} strokeWidth="1.5" />
          {ORIG.map((v, i) => {
            const [px, py] = toPx(v)
            const label = String.fromCharCode(65 + i)
            return <text key={'ol' + i} x={px + 3} y={py - 3} fontSize="9" fill={subText} fontWeight="700">{label}</text>
          })}
          {transformed.map((v, i) => {
            const [px, py] = toPx(v)
            const label = String.fromCharCode(65 + i) + "'"
            return <text key={'nl' + i} x={px + 3} y={py - 3} fontSize="9" fill={accentText} fontWeight="700">{label}</text>
          })}
        </svg>
      </div>

      <div style={{ marginBottom: 6, padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 4, fontSize: 10, color: text }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ color: subText }}>Original (gray):</span>
          <span style={{ fontFamily: 'monospace' }}>A(2,1) B(4,1) C(3,3)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: accentText }}>Transformed:</span>
          <span style={{ fontFamily: 'monospace' }}>
            {transformed.map((v, i) => `${String.fromCharCode(65 + i)}'(${v[0]},${v[1]})`).join(' ')}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Transformation: <b>{transformLabels[transform]}</b></div>
        <div>Step 2: Rule: <span style={{ fontFamily: 'monospace' }}>{ruleStr()}</span></div>
        <div>Step 3: Vertex A (2, 1) → A' <b style={{ color: accentText }}>({transformed[0][0]}, {transformed[0][1]})</b></div>
        <div>Step 4: Vertex B (4, 1) → B' <b style={{ color: accentText }}>({transformed[1][0]}, {transformed[1][1]})</b></div>
        <div>Step 5: Vertex C (3, 3) → C' <b style={{ color: accentText }}>({transformed[2][0]}, {transformed[2][1]})</b></div>
        <div>Step 6: {transform === 'translate' ? 'A translation slides every point by the same amount — shape and size are preserved'
          : transform === 'reflect' ? `The ${axis === 'x' ? 'x-axis' : axis === 'y' ? 'y-axis' : 'line y=x'} is the &quot;mirror&quot; — distance to the mirror is preserved`
          : transform === 'rotate' ? `Rotation turns every point around the origin by ${angle}° ${dir === 'CW' ? 'clockwise' : 'counterclockwise'} — distance from origin is preserved`
          : `Dilation scales every point's distance from origin by ${scale}× — angles preserved, size changes`}</div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Translations, reflections, and rotations are &quot;rigid&quot; — they preserve size and shape (just move it). Dilations preserve shape but change size. Each transformation has a precise coordinate rule that can be applied to every point.
      </div>
    </div>
  )
}

// ============================================================
// HIGH SCHOOL (9-12) MATH WIDGETS
// ============================================================

// ---- Unit Circle Explorer (HS 9-12) ----

export function UnitCircleExplorer({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [angle, setAngle] = useState(45)
  const [show, setShow] = useState({ sin: true, cos: true, tan: true })

  const rad = angle * Math.PI / 180
  const sinV = Math.sin(rad)
  const cosV = Math.cos(rad)
  const tanV = Math.abs(cosV) < 1e-9 ? null : Math.tan(rad)
  const cscV = Math.abs(sinV) < 1e-9 ? null : 1 / sinV
  const secV = Math.abs(cosV) < 1e-9 ? null : 1 / cosV
  const cotV = Math.abs(sinV) < 1e-9 ? null : cosV / sinV

  const commonAngles: Record<number, string> = {
    0: '0', 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2',
    120: '2π/3', 135: '3π/4', 150: '5π/6', 180: 'π',
    210: '7π/6', 225: '5π/4', 240: '4π/3', 270: '3π/2',
    300: '5π/3', 315: '7π/4', 330: '11π/6', 360: '2π',
  }
  const radStr = commonAngles[angle] ?? rad.toFixed(3)

  const cx = 120, cy = 120, r = 80
  const px = cx + r * cosV
  const py = cy - r * sinV

  const tanX = cx + r
  const tanClamp = 3.2
  const tanTopY = tanV === null ? null : cy - r * Math.max(-tanClamp, Math.min(tanClamp, tanV))

  const fmt = (v: number | null) => v === null ? 'undef' : v.toFixed(3)

  const sinColor = '#34d399'
  const cosColor = '#60a5fa'
  const tanColor = '#f59e0b'

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <svg width={240} height={240} viewBox="0 0 240 240" style={{ display: 'block', margin: '0 auto' }}>
        <line x1={40} y1={cy} x2={200} y2={cy} stroke={subText} strokeWidth={1} />
        <line x1={cx} y1={40} x2={cx} y2={200} stroke={subText} strokeWidth={1} />
        <text x={204} y={cy + 4} fontSize={9} fill={subText}>x</text>
        <text x={cx + 4} y={36} fontSize={9} fill={subText}>y</text>
        <line x1={cx + r} y1={cy - 3} x2={cx + r} y2={cy + 3} stroke={subText} strokeWidth={1} />
        <line x1={cx - r} y1={cy - 3} x2={cx - r} y2={cy + 3} stroke={subText} strokeWidth={1} />
        <line x1={cx - 3} y1={cy - r} x2={cx + 3} y2={cy - r} stroke={subText} strokeWidth={1} />
        <line x1={cx - 3} y1={cy + r} x2={cx + 3} y2={cy + r} stroke={subText} strokeWidth={1} />
        <text x={cx + r + 2} y={cy + 11} fontSize={8} fill={subText}>1</text>
        <text x={cx - r - 9} y={cy + 11} fontSize={8} fill={subText}>-1</text>
        <text x={cx + 4} y={cy - r + 3} fontSize={8} fill={subText}>1</text>
        <text x={cx + 4} y={cy + r + 3} fontSize={8} fill={subText}>-1</text>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={bright} strokeWidth={1.5} />
        {/* reference triangle */}
        <polygon
          points={`${cx},${cy} ${px},${cy} ${px},${py}`}
          fill="rgba(167,139,250,0.15)"
          stroke="rgba(167,139,250,0.4)"
          strokeWidth={1}
        />
        {/* radius line */}
        <line x1={cx} y1={cy} x2={px} y2={py} stroke={bright} strokeWidth={1.5} />
        {/* extended radius line (to x=1) */}
        {tanTopY !== null && (
          <line
            x1={cx} y1={cy}
            x2={tanX} y2={tanTopY}
            stroke="rgba(245,158,11,0.4)"
            strokeWidth={1}
            strokeDasharray="3,2"
          />
        )}
        {/* cosine (horizontal) */}
        {show.cos && (
          <line x1={cx} y1={cy} x2={px} y2={cy} stroke={cosColor} strokeWidth={3} />
        )}
        {/* sine (vertical) */}
        {show.sin && (
          <line x1={px} y1={cy} x2={px} y2={py} stroke={sinColor} strokeWidth={3} />
        )}
        {/* tangent */}
        {show.tan && tanTopY !== null && (
          <line
            x1={tanX} y1={cy}
            x2={tanX} y2={tanTopY}
            stroke={tanColor}
            strokeWidth={3}
          />
        )}
        {/* point on circle */}
        <circle cx={px} cy={py} r={5} fill={accentText} stroke={bright} strokeWidth={1.5} />
        <text x={cx + 12} y={cy - 6} fontSize={10} fill={subText}>{angle}°</text>
        <text x={px + 6} y={py - 4} fontSize={9} fill={accentText}>({cosV.toFixed(2)}, {sinV.toFixed(2)})</text>
      </svg>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <span style={{ fontSize: 10, color: subText, minWidth: 56 }}>θ = {angle}°</span>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={angle}
          onChange={(e) => setAngle(parseInt(e.target.value))}
          style={{ flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'center' }}>
        <button onClick={() => setShow(s => ({ ...s, sin: !s.sin }))}
          style={{
            padding: '2px 10px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
            background: show.sin ? 'rgba(52,211,153,0.2)' : bg,
            border: '1px solid ' + (show.sin ? 'rgba(52,211,153,0.4)' : border),
            color: show.sin ? sinColor : text,
          }}>sin</button>
        <button onClick={() => setShow(s => ({ ...s, cos: !s.cos }))}
          style={{
            padding: '2px 10px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
            background: show.cos ? 'rgba(96,165,250,0.2)' : bg,
            border: '1px solid ' + (show.cos ? 'rgba(96,165,250,0.4)' : border),
            color: show.cos ? cosColor : text,
          }}>cos</button>
        <button onClick={() => setShow(s => ({ ...s, tan: !s.tan }))}
          style={{
            padding: '2px 10px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
            background: show.tan ? 'rgba(245,158,11,0.2)' : bg,
            border: '1px solid ' + (show.tan ? 'rgba(245,158,11,0.4)' : border),
            color: show.tan ? tanColor : text,
          }}>tan</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, marginTop: 6, fontSize: 10 }}>
        <div style={{ padding: '3px 5px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
          <div style={{ color: subText, fontSize: 8 }}>sin θ</div>
          <div style={{ color: sinColor, fontWeight: 700, fontFamily: 'monospace' }}>{fmt(sinV)}</div>
        </div>
        <div style={{ padding: '3px 5px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
          <div style={{ color: subText, fontSize: 8 }}>cos θ</div>
          <div style={{ color: cosColor, fontWeight: 700, fontFamily: 'monospace' }}>{fmt(cosV)}</div>
        </div>
        <div style={{ padding: '3px 5px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
          <div style={{ color: subText, fontSize: 8 }}>tan θ</div>
          <div style={{ color: tanColor, fontWeight: 700, fontFamily: 'monospace' }}>{fmt(tanV)}</div>
        </div>
        <div style={{ padding: '3px 5px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
          <div style={{ color: subText, fontSize: 8 }}>csc θ</div>
          <div style={{ color: bright, fontWeight: 700, fontFamily: 'monospace' }}>{fmt(cscV)}</div>
        </div>
        <div style={{ padding: '3px 5px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
          <div style={{ color: subText, fontSize: 8 }}>sec θ</div>
          <div style={{ color: bright, fontWeight: 700, fontFamily: 'monospace' }}>{fmt(secV)}</div>
        </div>
        <div style={{ padding: '3px 5px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
          <div style={{ color: subText, fontSize: 8 }}>cot θ</div>
          <div style={{ color: bright, fontWeight: 700, fontFamily: 'monospace' }}>{fmt(cotV)}</div>
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Angle θ = <b>{angle}°</b> (= <b>{radStr}</b> radians)</div>
        <div>Step 2: Point on circle: (cos {angle}°, sin {angle}°) = (<b>{cosV.toFixed(3)}</b>, <b>{sinV.toFixed(3)}</b>)</div>
        <div>Step 3: <span style={{ color: sinColor }}>sin({angle}°) = {sinV.toFixed(3)}</span> (vertical height above x-axis)</div>
        <div>Step 4: <span style={{ color: cosColor }}>cos({angle}°) = {cosV.toFixed(3)}</span> (horizontal distance right of y-axis)</div>
        <div>Step 5: <span style={{ color: tanColor }}>tan({angle}°) = sin/cos = {sinV.toFixed(3)}/{cosV.toFixed(3)} = {tanV === null ? 'undef' : tanV.toFixed(3)}</span></div>
        <div>Step 6: {angle === 45
          ? <span>At 45°, sin = cos (the line y = x bisects the first quadrant)</span>
          : angle === 90 || angle === 270
          ? <span>At {angle}°, cos = 0 → tan is <b style={{ color: '#ef4444' }}>undefined</b> (vertical asymptote!)</span>
          : angle === 0 || angle === 180 || angle === 360
          ? <span>At {angle}°, sin = 0 → csc is undefined; cos = ±1 (max magnitude)</span>
          : angle % 90 === 0
          ? <span>At {angle}°, this is a quadrant angle — one trig value is 0, another is ±1</span>
          : <span>sin and cos stay between -1 and 1 — they are lengths inside the unit circle</span>}</div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The unit circle makes trig visible. sin is the y-coordinate (height), cos is the x-coordinate (width), tan is the slope of the radius (sin/cos). tan blows up at 90° and 270° because cos = 0 there — these are the vertical asymptotes of y = tan(x). The other three (csc, sec, cot) are just reciprocals.
      </div>
    </div>
  )
}

// ---- Riemann Sum Explorer (HS 9-12) ----

const RIEMANN_PRESETS = [
  { id: 'x2', label: 'x²', fn: (x: number) => x * x, a: 0, b: 2, yMax: 4, exact: 8 / 3, exactStr: '8/3 ≈ 2.667' },
  { id: 'x3', label: 'x³', fn: (x: number) => x * x * x, a: 0, b: 2, yMax: 8, exact: 4, exactStr: '4' },
  { id: 'sin', label: 'sin(x)', fn: (x: number) => Math.sin(x), a: 0, b: Math.PI, yMax: 1.2, exact: 2, exactStr: '2' },
  { id: 'exp', label: 'eˣ', fn: (x: number) => Math.exp(x), a: 0, b: 2, yMax: 8, exact: Math.E * Math.E - 1, exactStr: 'e² − 1 ≈ 6.389' },
  { id: 'inv', label: '1/x', fn: (x: number) => 1 / x, a: 1, b: 2, yMax: 1.2, exact: Math.log(2), exactStr: 'ln 2 ≈ 0.693' },
]

type RiemannMethod = 'left' | 'right' | 'mid' | 'trap'

export function RiemannSumExplorer({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [presetIdx, setPresetIdx] = useState(0)
  const [N, setN] = useState(4)
  const [method, setMethod] = useState<RiemannMethod>('left')

  const preset = RIEMANN_PRESETS[presetIdx]
  const { a, b, yMax, exact } = preset
  const dx = (b - a) / N

  const samples: number[] = []
  for (let i = 0; i < N; i++) {
    let x: number
    if (method === 'left') x = a + i * dx
    else if (method === 'right') x = a + (i + 1) * dx
    else if (method === 'mid') x = a + (i + 0.5) * dx
    else x = a + i * dx
    samples.push(x)
  }

  let approx: number
  if (method === 'trap') {
    approx = 0
    for (let i = 0; i < N; i++) {
      const xl = a + i * dx
      const xr = a + (i + 1) * dx
      approx += (preset.fn(xl) + preset.fn(xr)) / 2 * dx
    }
  } else {
    approx = samples.reduce((s, x) => s + preset.fn(x) * dx, 0)
  }
  const error = approx - exact

  const svgW = 240, svgH = 130
  const marginL = 22, marginR = 8, marginT = 8, marginB = 18
  const plotW = svgW - marginL - marginR
  const plotH = svgH - marginT - marginB
  const xToPx = (x: number) => marginL + ((x - a) / (b - a)) * plotW
  const yToPx = (y: number) => marginT + plotH - (Math.max(0, Math.min(yMax, y)) / yMax) * plotH

  const funcPath: string[] = []
  for (let i = 0; i <= 80; i++) {
    const x = a + (i / 80) * (b - a)
    const y = preset.fn(x)
    if (i === 0) funcPath.push(`M ${xToPx(x).toFixed(2)} ${yToPx(y).toFixed(2)}`)
    else funcPath.push(`L ${xToPx(x).toFixed(2)} ${yToPx(y).toFixed(2)}`)
  }

  const rects: React.ReactNode[] = []
  for (let i = 0; i < N; i++) {
    const xLeft = a + i * dx
    const xRight = a + (i + 1) * dx
    if (method === 'trap') {
      const pxL = xToPx(xLeft)
      const pxR = xToPx(xRight)
      const pyBase = yToPx(0)
      const pyL = yToPx(preset.fn(xLeft))
      const pyR = yToPx(preset.fn(xRight))
      rects.push(
        <polygon key={i}
          points={`${pxL.toFixed(2)},${pyBase} ${pxL.toFixed(2)},${pyL.toFixed(2)} ${pxR.toFixed(2)},${pyR.toFixed(2)} ${pxR.toFixed(2)},${pyBase}`}
          fill="rgba(52,211,153,0.18)"
          stroke="rgba(52,211,153,0.5)"
          strokeWidth={0.8}
        />
      )
    } else {
      let h: number
      if (method === 'left') h = preset.fn(xLeft)
      else if (method === 'right') h = preset.fn(xRight)
      else h = preset.fn((xLeft + xRight) / 2)
      const pxL = xToPx(xLeft)
      const pxR = xToPx(xRight)
      const pyH = yToPx(h)
      const pyBase = yToPx(0)
      rects.push(
        <rect key={i}
          x={pxL} y={Math.min(pyH, pyBase)}
          width={pxR - pxL} height={Math.abs(pyBase - pyH)}
          fill="rgba(52,211,153,0.18)"
          stroke="rgba(52,211,153,0.5)"
          strokeWidth={0.8}
        />
      )
    }
  }

  const sampleStr = samples.slice(0, Math.min(N, 5)).map(x => x.toFixed(2)).join(', ')
  const moreStr = N > 5 ? ', ...' : ''

  const sumParts: string[] = []
  for (let i = 0; i < Math.min(N, 4); i++) {
    const x = samples[i]
    sumParts.push(`f(${x.toFixed(2)})·${dx.toFixed(2)}`)
  }
  const sumStr = sumParts.join(' + ') + (N > 4 ? ' + ...' : '')

  const methodLabel = method === 'mid' ? 'Midpoint' : method === 'trap' ? 'Trapezoid' : method.charAt(0).toUpperCase() + method.slice(1)
  const bLabel = b === Math.PI ? 'π' : b.toFixed(1)

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: subText, alignSelf: 'center', marginRight: 2 }}>f(x) =</span>
        {RIEMANN_PRESETS.map((p, i) => (
          <button key={p.id} onClick={() => setPresetIdx(i)}
            style={{
              padding: '2px 6px', fontSize: 9, borderRadius: 3, cursor: 'pointer',
              background: i === presetIdx ? 'rgba(52,211,153,0.18)' : bg,
              border: '1px solid ' + (i === presetIdx ? 'rgba(52,211,153,0.4)' : border),
              color: i === presetIdx ? accentText : text,
            }}>{p.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {(['left', 'right', 'mid', 'trap'] as RiemannMethod[]).map(m => (
          <button key={m} onClick={() => setMethod(m)}
            style={{
              flex: 1, padding: '3px 4px', fontSize: 9, borderRadius: 3, cursor: 'pointer',
              background: m === method ? 'rgba(52,211,153,0.18)' : bg,
              border: '1px solid ' + (m === method ? 'rgba(52,211,153,0.4)' : border),
              color: m === method ? accentText : text,
            }}>{m === 'mid' ? 'Midpt' : m === 'trap' ? 'Trap' : m.charAt(0).toUpperCase() + m.slice(1)}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: subText, minWidth: 50 }}>N = {N}</span>
        <input type="range" min={1} max={50} value={N}
          onChange={(e) => setN(parseInt(e.target.value))}
          style={{ flex: 1 }} />
      </div>

      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', margin: '0 auto' }}>
        <line x1={marginL} y1={marginT + plotH} x2={svgW - marginR} y2={marginT + plotH} stroke={subText} strokeWidth={0.8} />
        <line x1={marginL} y1={marginT} x2={marginL} y2={marginT + plotH} stroke={subText} strokeWidth={0.8} />
        {rects}
        <path d={funcPath.join(' ')} fill="none" stroke={accentText} strokeWidth={1.5} />
        <text x={marginL} y={marginT + plotH + 12} fontSize={8} fill={subText} textAnchor="middle">{a.toFixed(1)}</text>
        <text x={svgW - marginR} y={marginT + plotH + 12} fontSize={8} fill={subText} textAnchor="middle">{bLabel}</text>
      </svg>

      <div style={{ display: 'flex', gap: 4, marginTop: 4, fontSize: 10 }}>
        <div style={{ flex: 1, padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
          <div style={{ color: subText, fontSize: 8 }}>Approx</div>
          <div style={{ color: accentText, fontWeight: 700, fontFamily: 'monospace' }}>{approx.toFixed(4)}</div>
        </div>
        <div style={{ flex: 1, padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
          <div style={{ color: subText, fontSize: 8 }}>Exact</div>
          <div style={{ color: bright, fontWeight: 700, fontFamily: 'monospace' }}>{exact.toFixed(4)}</div>
        </div>
        <div style={{ flex: 1, padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
          <div style={{ color: subText, fontSize: 8 }}>Error</div>
          <div style={{ color: error < 0 ? '#f59e0b' : '#a78bfa', fontWeight: 700, fontFamily: 'monospace' }}>{error.toFixed(4)}</div>
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Function: f(x) = <b>{preset.label}</b> on interval [{a.toFixed(1)}, {bLabel}]</div>
        <div>Step 2: Method: <b>{methodLabel}</b> Riemann sum, N = <b>{N}</b> rectangles</div>
        <div>Step 3: Width of each rectangle: Δx = ({bLabel} − {a.toFixed(1)})/{N} = <b>{dx.toFixed(3)}</b></div>
        <div>Step 4: Sample x-values: <b>{sampleStr}{moreStr}</b></div>
        <div>Step 5: Sum: <b>{sumStr}</b> = <b style={{ color: accentText }}>{approx.toFixed(4)}</b></div>
        <div>Step 6: Exact integral = {preset.exactStr} | Error = <b style={{ color: error < 0 ? '#f59e0b' : '#a78bfa' }}>{error.toFixed(4)}</b> {error < -0.001 ? '(underestimate)' : error > 0.001 ? '(overestimate)' : '(very close!)'}</div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The integral is the LIMIT of Riemann sums as N → ∞. As you increase N, the rectangles fill the area under the curve, and the sum approaches the exact integral. Midpoint and Trapezoid methods converge faster than Left/Right because they sample more representative points and (for trapezoid) connect the tops with a slanted edge instead of a flat one.
      </div>
    </div>
  )
}

// ---- Conic Sections Explorer (HS 9-12) ----

type ConicType = 'circle' | 'ellipse' | 'parabola' | 'hyperbola'

export function ConicSectionsExplorer({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [type, setType] = useState<ConicType>('ellipse')
  const [a, setA] = useState(3)
  const [b, setB] = useState(2)
  const [p, setP] = useState(1)
  const [r, setR] = useState(2)

  const coneSvgW = 240, coneSvgH = 120
  const apexX = 120, apexY = 60
  const coneSpread = 50
  const coneH = 45

  let planeX1 = 30, planeY1 = 60, planeX2 = 210, planeY2 = 60
  if (type === 'circle') {
    planeX1 = 30; planeX2 = 210
    planeY1 = 90; planeY2 = 90
  } else if (type === 'ellipse') {
    planeX1 = 30; planeX2 = 210
    planeY1 = 45; planeY2 = 100
  } else if (type === 'parabola') {
    planeX1 = 60; planeX2 = 210
    planeY1 = 100; planeY2 = 30
  } else {
    planeX1 = 80; planeX2 = 160
    planeY1 = 20; planeY2 = 100
  }

  const curveSvgW = 240, curveSvgH = 120
  const ccx = 120, ccy = 60, cscale = 18

  let curvePath = ''
  const vertices: { x: number, y: number }[] = []
  const foci: { x: number, y: number }[] = []
  const asymptotes: string[] = []

  if (type === 'circle') {
    const rr = r * cscale
    curvePath = `M ${ccx + rr} ${ccy} A ${rr} ${rr} 0 1 1 ${ccx - rr} ${ccy} A ${rr} ${rr} 0 1 1 ${ccx + rr} ${ccy}`
    foci.push({ x: ccx, y: ccy })
  } else if (type === 'ellipse') {
    const aa = a * cscale, bb = b * cscale
    curvePath = `M ${ccx + aa} ${ccy} A ${aa} ${bb} 0 1 1 ${ccx - aa} ${ccy} A ${aa} ${bb} 0 1 1 ${ccx + aa} ${ccy}`
    vertices.push(
      { x: ccx + aa, y: ccy }, { x: ccx - aa, y: ccy },
      { x: ccx, y: ccy - bb }, { x: ccx, y: ccy + bb },
    )
    const c = Math.sqrt(Math.abs(a * a - b * b))
    foci.push({ x: ccx + c * cscale, y: ccy }, { x: ccx - c * cscale, y: ccy })
  } else if (type === 'parabola') {
    const pts: string[] = []
    for (let i = -30; i <= 30; i++) {
      const yv = i / 10
      const xv = (yv * yv) / (4 * p)
      const sx = ccx + xv * cscale
      if (sx > curveSvgW) continue
      pts.push(`${sx.toFixed(2)},${(ccy - yv * cscale).toFixed(2)}`)
    }
    curvePath = `M ${pts.join(' L ')}`
    foci.push({ x: ccx + p * cscale, y: ccy })
    vertices.push({ x: ccx, y: ccy })
  } else {
    const rightPts: string[] = []
    const leftPts: string[] = []
    for (let i = -25; i <= 25; i++) {
      const t = i / 8
      const xv = a * Math.cosh(t)
      const yv = b * Math.sinh(t)
      const sx = ccx + xv * cscale
      if (sx > curveSvgW) continue
      rightPts.push(`${sx.toFixed(2)},${(ccy - yv * cscale).toFixed(2)}`)
      leftPts.push(`${(ccx - xv * cscale).toFixed(2)},${(ccy - yv * cscale).toFixed(2)}`)
    }
    curvePath = `M ${rightPts.join(' L ')} M ${leftPts.join(' L ')}`
    const c = Math.sqrt(a * a + b * b)
    foci.push({ x: ccx + c * cscale, y: ccy }, { x: ccx - c * cscale, y: ccy })
    vertices.push({ x: ccx + a * cscale, y: ccy }, { x: ccx - a * cscale, y: ccy })
    const slope = b / a
    asymptotes.push(`M 0 ${ccy + slope * ccx} L ${curveSvgW} ${ccy - slope * (curveSvgW - ccx)}`)
    asymptotes.push(`M 0 ${ccy - slope * ccx} L ${curveSvgW} ${ccy + slope * (curveSvgW - ccx)}`)
  }

  const ellipseC = Math.sqrt(Math.abs(a * a - b * b))
  const ellipseEcc = a > 0 ? ellipseC / a : 0
  const hyperbolaC = Math.sqrt(a * a + b * b)
  const hyperbolaEcc = a > 0 ? hyperbolaC / a : 0

  const sliceDesc = type === 'circle' ? 'horizontal (perpendicular to cone axis)'
    : type === 'ellipse' ? 'shallow (tilted, not parallel to slant)'
    : type === 'parabola' ? 'parallel to slant of one nappe'
    : 'steep (steeper than slant, cuts both nappes)'

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {(['circle', 'ellipse', 'parabola', 'hyperbola'] as ConicType[]).map(t => (
          <button key={t} onClick={() => setType(t)}
            style={{
              flex: 1, padding: '3px 4px', fontSize: 9, borderRadius: 3, cursor: 'pointer',
              background: t === type ? 'rgba(52,211,153,0.18)' : bg,
              border: '1px solid ' + (t === type ? 'rgba(52,211,153,0.4)' : border),
              color: t === type ? accentText : text,
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
        {type === 'circle' && (
          <label style={{ fontSize: 10, color: subText, display: 'flex', alignItems: 'center', gap: 4 }}>
            r = {r.toFixed(1)}
            <input type="range" min={1} max={4} step={0.1} value={r}
              onChange={(e) => setR(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
        )}
        {(type === 'ellipse' || type === 'hyperbola') && (
          <>
            <label style={{ fontSize: 10, color: subText, display: 'flex', alignItems: 'center', gap: 4 }}>
              a = {a.toFixed(1)}
              <input type="range" min={1} max={4} step={0.1} value={a}
                onChange={(e) => setA(parseFloat(e.target.value))} style={{ width: 70 }} />
            </label>
            <label style={{ fontSize: 10, color: subText, display: 'flex', alignItems: 'center', gap: 4 }}>
              b = {b.toFixed(1)}
              <input type="range" min={1} max={4} step={0.1} value={b}
                onChange={(e) => setB(parseFloat(e.target.value))} style={{ width: 70 }} />
            </label>
          </>
        )}
        {type === 'parabola' && (
          <label style={{ fontSize: 10, color: subText, display: 'flex', alignItems: 'center', gap: 4 }}>
            p = {p.toFixed(1)}
            <input type="range" min={0.5} max={3} step={0.1} value={p}
              onChange={(e) => setP(parseFloat(e.target.value))} style={{ width: 90 }} />
          </label>
        )}
      </div>

      <div style={{ fontSize: 9, color: subText, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cone + Slicing Plane</div>
      <svg width={coneSvgW} height={coneSvgH} viewBox={`0 0 ${coneSvgW} ${coneSvgH}`} style={{ display: 'block', margin: '0 auto' }}>
        <polygon points={`${apexX - coneSpread},${apexY - coneH} ${apexX + coneSpread},${apexY - coneH} ${apexX},${apexY}`}
          fill="rgba(148,163,184,0.1)" stroke={subText} strokeWidth={1} />
        <polygon points={`${apexX - coneSpread},${apexY + coneH} ${apexX + coneSpread},${apexY + coneH} ${apexX},${apexY}`}
          fill="rgba(148,163,184,0.1)" stroke={subText} strokeWidth={1} />
        <line x1={apexX} y1={apexY - coneH - 5} x2={apexX} y2={apexY + coneH + 5}
          stroke={subText} strokeWidth={0.5} strokeDasharray="2,2" />
        <line x1={planeX1} y1={planeY1} x2={planeX2} y2={planeY2}
          stroke={accentText} strokeWidth={2.5} />
        <text x={planeX2 - 4} y={planeY2 - 5} fontSize={8} fill={accentText} textAnchor="end">plane</text>
        <circle cx={apexX} cy={apexY} r={2} fill={subText} />
      </svg>

      <div style={{ fontSize: 9, color: subText, marginBottom: 2, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resulting Curve</div>
      <svg width={curveSvgW} height={curveSvgH} viewBox={`0 0 ${curveSvgW} ${curveSvgH}`} style={{ display: 'block', margin: '0 auto' }}>
        <line x1={0} y1={ccy} x2={curveSvgW} y2={ccy} stroke={subText} strokeWidth={0.5} />
        <line x1={ccx} y1={0} x2={ccx} y2={curveSvgH} stroke={subText} strokeWidth={0.5} />
        {asymptotes.map((d, i) => (
          <path key={i} d={d} stroke="rgba(167,139,250,0.5)" strokeWidth={0.8} strokeDasharray="2,2" fill="none" />
        ))}
        <path d={curvePath} fill="none" stroke={accentText} strokeWidth={1.8} />
        {vertices.map((v, i) => (
          <circle key={i} cx={v.x} cy={v.y} r={3} fill={accentText} />
        ))}
        {foci.map((f, i) => (
          <g key={i}>
            <circle cx={f.x} cy={f.y} r={2.5} fill="rgba(167,139,250,0.9)" />
            <text x={f.x + 4} y={f.y - 4} fontSize={7} fill="#a78bfa">F</text>
          </g>
        ))}
      </svg>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Slice angle: <b>{sliceDesc}</b> → <b style={{ color: accentText }}>{type.charAt(0).toUpperCase() + type.slice(1)}</b></div>
        {type === 'circle' && (
          <>
            <div>Step 2: Standard form: x² + y² = r²</div>
            <div>Step 3: r = <b>{r.toFixed(1)}</b> (radius)</div>
            <div>Step 4: Center: (0, 0); all points equidistant from center</div>
            <div>Step 5: Eccentricity e = <b>0</b> (a circle is a special ellipse with a = b)</div>
            <div>Step 6: This is the only slice parallel to the cone&apos;s base</div>
          </>
        )}
        {type === 'ellipse' && (
          <>
            <div>Step 2: Standard form: x²/a² + y²/b² = 1</div>
            <div>Step 3: a = <b>{a.toFixed(1)}</b> (semi-major), b = <b>{b.toFixed(1)}</b> (semi-minor)</div>
            <div>Step 4: Vertices: (±{a.toFixed(1)}, 0) and (0, ±{b.toFixed(1)})</div>
            <div>Step 5: Foci: c = √(a² − b²) = √({(a * a).toFixed(1)} − {(b * b).toFixed(1)}) = <b>{ellipseC.toFixed(2)}</b> → foci at (±{ellipseC.toFixed(2)}, 0)</div>
            <div>Step 6: Eccentricity e = c/a = {ellipseC.toFixed(2)}/{a.toFixed(1)} = <b>{ellipseEcc.toFixed(2)}</b> (between 0 and 1 = ellipse)</div>
          </>
        )}
        {type === 'parabola' && (
          <>
            <div>Step 2: Standard form: y² = 4px (opens right)</div>
            <div>Step 3: p = <b>{p.toFixed(1)}</b> (focal length — vertex to focus)</div>
            <div>Step 4: Vertex at (0, 0); Focus at ({p.toFixed(1)}, 0); Directrix: x = −{p.toFixed(1)}</div>
            <div>Step 5: Parabola = points equidistant from focus &amp; directrix</div>
            <div>Step 6: Eccentricity e = <b>1</b> (boundary between ellipse and hyperbola)</div>
          </>
        )}
        {type === 'hyperbola' && (
          <>
            <div>Step 2: Standard form: x²/a² − y²/b² = 1 (opens left/right)</div>
            <div>Step 3: a = <b>{a.toFixed(1)}</b> (semi-transverse), b = <b>{b.toFixed(1)}</b> (semi-conjugate)</div>
            <div>Step 4: Vertices: (±{a.toFixed(1)}, 0); asymptotes: y = ±(b/a)x = ±({b.toFixed(1)}/{a.toFixed(1)})x</div>
            <div>Step 5: Foci: c = √(a² + b²) = √({(a * a).toFixed(1)} + {(b * b).toFixed(1)}) = <b>{hyperbolaC.toFixed(2)}</b> → foci at (±{hyperbolaC.toFixed(2)}, 0)</div>
            <div>Step 6: Eccentricity e = c/a = {hyperbolaC.toFixed(2)}/{a.toFixed(1)} = <b>{hyperbolaEcc.toFixed(2)}</b> (greater than 1 = hyperbola)</div>
          </>
        )}
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> All four conic sections come from slicing ONE cone at different angles. Eccentricity e tells you which: e = 0 (circle), 0 &lt; e &lt; 1 (ellipse), e = 1 (parabola), e &gt; 1 (hyperbola). The same geometry gives us circles, planetary orbits (ellipses), comet paths (parabolas), and orbital escape trajectories (hyperbolas).
      </div>
    </div>
  )
}

// ---- Logarithm Scale Explorer (HS 9-12) ----

export function LogarithmScaleExplorer({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [base, setBase] = useState<10 | 2 | 'e'>(10)
  const [x, setX] = useState(3)

  const baseNum = base === 'e' ? Math.E : base
  const baseStr = base === 'e' ? 'e' : String(base)
  const maxX = 4
  const powerVal = Math.pow(baseNum, x)

  const svgW = 240, svgH = 30
  const marginL = 30, marginR = 10
  const lineW = svgW - marginL - marginR

  const linToPx = (xv: number) => marginL + (xv / maxX) * lineW

  const fmtTick = (v: number) => {
    if (v >= 10000) return (v / 1000).toFixed(0) + 'k'
    if (v >= 1000) return (v / 1000).toFixed(1) + 'k'
    if (Number.isInteger(v)) return v.toString()
    if (v < 10) return v.toFixed(2)
    return v.toFixed(1)
  }

  const fmtVal = (v: number) => {
    if (v >= 10000) return v.toExponential(2)
    if (v >= 100) return v.toFixed(1)
    if (v >= 10) return v.toFixed(2)
    return v.toFixed(3)
  }

  const logTicks = [0, 1, 2, 3, 4].map(i => ({
    px: linToPx(i),
    val: Math.pow(baseNum, i),
  }))

  const logPtrPx = linToPx(x)

  const gW = 240, gH = 80
  const gML = 24, gMR = 8, gMT = 6, gMB = 16
  const plotW2 = gW - gML - gMR
  const plotH2 = gH - gMT - gMB
  const yMaxG = Math.pow(baseNum, maxX)
  const gXToPx = (xv: number) => gML + (xv / maxX) * plotW2
  const gYToPx = (yv: number) => gMT + plotH2 - (yv / yMaxG) * plotH2

  const curvePts: string[] = []
  for (let i = 0; i <= 60; i++) {
    const xv = (i / 60) * maxX
    const yv = Math.pow(baseNum, xv)
    curvePts.push(`${gXToPx(xv).toFixed(2)},${gYToPx(yv).toFixed(2)}`)
  }
  const curvePath = `M ${curvePts.join(' L ')}`

  const ptX = gXToPx(x)
  const ptY = gYToPx(powerVal)
  const pctPos = (x / maxX * 100).toFixed(0)

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: subText, alignSelf: 'center', marginRight: 2 }}>Base:</span>
        {([10, 2, 'e'] as const).map(b => (
          <button key={String(b)} onClick={() => setBase(b)}
            style={{
              padding: '2px 10px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
              background: b === base ? 'rgba(52,211,153,0.18)' : bg,
              border: '1px solid ' + (b === base ? 'rgba(52,211,153,0.4)' : border),
              color: b === base ? accentText : text,
            }}>{b === 'e' ? 'e' : b}</button>
        ))}
      </div>

      <div style={{ fontSize: 9, color: subText, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Linear Scale (exponent x)</div>
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', margin: '0 auto' }}>
        <line x1={marginL} y1={15} x2={svgW - marginR} y2={15} stroke={subText} strokeWidth={1} />
        {[0, 1, 2, 3, 4].map(i => (
          <g key={i}>
            <line x1={linToPx(i)} y1={11} x2={linToPx(i)} y2={19} stroke={subText} strokeWidth={1} />
            <text x={linToPx(i)} y={28} fontSize={8} fill={subText} textAnchor="middle">{i}</text>
          </g>
        ))}
        <line x1={linToPx(x)} y1={5} x2={linToPx(x)} y2={25} stroke={accentText} strokeWidth={2} />
        <circle cx={linToPx(x)} cy={15} r={4} fill={accentText} />
      </svg>

      <div style={{ fontSize: 9, color: subText, marginBottom: 2, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Log Scale (values bˣ)</div>
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', margin: '0 auto' }}>
        <line x1={marginL} y1={15} x2={svgW - marginR} y2={15} stroke={subText} strokeWidth={1} />
        {logTicks.map((t, i) => (
          <g key={i}>
            <line x1={t.px} y1={11} x2={t.px} y2={19} stroke={subText} strokeWidth={1} />
            <text x={t.px} y={28} fontSize={8} fill={subText} textAnchor="middle">{fmtTick(t.val)}</text>
          </g>
        ))}
        <line x1={logPtrPx} y1={5} x2={logPtrPx} y2={25} stroke={accentText} strokeWidth={2} />
        <circle cx={logPtrPx} cy={15} r={4} fill={accentText} />
      </svg>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <span style={{ fontSize: 10, color: subText, minWidth: 50 }}>x = {x.toFixed(2)}</span>
        <input type="range" min={0} max={maxX} step={0.05} value={x}
          onChange={(e) => setX(parseFloat(e.target.value))}
          style={{ flex: 1 }} />
      </div>

      <div style={{ fontSize: 9, color: subText, marginBottom: 2, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>y = {baseStr}ˣ</div>
      <svg width={gW} height={gH} viewBox={`0 0 ${gW} ${gH}`} style={{ display: 'block', margin: '0 auto' }}>
        <line x1={gML} y1={gMT + plotH2} x2={gW - gMR} y2={gMT + plotH2} stroke={subText} strokeWidth={0.8} />
        <line x1={gML} y1={gMT} x2={gML} y2={gMT + plotH2} stroke={subText} strokeWidth={0.8} />
        <path d={curvePath} fill="none" stroke={accentText} strokeWidth={1.5} />
        <line x1={ptX} y1={gMT + plotH2} x2={ptX} y2={ptY} stroke="rgba(167,139,250,0.5)" strokeWidth={0.8} strokeDasharray="2,2" />
        <line x1={gML} y1={ptY} x2={ptX} y2={ptY} stroke="rgba(167,139,250,0.5)" strokeWidth={0.8} strokeDasharray="2,2" />
        <circle cx={ptX} cy={ptY} r={3.5} fill={accentText} />
        <text x={gML - 2} y={gMT + 6} fontSize={8} fill={subText} textAnchor="end">{fmtVal(yMaxG)}</text>
        <text x={gML - 2} y={gMT + plotH2} fontSize={8} fill={subText} textAnchor="end">1</text>
        <text x={gML} y={gMT + plotH2 + 12} fontSize={8} fill={subText} textAnchor="middle">0</text>
        <text x={gW - gMR} y={gMT + plotH2 + 12} fontSize={8} fill={subText} textAnchor="middle">{maxX}</text>
      </svg>

      <div style={{ display: 'flex', gap: 4, marginTop: 4, fontSize: 10 }}>
        <div style={{ flex: 1, padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
          <div style={{ color: subText, fontSize: 8 }}>{baseStr}ˣ</div>
          <div style={{ color: accentText, fontWeight: 700, fontFamily: 'monospace' }}>{fmtVal(powerVal)}</div>
        </div>
        <div style={{ flex: 1, padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
          <div style={{ color: subText, fontSize: 8 }}>log_{baseStr}({fmtVal(powerVal)})</div>
          <div style={{ color: bright, fontWeight: 700, fontFamily: 'monospace' }}>{x.toFixed(3)}</div>
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Base = <b>{baseStr}</b>, Input x = <b>{x.toFixed(2)}</b></div>
        <div>Step 2: Exponential form: <b>{baseStr}^{x.toFixed(2)} = {fmtVal(powerVal)}</b></div>
        <div>Step 3: Logarithm form: <b>log_{baseStr}({fmtVal(powerVal)}) = {x.toFixed(2)}</b></div>
        <div>Step 4: These are inverses: log_{baseStr}({baseStr}ˣ) = x and {baseStr}^(log_{baseStr} y) = y</div>
        <div>Step 5: On linear scale: {x.toFixed(2)} sits at position <b>{pctPos}%</b> of the line</div>
        <div>Step 6: On log scale: {fmtVal(powerVal)} sits at the same <b>{pctPos}%</b> — log turns multiplication into addition!</div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A logarithm is just an exponent in reverse. log_b(y) asks &quot;what power of b gives y?&quot; Log scales are everywhere — earthquake magnitudes (Richter), sound (decibels), pH, star brightness — because they compress huge ranges (1 to 1,000,000) into manageable numbers (0 to 6). The key property: log(ab) = log(a) + log(b).
      </div>
    </div>
  )
}

// ---- Sequence & Series Explorer (HS 9-12) ----

type SeqType = 'arithmetic' | 'geometric' | 'recursive'

export function SequenceSeriesExplorer({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [type, setType] = useState<SeqType>('arithmetic')
  const [a1, setA1] = useState(3)
  const [d, setD] = useState(4)
  const [N, setN] = useState(5)

  const terms: number[] = []
  for (let n = 0; n < 10; n++) {
    if (type === 'arithmetic') {
      terms.push(a1 + n * d)
    } else if (type === 'geometric') {
      terms.push(a1 * Math.pow(d, n))
    } else {
      if (n === 0) terms.push(a1)
      else terms.push(terms[n - 1] + (n + 1))
    }
  }

  let formula = ''
  if (type === 'arithmetic') {
    formula = `aₙ = ${a1} + (n−1)·${d} = ${d}n + ${a1 - d}`
  } else if (type === 'geometric') {
    formula = `aₙ = ${a1}·${d}^(n−1)`
  } else {
    formula = `aₙ = aₙ₋₁ + n,  a₁ = ${a1}`
  }

  let sumN = 0
  let sumFormula = ''
  if (type === 'arithmetic') {
    sumN = N * (a1 + terms[N - 1]) / 2
    sumFormula = `Sₙ = n·(a₁ + aₙ)/2 = ${N}·(${a1} + ${terms[N - 1]})/2 = ${N}·${(a1 + terms[N - 1]) / 2} = ${sumN}`
  } else if (type === 'geometric') {
    if (d === 1) {
      sumN = N * a1
      sumFormula = `Sₙ = n·a₁ (since r=1) = ${N}·${a1} = ${sumN}`
    } else {
      sumN = a1 * (1 - Math.pow(d, N)) / (1 - d)
      sumFormula = `Sₙ = a₁·(1 − rⁿ)/(1 − r) = ${a1}·(1 − ${d}^${N})/(1 − ${d}) = ${sumN.toFixed(2)}`
    }
  } else {
    sumN = terms.slice(0, N).reduce((s, t) => s + t, 0)
    sumFormula = `Sₙ = ${terms.slice(0, N).join(' + ')} = ${sumN}`
  }

  const svgW = 240, svgH = 100
  const marginL = 8, marginR = 8, marginT = 8, marginB = 18
  const plotW = svgW - marginL - marginR
  const plotH = svgH - marginT - marginB
  const barW = plotW / 10 * 0.7
  const gap = plotW / 10 * 0.3
  const maxTerm = Math.max(...terms.map(Math.abs), 1)
  const minTerm = Math.min(...terms, 0)
  const range = maxTerm - minTerm || 1
  const zeroY = marginT + plotH - (0 - minTerm) / range * plotH

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
  const secondParam = type === 'arithmetic' ? `common difference d = ${d}` : type === 'geometric' ? `common ratio r = ${d}` : `recursive rule: aₙ = aₙ₋₁ + n`

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {(['arithmetic', 'geometric', 'recursive'] as SeqType[]).map(t => (
          <button key={t} onClick={() => setType(t)}
            style={{
              flex: 1, padding: '3px 4px', fontSize: 9, borderRadius: 3, cursor: 'pointer',
              background: t === type ? 'rgba(52,211,153,0.18)' : bg,
              border: '1px solid ' + (t === type ? 'rgba(52,211,153,0.4)' : border),
              color: t === type ? accentText : text,
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 10, color: subText, display: 'flex', alignItems: 'center', gap: 4 }}>
          a₁ = {a1}
          <input type="range" min={-10} max={10} step={1} value={a1}
            onChange={(e) => setA1(parseInt(e.target.value))} style={{ width: 70 }} />
        </label>
        {type !== 'recursive' && (
          <label style={{ fontSize: 10, color: subText, display: 'flex', alignItems: 'center', gap: 4 }}>
            {type === 'arithmetic' ? 'd' : 'r'} = {d}
            <input type="range" min={-5} max={5} step={1} value={d}
              onChange={(e) => setD(parseInt(e.target.value))} style={{ width: 70 }} />
          </label>
        )}
      </div>

      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', margin: '0 auto' }}>
        <line x1={marginL} y1={zeroY} x2={svgW - marginR} y2={zeroY} stroke={subText} strokeWidth={0.4} strokeDasharray="2,2" />
        {terms.map((t, i) => {
          const barX = marginL + i * (barW + gap) + gap / 2
          const isHighlighted = i < N
          const barTopY = marginT + plotH - (t - minTerm) / range * plotH
          return (
            <g key={i}>
              <rect
                x={barX}
                y={Math.min(zeroY, barTopY)}
                width={barW}
                height={Math.abs(zeroY - barTopY)}
                fill={isHighlighted ? 'rgba(52,211,153,0.55)' : 'rgba(52,211,153,0.2)'}
                stroke={isHighlighted ? accentText : 'rgba(52,211,153,0.4)'}
                strokeWidth={0.8}
              />
              <text x={barX + barW / 2} y={marginT + plotH + 12} fontSize={7} fill={subText} textAnchor="middle">{i + 1}</text>
            </g>
          )
        })}
      </svg>

      <div style={{ fontSize: 10, color: bright, fontFamily: 'monospace', marginTop: 4, lineHeight: 1.5, padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
        <span style={{ color: subText }}>Terms: </span>
        {terms.slice(0, 8).map((t, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: subText }}>, </span>}
            <span style={{ color: i < N ? accentText : subText }}>{t}</span>
          </span>
        ))}
        <span style={{ color: subText }}> ...</span>
      </div>

      <div style={{ fontSize: 10, color: bright, fontFamily: 'monospace', marginTop: 4, padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
        <span style={{ color: subText }}>Explicit: </span>{formula}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <span style={{ fontSize: 10, color: subText, minWidth: 60 }}>Sum n = {N}</span>
        <input type="range" min={1} max={10} value={N}
          onChange={(e) => setN(parseInt(e.target.value))}
          style={{ flex: 1 }} />
      </div>

      <div style={{ fontSize: 10, color: bright, fontFamily: 'monospace', marginTop: 4, padding: '4px 6px', background: bg, border: '1px solid ' + border, borderRadius: 3, lineHeight: 1.5 }}>
        <div><span style={{ color: subText }}>Sum formula: </span>{sumFormula}</div>
        <div><span style={{ color: subText }}>S_{N} = </span><b style={{ color: accentText }}>{sumN.toFixed(2)}</b></div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Sequence type: <b>{typeLabel}</b></div>
        <div>Step 2: First term a₁ = <b>{a1}</b>, {secondParam}</div>
        <div>Step 3: Explicit formula: <b>{formula}</b></div>
        <div>Step 4: First {N} terms: <b>{terms.slice(0, N).join(', ')}</b></div>
        <div>Step 5: Sum formula: <b>{sumFormula}</b></div>
        <div>Step 6: {type === 'arithmetic'
          ? <span>Pairing trick (Gauss): (a₁ + aₙ) + (a₂ + aₙ₋₁) + ... each pair = a₁ + aₙ = <b>{a1 + terms[N - 1]}</b></span>
          : type === 'geometric'
          ? <span>S = a₁ + a₁r + a₁r² + ... multiply by r, subtract: S − Sr = a₁(1 − rⁿ) → S = a₁(1 − rⁿ)/(1 − r)</span>
          : <span>Recursive sequences have no simple closed-form sum — add terms one at a time</span>}</div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Arithmetic sequences grow linearly (same add each step); geometric grow exponentially (same multiply). The arithmetic sum S = n(a₁+aₙ)/2 is Gauss&apos;s childhood trick — pair first with last, each pair has the same sum. The geometric formula comes from multiplying the sum by r and subtracting — the middle terms all cancel.
      </div>
    </div>
  )
}

// ---- Matrix Operations Explorer (HS 9-12) ----

type MatrixOp = 'add' | 'sub' | 'mul' | 'det' | 'inv'

export function MatrixOperationsExplorer({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const subText = isDark ? '#64748b' : '#94a3b8'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accentText = '#34d399'

  const [A, setA] = useState<string[][]>([['2', '1'], ['0', '3']])
  const [B, setB] = useState<string[][]>([['1', '0'], ['1', '2']])
  const [op, setOp] = useState<MatrixOp>('mul')

  const An = A.map(row => row.map(v => parseFloat(v) || 0))
  const Bn = B.map(row => row.map(v => parseFloat(v) || 0))

  const updateCell = (mat: 'A' | 'B', i: number, j: number, val: string) => {
    if (mat === 'A') setA(prev => prev.map((row, ri) => ri === i ? row.map((c, ci) => ci === j ? val : c) : row))
    else setB(prev => prev.map((row, ri) => ri === i ? row.map((c, ci) => ci === j ? val : c) : row))
  }

  const det = (m: number[][]) => m[0][0] * m[1][1] - m[0][1] * m[1][0]
  const detA = det(An)
  const detB = det(Bn)

  let result: number[][] | null = null
  let resultLabel = ''
  if (op === 'add') {
    result = [[An[0][0] + Bn[0][0], An[0][1] + Bn[0][1]], [An[1][0] + Bn[1][0], An[1][1] + Bn[1][1]]]
    resultLabel = 'A + B'
  } else if (op === 'sub') {
    result = [[An[0][0] - Bn[0][0], An[0][1] - Bn[0][1]], [An[1][0] - Bn[1][0], An[1][1] - Bn[1][1]]]
    resultLabel = 'A − B'
  } else if (op === 'mul') {
    result = [
      [An[0][0] * Bn[0][0] + An[0][1] * Bn[1][0], An[0][0] * Bn[0][1] + An[0][1] * Bn[1][1]],
      [An[1][0] * Bn[0][0] + An[1][1] * Bn[1][0], An[1][0] * Bn[0][1] + An[1][1] * Bn[1][1]],
    ]
    resultLabel = 'A × B'
  } else if (op === 'det') {
    result = null
    resultLabel = 'det(A), det(B)'
  } else if (op === 'inv') {
    if (Math.abs(detA) < 1e-9) {
      result = null
    } else {
      const inv = 1 / detA
      result = [[inv * An[1][1], inv * -An[0][1]], [inv * -An[1][0], inv * An[0][0]]]
    }
    resultLabel = 'A⁻¹'
  }

  const inputStyle: React.CSSProperties = {
    width: 30, padding: '2px 3px', fontSize: 11, textAlign: 'center',
    border: '1px solid ' + border, background: bg, color: bright,
    borderRadius: 3, outline: 'none', fontFamily: 'monospace',
  }

  const opSymbol = op === 'add' ? '+' : op === 'sub' ? '−' : op === 'mul' ? '×' : ''

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 9, color: subText, textAlign: 'center', marginBottom: 2 }}>A</div>
          <div style={{ display: 'inline-block', padding: '4px 6px', border: '1px solid ' + border, borderRadius: 4, background: bg }}>
            <div style={{ display: 'grid', gridTemplateColumns: '30px 30px', gap: 3 }}>
              {A.flat().map((v, idx) => (
                <input key={idx} type="number" value={v}
                  onChange={(e) => updateCell('A', Math.floor(idx / 2), idx % 2, e.target.value)}
                  style={inputStyle} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 16, color: subText, fontWeight: 700 }}>
          {opSymbol}
        </div>
        <div>
          <div style={{ fontSize: 9, color: subText, textAlign: 'center', marginBottom: 2 }}>B</div>
          <div style={{ display: 'inline-block', padding: '4px 6px', border: '1px solid ' + border, borderRadius: 4, background: bg }}>
            <div style={{ display: 'grid', gridTemplateColumns: '30px 30px', gap: 3 }}>
              {B.flat().map((v, idx) => (
                <input key={idx} type="number" value={v}
                  onChange={(e) => updateCell('B', Math.floor(idx / 2), idx % 2, e.target.value)}
                  style={inputStyle} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
        {(['add', 'sub', 'mul', 'det', 'inv'] as MatrixOp[]).map(o => (
          <button key={o} onClick={() => setOp(o)}
            style={{
              flex: 1, padding: '3px 4px', fontSize: 9, borderRadius: 3, cursor: 'pointer',
              background: o === op ? 'rgba(52,211,153,0.18)' : bg,
              border: '1px solid ' + (o === op ? 'rgba(52,211,153,0.4)' : border),
              color: o === op ? accentText : text,
              minWidth: 36,
            }}>{o === 'add' ? 'A+B' : o === 'sub' ? 'A−B' : o === 'mul' ? 'A×B' : o === 'det' ? 'det' : 'A⁻¹'}</button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
        {op === 'det' ? (
          <div style={{ display: 'flex', gap: 6, fontSize: 11, fontFamily: 'monospace' }}>
            <div style={{ padding: '4px 8px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
              <span style={{ color: subText }}>det(A) = </span>
              <b style={{ color: accentText }}>{detA}</b>
            </div>
            <div style={{ padding: '4px 8px', background: bg, border: '1px solid ' + border, borderRadius: 3 }}>
              <span style={{ color: subText }}>det(B) = </span>
              <b style={{ color: accentText }}>{detB}</b>
            </div>
          </div>
        ) : result === null ? (
          <div style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 3, color: '#ef4444', fontSize: 11 }}>
            A is singular (det = 0) — A⁻¹ does not exist
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 9, color: subText, textAlign: 'center', marginBottom: 2 }}>{resultLabel}</div>
            <div style={{ display: 'inline-block', padding: '4px 6px', border: '1px solid rgba(52,211,153,0.4)', borderRadius: 4, background: 'rgba(52,211,153,0.05)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '34px 34px', gap: 3 }}>
                {result.flat().map((v, idx) => (
                  <div key={idx} style={{
                    padding: '3px 3px', fontSize: 11, textAlign: 'center', fontFamily: 'monospace',
                    color: accentText, fontWeight: 700,
                  }}>{v.toFixed(2)}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: subText, marginBottom: 3 }}>How It Works</div>
        {op === 'add' && (
          <>
            <div>Step 1: Operation: A + B (element-wise addition)</div>
            <div>Step 2: A = [[{An[0][0]}, {An[0][1]}], [{An[1][0]}, {An[1][1]}]], B = [[{Bn[0][0]}, {Bn[0][1]}], [{Bn[1][0]}, {Bn[1][1]}]]</div>
            <div>Step 3: Add matching positions: A[i,j] + B[i,j]</div>
            <div>Step 4: Result[1,1] = {An[0][0]} + {Bn[0][0]} = <b style={{ color: accentText }}>{An[0][0] + Bn[0][0]}</b></div>
            <div>Step 5: Result[1,2] = {An[0][1]} + {Bn[0][1]} = <b style={{ color: accentText }}>{An[0][1] + Bn[0][1]}</b></div>
            <div>Step 6: Result[2,1] = {An[1][0]} + {Bn[1][0]} = <b style={{ color: accentText }}>{An[1][0] + Bn[1][0]}</b>, Result[2,2] = {An[1][1]} + {Bn[1][1]} = <b style={{ color: accentText }}>{An[1][1] + Bn[1][1]}</b></div>
          </>
        )}
        {op === 'sub' && (
          <>
            <div>Step 1: Operation: A − B (element-wise subtraction)</div>
            <div>Step 2: A = [[{An[0][0]}, {An[0][1]}], [{An[1][0]}, {An[1][1]}]], B = [[{Bn[0][0]}, {Bn[0][1]}], [{Bn[1][0]}, {Bn[1][1]}]]</div>
            <div>Step 3: Subtract matching positions: A[i,j] − B[i,j]</div>
            <div>Step 4: Result[1,1] = {An[0][0]} − {Bn[0][0]} = <b style={{ color: accentText }}>{An[0][0] - Bn[0][0]}</b></div>
            <div>Step 5: Result[1,2] = {An[0][1]} − {Bn[0][1]} = <b style={{ color: accentText }}>{An[0][1] - Bn[0][1]}</b></div>
            <div>Step 6: Result[2,1] = {An[1][0]} − {Bn[1][0]} = <b style={{ color: accentText }}>{An[1][0] - Bn[1][0]}</b>, Result[2,2] = {An[1][1]} − {Bn[1][1]} = <b style={{ color: accentText }}>{An[1][1] - Bn[1][1]}</b></div>
          </>
        )}
        {op === 'mul' && (
          <>
            <div>Step 1: Operation: A × B (matrix multiplication — NOT element-wise)</div>
            <div>Step 2: A = [[{An[0][0]}, {An[0][1]}], [{An[1][0]}, {An[1][1]}]], B = [[{Bn[0][0]}, {Bn[0][1]}], [{Bn[1][0]}, {Bn[1][1]}]]</div>
            <div>Step 3: Result[1,1] = row 1 of A · col 1 of B = ({An[0][0]})({Bn[0][0]}) + ({An[0][1]})({Bn[1][0]}) = <b style={{ color: accentText }}>{An[0][0] * Bn[0][0] + An[0][1] * Bn[1][0]}</b></div>
            <div>Step 4: Result[1,2] = row 1 of A · col 2 of B = ({An[0][0]})({Bn[0][1]}) + ({An[0][1]})({Bn[1][1]}) = <b style={{ color: accentText }}>{An[0][0] * Bn[0][1] + An[0][1] * Bn[1][1]}</b></div>
            <div>Step 5: Result[2,1] = row 2 of A · col 1 of B = ({An[1][0]})({Bn[0][0]}) + ({An[1][1]})({Bn[1][0]}) = <b style={{ color: accentText }}>{An[1][0] * Bn[0][0] + An[1][1] * Bn[1][0]}</b></div>
            <div>Step 6: Result[2,2] = row 2 of A · col 2 of B = ({An[1][0]})({Bn[0][1]}) + ({An[1][1]})({Bn[1][1]}) = <b style={{ color: accentText }}>{An[1][0] * Bn[0][1] + An[1][1] * Bn[1][1]}</b></div>
            <div>Step 7: A × B = [[{result![0][0]}, {result![0][1]}], [{result![1][0]}, {result![1][1]}]] | det(A) = {detA}, det(B) = {detB}</div>
          </>
        )}
        {op === 'det' && (
          <>
            <div>Step 1: Operation: Determinant (scalar value, only for square matrices)</div>
            <div>Step 2: A = [[{An[0][0]}, {An[0][1]}], [{An[1][0]}, {An[1][1]}]]</div>
            <div>Step 3: Formula for 2×2: det(A) = ad − bc (main diagonal − anti-diagonal)</div>
            <div>Step 4: det(A) = ({An[0][0]})({An[1][1]}) − ({An[0][1]})({An[1][0]}) = {An[0][0] * An[1][1]} − {An[0][1] * An[1][0]} = <b style={{ color: accentText }}>{detA}</b></div>
            <div>Step 5: det(B) = ({Bn[0][0]})({Bn[1][1]}) − ({Bn[0][1]})({Bn[1][0]}) = {Bn[0][0] * Bn[1][1]} − {Bn[0][1] * Bn[1][0]} = <b style={{ color: accentText }}>{detB}</b></div>
            <div>Step 6: |det(A)| = <b>{Math.abs(detA)}</b> = area scaling factor{detA < 0 ? ' (and flips orientation — negative det)' : ''}</div>
            <div>Step 7: If det = 0, the matrix squishes space into a line (no inverse exists)</div>
          </>
        )}
        {op === 'inv' && (
          <>
            <div>Step 1: Operation: A⁻¹ (inverse of A)</div>
            <div>Step 2: A = [[{An[0][0]}, {An[0][1]}], [{An[1][0]}, {An[1][1]}]], det(A) = {detA}</div>
            <div>Step 3: Inverse exists only if det(A) ≠ 0 {Math.abs(detA) < 1e-9 ? <span style={{ color: '#ef4444' }}>→ det = 0, NO INVERSE</span> : <span style={{ color: accentText }}>→ det ≠ 0, inverse exists ✓</span>}</div>
            <div>Step 4: Formula: A⁻¹ = (1/det) · [[d, −b], [−c, a]] where A = [[a, b], [c, d]]</div>
            <div>Step 5: Swap a,d and negate b,c: [[{An[1][1]}, {-An[0][1]}], [{-An[1][0]}, {An[0][0]}]]</div>
            <div>Step 6: Multiply by 1/det = 1/{detA} = <b style={{ color: accentText }}>{(1 / detA).toFixed(4)}</b></div>
            {result !== null && (
              <div>Step 7: A⁻¹ = [[{result[0][0].toFixed(3)}, {result[0][1].toFixed(3)}], [{result[1][0].toFixed(3)}, {result[1][1].toFixed(3)}]] (verify: A · A⁻¹ = I)</div>
            )}
          </>
        )}
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Matrix multiplication is row × column dot products — NOT element-wise. The determinant measures area scaling: |det(A)| is how much A stretches areas. If det = 0, A collapses 2D space into a line (no inverse can recover it). Order matters: A × B ≠ B × A in general.
      </div>
    </div>
  )
}