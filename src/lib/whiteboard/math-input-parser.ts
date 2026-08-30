// ============================================================
// Superboard — Smart Math Input Parser
// Converts plain-text math shortcuts to LaTeX automatically
// Goal: Zero LaTeX knowledge required for K-12 tutors/students
// ============================================================

// ---- Greek letters (common K-12) ----
const GREEK: [string, string][] = [
  ['pi',      '\pi'],      ['Pi',      '\Pi'],
  ['theta',   '\theta'],   ['alpha',   '\alpha'],
  ['beta',    '\beta'],    ['gamma',   '\gamma'],
  ['delta',   '\delta'],   ['epsilon', '\epsilon'],
  ['phi',     '\phi'],     ['psi',     '\psi'],
  ['omega',   '\omega'],   ['lambda',  '\lambda'],
  ['sigma',   '\sigma'],   ['mu',      '\mu'],
  ['rho',     '\rho'],     ['tau',     '\tau'],
  ['infinity','\infty'],
]

// ---- Trig & math functions (longer names first for correct matching) ----
const FUNCTIONS: [string, string][] = [
  ['arcsin',  '\arcsin'],  ['arccos',  '\arccos'],
  ['arctan',  '\arctan'],  ['sinh',    '\sinh'],
  ['cosh',    '\cosh'],    ['tanh',    '\tanh'],
  ['sin',     '\sin'],     ['cos',     '\cos'],
  ['tan',     '\tan'],     ['cot',     '\cot'],
  ['sec',     '\sec'],     ['csc',     '\csc'],
  ['log',     '\log'],     ['ln',      '\ln'],
  ['exp',     '\exp'],     ['lim',     '\lim'],
  ['min',     '\min'],     ['max',     '\max'],
  ['sum',     '\sum'],     ['prod',    '\prod'],
  ['int',     '\int'],     ['sqrt',    '\sqrt'],
  ['gcd',     '\gcd'],     ['lcm',     '\lcm'],
  ['det',     '\det'],     ['dim',     '\dim'],
]

/**
 * Converts plain-text math to LaTeX.
 * Designed so K-12 tutors/students can type naturally.
 *
 * Examples:
 *   x^2 + 1/2 + sqrt(4)   ->  x^{2} + \frac{1}{2} + \sqrt{4}
 *   a_n + b_(n+1)        ->  a_{n} + b_{n+1}
 *   sin(theta) = opp/hyp  ->  \sin(theta) = opp/hyp
 *   pi * r^2              ->  \pi  r^{2}
 */
