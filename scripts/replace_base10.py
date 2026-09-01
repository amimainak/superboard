import sys

filepath = sys.argv[1]
with open(filepath, 'r') as f:
    lines = f.readlines()

# Replace lines 2316-2446 (0-indexed: 2315-2445) with new L3 Base-10 Blocks
new_code = '''// ============================================================
// L3 BASE-10 BLOCKS — Enhanced with regrouping, expanded form,
// number words, and trade-up/trade-down operations.
// ============================================================

export function CanvasBase10Blocks({ element, isDark }: CanvasWidgetProps) {
  var cfg = element.config as {
    ones?: number; tens?: number; hundreds?: number; thousands?: number
    showRegroup?: boolean; showExpanded?: boolean; showWords?: boolean
  }
  var ones = cfg.ones ?? 0
  var tens = cfg.tens ?? 0
  var hundreds = cfg.hundreds ?? 0
  var thousands = cfg.thousands ?? 0
  var showRegroup = cfg.showRegroup ?? false
  var showExpanded = cfg.showExpanded ?? true
  var showWords = cfg.showWords ?? false
  var updateConfig = useConfigUpdater(element.id)
  var s = ws(isDark)

  var total = thousands * 1000 + hundreds * 100 + tens * 10 + ones

  // ---- Regrouping logic ----
  var regroupUp = useCallback(function() {
    var o = ones, t = tens, h = hundreds, th = thousands
    while (o >= 10) { o -= 10; t += 1 }
    while (t >= 10) { t -= 10; h += 1 }
    while (h >= 10) { h -= 10; th += 1 }
    updateConfig({ ones: o, tens: t, hundreds: h, thousands: th })
  }, [ones, tens, hundreds, thousands, updateConfig])

  var regroupDown = useCallback(function() {
    var o = ones, t = tens, h = hundreds, th = thousands
    if (th > 0 && h < 10) { th -= 1; h += 10 }
    if (h > 0 && t < 10) { h -= 1; t += 10 }
    if (t > 0 && o < 10) { t -= 1; o += 10 }
    updateConfig({ ones: o, tens: t, hundreds: h, thousands: th })
  }, [ones, tens, hundreds, thousands, updateConfig])

  var setOnes = useCallback(function(v: number) {
    updateConfig({ ones: Math.max(0, Math.min(99, v)), tens: tens, hundreds: hundreds, thousands: thousands })
  }, [tens, hundreds, thousands, updateConfig])
  var setTens = useCallback(function(v: number) {
    updateConfig({ ones: ones, tens: Math.max(0, Math.min(99, v)), hundreds: hundreds, thousands: thousands })
  }, [ones, hundreds, thousands, updateConfig])
  var setHundreds = useCallback(function(v: number) {
    updateConfig({ ones: ones, tens: tens, hundreds: Math.max(0, Math.min(99, v)), thousands: thousands })
  }, [ones, tens, thousands, updateConfig])
  var setThousands = useCallback(function(v: number) {
    updateConfig({ ones: ones, tens: tens, hundreds: hundreds, thousands: Math.max(0, Math.min(9, v)) })
  }, [ones, tens, hundreds, updateConfig])

  var clearAll = useCallback(function() {
    updateConfig({ ones: 0, tens: 0, hundreds: 0, thousands: 0 })
  }, [updateConfig])

  var toggleRegroup = useCallback(function() { updateConfig({ showRegroup: !showRegroup }) }, [showRegroup, updateConfig])
  var toggleExpanded = useCallback(function() { updateConfig({ showExpanded: !showExpanded }) }, [showExpanded, updateConfig])
  var toggleWords = useCallback(function() { updateConfig({ showWords: !showWords }) }, [showWords, updateConfig])

  // ---- Visual config ----
  var blockStroke = isDark ? 'rgba(52,211,153,0.6)' : 'rgba(5,150,105,0.6)'
  var blockFill = isDark ? 'rgba(52,211,153,0.2)' : 'rgba(5,150,105,0.15)'
  var blockFillEmpty = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'

  function btnStyle(disabled?: boolean) {
    return {
      padding: '1px 6px' as const, borderRadius: 3, fontSize: 12,
      cursor: disabled ? 'not-allowed' as const : 'pointer' as const,
      background: s.surface, border: '1px solid ' + s.border,
      color: disabled ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : s.text,
      fontWeight: 700, lineHeight: '16px' as const, opacity: disabled ? 0.5 : 1,
    }
  }

  // Number word helper
  function numberToWords(n: number): string {
    if (n === 0) return 'zero'
    if (n < 0) return 'negative ' + numberToWords(-n)
    var words = ''
    if (n >= 1000) { words += Math.floor(n / 1000) + ' thousand'; n %= 1000; if (n > 0) words += ', ' }
    if (n >= 100) { words += Math.floor(n / 100) + ' hundred'; n %= 100; if (n > 0) words += ' ' }
    if (n >= 20) {
      var tw = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
      words += tw[Math.floor(n / 10)]; n %= 10; if (n > 0) words += '-'
    }
    if (n > 0) {
      var ow = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
      words += ow[n]
    }
    return words
  }

  var needsRegroup = ones >= 10 || tens >= 10 || hundreds >= 10

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Base-10 Blocks</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: s.accent, marginLeft: 'auto' }}>{total.toLocaleString()}</span>
      </div>

      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <button onClick={toggleExpanded} style={s.btn(showExpanded)}>{showExpanded ? 'Hide' : 'Show'} Expanded</button>
        <button onClick={toggleWords} style={s.btn(showWords)}>{showWords ? 'Hide' : 'Show'} Words</button>
        <button onClick={toggleRegroup} style={s.btn(showRegroup)}>Regroup</button>
      </div>

      {showExpanded && total > 0 && (
        <div style={{ padding: '3px 8px', borderRadius: 4, background: s.surface, border: '1px solid ' + s.border, fontSize: 10, color: s.bright, fontFamily: 'monospace' }}>
          {thousands > 0 && <span>{thousands} x 1000</span>}
          {thousands > 0 && (hundreds > 0 || tens > 0 || ones > 0) && <span> + </span>}
          {hundreds > 0 && <span>{hundreds} x 100</span>}
          {(hundreds > 0 || thousands > 0) && tens > 0 && <span> + </span>}
          {tens > 0 && <span>{tens} x 10</span>}
          {(tens > 0 || hundreds > 0 || thousands > 0) && ones > 0 && <span> + </span>}
          {ones > 0 && <span>{ones} x 1</span>}
        </div>
      )}

      {showWords && (
        <div style={{ padding: '3px 8px', borderRadius: 4, background: s.surface, border: '1px solid ' + s.border, fontSize: 10, color: s.text, fontStyle: 'italic' }}>
          {numberToWords(total)}
        </div>
      )}

      {showRegroup && needsRegroup && (
        <div style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 10, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>Needs regrouping!</span>
          <button onClick={regroupUp} style={{ padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 600, cursor: 'pointer', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', marginLeft: 'auto' }}>Regroup</button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Thousands */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: s.text, width: 56, flexShrink: 0 }}>Thousands</span>
          <svg width={56} height={56} style={{ flexShrink: 0 }}>
            <rect x={1} y={1} width={54} height={54} fill={thousands > 0 ? blockFill : blockFillEmpty} stroke={blockStroke} strokeWidth={1} rx={2} />
            {thousands > 0 && Array.from({ length: 10 }, function(_, row) {
              return Array.from({ length: 10 }, function(_, col) {
                return <rect key={'t' + row + '-' + col} x={1 + col * 5.4} y={1 + row * 5.4} width={5.4} height={5.4} fill={blockFill} stroke={blockStroke} strokeWidth={0.3} />
              })
            })}
          </svg>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={function() { setThousands(thousands - 1) }} disabled={thousands <= 0} style={btnStyle(thousands <= 0)}>-</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.accent, width: 20, textAlign: 'center' as const }}>{thousands}</span>
            <button onClick={function() { setThousands(thousands + 1) }} disabled={thousands >= 9} style={btnStyle(thousands >= 9)}>+</button>
          </div>
        </div>
        {/* Hundreds */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: s.text, width: 56, flexShrink: 0 }}>Hundreds</span>
          <svg width={56} height={56} style={{ flexShrink: 0 }}>
            <rect x={1} y={1} width={54} height={54} fill={hundreds > 0 ? blockFill : blockFillEmpty} stroke={blockStroke} strokeWidth={1} rx={2} />
            {hundreds > 0 && Array.from({ length: 10 }, function(_, row) {
              return Array.from({ length: 10 }, function(_, col) {
                return <rect key={'h' + row + '-' + col} x={1 + col * 5.4} y={1 + row * 5.4} width={5.4} height={5.4} fill={blockFill} stroke={blockStroke} strokeWidth={0.3} />
              })
            })}
          </svg>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={function() { setHundreds(hundreds - 1) }} disabled={hundreds <= 0} style={btnStyle(hundreds <= 0)}>-</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.accent, width: 20, textAlign: 'center' as const }}>{hundreds}</span>
            <button onClick={function() { setHundreds(hundreds + 1) }} disabled={hundreds >= 99} style={btnStyle(hundreds >= 99)}>+</button>
          </div>
        </div>
        {/* Tens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: s.text, width: 56, flexShrink: 0 }}>Tens</span>
          <svg width={100} height={20} style={{ flexShrink: 0 }}>
            <rect x={0} y={0} width={100} height={20} fill={tens > 0 ? blockFill : blockFillEmpty} stroke={blockStroke} strokeWidth={1} rx={2} />
            {tens > 0 && Array.from({ length: 10 }, function(_, i) {
              return <rect key={'ten' + i} x={i * 10} y={0} width={10} height={20} fill={blockFill} stroke={blockStroke} strokeWidth={0.5} />
            })}
          </svg>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={function() { setTens(tens - 1) }} disabled={tens <= 0} style={btnStyle(tens <= 0)}>-</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.accent, width: 20, textAlign: 'center' as const }}>{tens}</span>
            <button onClick={function() { setTens(tens + 1) }} disabled={tens >= 99} style={btnStyle(tens >= 99)}>+</button>
          </div>
        </div>
        {/* Ones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: s.text, width: 56, flexShrink: 0 }}>Ones</span>
          <svg width={Math.max(40, Math.min(ones, 15) * 20 + 10)} height={22} style={{ flexShrink: 0 }}>
            {Array.from({ length: Math.min(ones, 15) }, function(_, i) {
              return <rect key={'one' + i} x={i * 20} y={1} width={18} height={20} fill={blockFill} stroke={blockStroke} strokeWidth={1} rx={2} />
            })}
            {ones > 15 && <text x={15 * 20 + 4} y={15} fontSize={9} fill={s.text}>+{ones - 15}</text>}
          </svg>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={function() { setOnes(ones - 1) }} disabled={ones <= 0} style={btnStyle(ones <= 0)}>-</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.accent, width: 20, textAlign: 'center' as const }}>{ones}</span>
            <button onClick={function() { setOnes(ones + 1) }} disabled={ones >= 99} style={btnStyle(ones >= 99)}>+</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
        {showRegroup && (
          <button onClick={regroupDown} disabled={total === 0} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, cursor: 'pointer', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontWeight: 600, opacity: total === 0 ? 0.5 : 1 }}>Trade Down</button>
        )}
        <button onClick={clearAll} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, cursor: 'pointer', background: s.surface, border: '1px solid ' + s.border, color: s.text }}>Clear</button>
      </div>
    </div>
  )
}

'''

# Lines are 1-indexed, so 2316-2446 is indices 2315-2445
result = lines[:2315] + [new_code] + lines[2446:]
with open(filepath, 'w') as f:
    f.writelines(result)

print('Done: replaced lines 2316-2446 with L3 Base-10 Blocks')
