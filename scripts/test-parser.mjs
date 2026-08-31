// Inline test of the parser logic (plain JS, no imports)

const GREEK = {
  alpha: '\\alpha', beta: '\\beta', gamma: '\\gamma',
  delta: '\\delta', epsilon: '\\epsilon', theta: '\\theta',
  pi: '\\pi', Pi: '\\Pi', omega: '\\omega',
  infinity: '\\infty', phi: '\\phi', lambda: '\\lambda',
  sigma: '\\sigma', mu: '\\mu', rho: '\\rho',
}

const FUNCTIONS = {
  sin: '\\sin', cos: '\\cos', tan: '\\tan',
  cot: '\\cot', sec: '\\sec', csc: '\\csc',
  arcsin: '\\arcsin', arccos: '\\arccos', arctan: '\\arctan',
  log: '\\log', ln: '\\ln', exp: '\\exp',
  lim: '\\lim', min: '\\min', max: '\\max',
  sqrt: '\\sqrt',
  sum: '\\sum', prod: '\\prod', int: '\\int',
}

function mathToLatex(input) {
  if (!input?.trim()) return ''
  let s = input.trim()

  // Comparison operators
  s = s.replace(/>=/g, '\\geq ')
  s = s.replace(/<=/g, '\\leq ')
  s = s.replace(/!=/g, '\\neq ')

  // Greek letters
  for (const [word, latex] of Object.entries(GREEK)) {
    const regex = new RegExp('(?<![a-zA-Z\\])' + word + '(?![a-zA-Z])', 'g')
    s = s.replace(regex, latex + ' ')
  }

  // Math functions
  for (const [word, latex] of Object.entries(FUNCTIONS)) {
    const regex = new RegExp('(?<![a-zA-Z\\])' + word + '(?=\(|\s|$|\\{|\\})', 'g')
    s = s.replace(regex, latex)
  }

  // sqrt(expr) → \sqrt{expr}
  s = s.replace(/\\sqrt\(([^)]+)\)/g, '\\sqrt{$1}')

  // Fractions: (expr)/(expr) → \frac{expr}{expr}
  // Simple: a/b → \frac{a}{b} for single-char operands
  s = s.replace(/(?<![\\])\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}')

  // Simple a/b → \frac{a}{b}
  // Only for single digit/letter / single digit/letter
  s = s.replace(/(\d)\/(\d)/g, '\\frac{$1}{$2}')
  s = s.replace(/(\d)\s*\/\s*([a-zA-Z_])/g, '\\frac{$1}{$2}')

  // Superscripts
  s = s.replace(/\^\(([^)]+)\)/g, '^{$1}')
  s = s.replace(/\^(\d+)/g, '^{$1}')

  // Subscripts
  s = s.replace(/_\(([^)]+)\)/g, '_{$1}')
  s = s.replace(/_(\d+)/g, '_{$1}')
  s = s.replace(/_([a-zA-Z])(?![a-zA-Z{])/g, '_{$1}')

  // Summation/Product/Integral limits
  s = s.replace(/\\sum_\(([^)]*)\)\^\(([^)]*)\)/g, '\\sum_{$1}^{$2}')
  s = s.replace(/\\prod_\(([^)]*)\)\^\(([^)]*)\)/g, '\\prod_{$1}^{$2}')
  s = s.replace(/\\int_\(([^)]*)\)\^\(([^)]*)\)/g, '\\int_{$1}^{$2}')
  s = s.replace(/\\int_(\d+)\^(\d+)/g, '\\int_{$1}^{$2}')

  // Limit: lim_(x→a)
  s = s.replace(/\\lim_\(([^)]+)\)/g, (_, inner) => {
    return '\\lim_{' + inner.replace(/>/g, ' \\to ') + '}'
  })

  // Multiplication: 2x → 2x (implicit is fine in LaTeX), 2( → 2 \cdot (
  // Actually LaTeX handles implicit multiplication fine, skip

  // +- → \pm
  s = s.replace(/\+\s*-/g, ' \\pm ')

  // Clean spaces
  s = s.replace(/\s{2,}/g, ' ')

  return s
}

const tests = [
  'x^2 + 1/2 + sqrt(4)',
  'a_n + b_(n+1)',
  'sin(theta) = opp/hyp',
  'pi * r^2',
  'x >= 5 and x <= 10',
  'sum_(i=1)^n i = n(n+1)/2',
  'int_0^1 x^2 dx',
  'f(x) = ax^2 + bx + c',
  'a^2 - b^2 = (a+b)(a-b)',
  'y = mx + b',
  'A = pi r^2',
  'sin^2(theta) + cos^2(theta) = 1',
]

for (const tc of tests) {
  console.log(tc)
  console.log('  → ' + mathToLatex(tc))
  console.log()
}