export function mathToLatex(input: string): string {
  if (!input || !input.trim()) return ''
  let s = input.trim()

  // 1. Comparison operators (before Greek/function replacement)
  s = s.replace(/>=/g, '\geq ')
  s = s.replace(/<=/g, '\leq ')
  s = s.replace(/!=/g, '\neq ')
  s = s.replace(/<->/g, '\leftrightarrow ')
  s = s.replace(/->/g, '\rightarrow ')
  s = s.replace(/<-/g, '\leftarrow ')

  // 2. Greek letters (whole-word only, not inside a LaTeX command)
  for (const [word, latex] of GREEK) {
    const re = new RegExp('(?<![a-zA-Z\\])' + escapeRegex(word) + '(?![a-zA-Z])', 'g')
    s = s.replace(re, latex + ' ')
  }

  // 3. Math functions (whole-word, before sub/superscript)
  for (const [word, latex] of FUNCTIONS) {
    const re = new RegExp('(?<![a-zA-Z\\])' + escapeRegex(word) + '(?=[(\s])', 'g')
    s = s.replace(re, latex)
  }

  // 4. Square root: \sqrt(expr) -> \sqrt{expr}
  s = s.replace(/\\sqrt\(([^)]+)\)/g, '\\sqrt{$1}')

  // 5. Fractions: (a+b)/(c+d) -> \frac{a+b}{c+d}
  // H5 FIX: Handle nested parentheses with recursive matching
  s = replaceFractionParens(s)

  // 6. Simple fractions: 1/2 -> \frac{1}{2}
  s = s.replace(/(\d)\s*\/\s*(\d)/g, '\\frac{$1}{$2}')

  // 7. Digit/variable fraction: 1/x -> \frac{1}{x}
  // H5 FIX: Also handle variable/variable: x/y -> \frac{x}{y}
  s = s.replace(/(\d)\s*\/\s*([a-zA-Z_])/g, '\\frac{$1}{$2}')
  s = s.replace(/([a-zA-Z_])\s*\/\s*([a-zA-Z_])/g, '\\frac{$1}{$2}')

  // 8. Superscripts: ^(expr) -> ^{expr}, ^digit -> ^{digit}
  s = s.replace(/\^\(([^)]+)\)/g, '^{$1}')
  s = s.replace(/\^(\d+)/g, '^{$1}')

  // 9. Subscripts: _(expr) -> _{expr}, _digit -> _{digit}, _letter -> _{letter}
  s = s.replace(/_\(([^)]+)\)/g, '_{$1}')
  s = s.replace(/_(\d+)/g, '_{$1}')
  s = s.replace(/_([a-zA-Z])(?![a-zA-Z{])/g, '_{$1}')

  // 10. Sum/Product/Integral limits
  s = s.replace(/(\\sum|\\prod|\\int)_\(([^)]*)\)\^\(([^)]*)\)/g, '$1_{$2}^{$3}')
  s = s.replace(/(\\sum|\\prod|\\int)_(\d+)\^(\d+)/g, '$1_{$2}^{$3}')

  // 11. Limit: \lim_(x->a) -> \lim_{x \to a}
  s = s.replace(/\\lim_\(([^)]+)\)/g, (_: string, inner: string) => {
    return '\\lim_{' + inner.replace(/>/g, ' \\to ').replace(/\u2192/g, ' \\to ') + '}'
  })

  // 12. Plus-minus
  s = s.replace(/\+\s*-/g, ' \\pm ')
  s = s.replace(/-\s*\+/g, ' \\mp ')

  // 13. Degree
  s = s.replace(/\u00B0/g, '^{\\circ}')
  s = s.replace(/(\d+)deg(?![a-zA-Z])/g, '$1^{\\circ}')

  // 14. Binomial: C(n,k) -> \binom{n}{k}
  s = s.replace(/C\(([^,]+),\s*([^)]+)\)/g, '\\binom{$1}{$2}')

  // 15. Vector/hat/bar/dot
  s = s.replace(/vec\(([^)]+)\)/g, '\\vec{$1}')
  s = s.replace(/hat\(([^)]+)\)/g, '\\hat{$1}')
  s = s.replace(/bar\(([^)]+)\)/g, '\\overline{$1}')
  s = s.replace(/dot\(([^)]+)\)/g, '\\dot{$1}')

  // 16. Clean up multiple spaces
  s = s.replace(/\s{2,}/g, ' ')

  // 17. H5 FIX: Implicit multiplication — digit next to letter: 2x -> 2 \cdot x
  //    (but skip if the letter is part of a function name that was already replaced)
  s = s.replace(/(?<![a-zA-Z])(\d)\s*([a-z])(?![a-z{])/g, (_match: string, p1: string, p2: string) => {
    // Don't add cdot inside existing LaTeX commands
    if (_match.includes('\\frac') || _match.includes('\\sqrt') || _match.includes('\\vec')) return _match
    return p1 + ' \\cdot ' + p2
  })

  // 18. H5 FIX: Support \begin{aligned} ... \end{aligned} for multi-line equations
  //    Users can type: aligned(a+b=c, d+e=f) -> \begin{aligned}a+b=c \\ d+e=f\end{aligned}
  s = s.replace(/aligned\(([^)]+)\)/g, (_: string, inner: string) => {
    const lines = inner.split(',').map((l: string) => l.trim())
    return '\\begin{aligned}' + lines.join(' \\\\ ') + '\\end{aligned}'
  })

  return s
}

