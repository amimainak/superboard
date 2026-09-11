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