/** H5 FIX: Recursively match balanced parentheses for fraction conversion */
function replaceFractionParens(s: string): string {
  // Find pattern: (...) / (...) where parens can be nested
  // Iteratively unwrap innermost paren pairs first
  let result = s
  let changed = true
  let iterations = 0
  while (changed && iterations < 5) {
    changed = false
    iterations++
    result = result.replace(/\(([^()]*)\)\s*\/\s*\(([^()]*)\)/g, (_match: string, num: string, den: string) => {
      changed = true
      return '\\frac{' + num + '}{' + den + '}'
    })
  }
  return result
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---- Placeholder hints shown in the equation input ----
export const INPUT_HINTS = [
  'x^2 + 1/2 + sqrt(4)',
  'a_(n+1) = a_n + d',
  '(a+b)^2 = a^2 + 2ab + b^2',
  'sin(theta) = opp/hyp',
  'sum_(i=1)^n i = n(n+1)/2',
  'f(x) = ax^2 + bx + c',
  'y = mx + b',
  'pi * r^2',
  'aligned(a+b=c, d+e=f)',
]

// ---- Common equations library ----
export interface EquationEntry {
  label: string
  latex: string
  category: string
}

export const EQUATION_LIBRARY: EquationEntry[] = [
  // Algebra
  { label: 'Quadratic Formula', latex: 'x = \frac{-b \pm \sqrt{b^{2} - 4ac}}{2a}', category: 'Algebra' },
  { label: 'Slope-Intercept', latex: 'y = mx + b', category: 'Algebra' },
  { label: 'Point-Slope', latex: 'y - y_{1} = m(x - x_{1})', category: 'Algebra' },
  { label: 'Distance Formula', latex: 'd = \sqrt{(x_{2}-x_{1})^{2} + (y_{2}-y_{1})^{2}}', category: 'Algebra' },
  { label: 'Midpoint', latex: 'M = \left(\frac{x_{1}+x_{2}}{2}, \frac{y_{1}+y_{2}}{2}\right)', category: 'Algebra' },
  { label: 'Difference of Squares', latex: 'a^{2} - b^{2} = (a+b)(a-b)', category: 'Algebra' },
  { label: 'Perfect Square', latex: '(a+b)^{2} = a^{2} + 2ab + b^{2}', category: 'Algebra' },
  { label: 'Quadratic Equation', latex: 'ax^{2} + bx + c = 0', category: 'Algebra' },
  { label: 'Arithmetic Sequence', latex: 'a_{n} = a_{1} + (n-1)d', category: 'Algebra' },
  { label: 'Geometric Sequence', latex: 'a_{n} = a_{1} \cdot r^{n-1}', category: 'Algebra' },
  { label: 'Arithmetic Series', latex: 'S_{n} = \frac{n(a_{1} + a_{n})}{2}', category: 'Algebra' },
  { label: 'Geometric Series', latex: 'S_{n} = \frac{a_{1}(1 - r^{n})}{1 - r}', category: 'Algebra' },
  { label: 'Binomial Theorem', latex: '(a+b)^{n} = \sum_{k=0}^{n} \binom{n}{k} a^{n-k} b^{k}', category: 'Algebra' },

  // Geometry
  { label: 'Pythagorean Theorem', latex: 'a^{2} + b^{2} = c^{2}', category: 'Geometry' },
  { label: 'Area of Circle', latex: 'A = \pi r^{2}', category: 'Geometry' },
  { label: 'Circumference', latex: 'C = 2\pi r', category: 'Geometry' },
  { label: 'Area of Triangle', latex: 'A = \frac{1}{2}bh', category: 'Geometry' },
  { label: "Heron's Formula", latex: 'A = \sqrt{s(s-a)(s-b)(s-c)}', category: 'Geometry' },
  { label: 'Volume of Sphere', latex: 'V = \frac{4}{3}\pi r^{3}', category: 'Geometry' },
  { label: 'Volume of Cylinder', latex: 'V = \pi r^{2}h', category: 'Geometry' },
  { label: 'Volume of Cone', latex: 'V = \frac{1}{3}\pi r^{2}h', category: 'Geometry' },

  // Trigonometry
  { label: 'SOH-CAH-TOA', latex: '\sin(\theta) = \frac{\text{opp}}{\text{hyp}}', category: 'Trigonometry' },
  { label: 'Pythagorean Identity', latex: '\sin^{2}(\theta) + \cos^{2}(\theta) = 1', category: 'Trigonometry' },
  { label: 'Law of Sines', latex: '\frac{a}{\sin(A)} = \frac{b}{\sin(B)} = \frac{c}{\sin(C)}', category: 'Trigonometry' },
  { label: 'Law of Cosines', latex: 'c^{2} = a^{2} + b^{2} - 2ab\cos(C)', category: 'Trigonometry' },
  { label: 'Area with Sine', latex: 'A = \frac{1}{2}ab\sin(C)', category: 'Trigonometry' },

  // Calculus
  { label: 'Power Rule', latex: '\frac{d}{dx} x^{n} = nx^{n-1}', category: 'Calculus' },
  { label: 'Chain Rule', latex: '\frac{d}{dx} f(g(x)) = f\'(g(x)) \cdot g\'(x)', category: 'Calculus' },
  { label: 'Product Rule', latex: '(fg)\' = f\'g + fg\'', category: 'Calculus' },
  { label: 'Quotient Rule', latex: '\left(\frac{f}{g}\right)\' = \frac{f\'g - fg\'}{g^{2}}', category: 'Calculus' },
  { label: 'Definite Integral', latex: '\int_{a}^{b} f(x)\,dx = F(b) - F(a)', category: 'Calculus' },
  { label: 'Derivative of sin', latex: '\frac{d}{dx} \sin(x) = \cos(x)', category: 'Calculus' },
  { label: 'Derivative of e^x', latex: '\frac{d}{dx} e^{x} = e^{x}', category: 'Calculus' },
  { label: 'Derivative of ln', latex: '\frac{d}{dx} \ln(x) = \frac{1}{x}', category: 'Calculus' },

  // Statistics
  { label: 'Mean', latex: '\bar{x} = \frac{\sum_{i=1}^{n} x_{i}}{n}', category: 'Statistics' },
  { label: 'Std Deviation', latex: '\sigma = \sqrt{\frac{1}{n}\sum_{i=1}^{n}(x_{i}-\bar{x})^{2}}', category: 'Statistics' },
  { label: 'Combination', latex: '\binom{n}{k} = \frac{n!}{k!(n-k)!}', category: 'Statistics' },
  { label: 'Permutation', latex: 'P(n,k) = \frac{n!}{(n-k)!}', category: 'Statistics' },
  { label: "Bayes' Theorem", latex: 'P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}', category: 'Statistics' },

  // Logarithms
  { label: 'Log Product Rule', latex: '\log(ab) = \log(a) + \log(b)', category: 'Logarithms' },
  { label: 'Log Quotient Rule', latex: '\log\left(\frac{a}{b}\right) = \log(a) - \log(b)', category: 'Logarithms' },
  { label: 'Log Power Rule', latex: '\log(a^{n}) = n\log(a)', category: 'Logarithms' },
  { label: 'Change of Base', latex: '\log_{b}(a) = \frac{\ln(a)}{\ln(b)}', category: 'Logarithms' },
  { label: 'Definition of e', latex: 'e = \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^{n}', category: 'Logarithms' },
]

export const EQUATION_CATEGORIES = [...new Set(EQUATION_LIBRARY.map(e => e.category))]
