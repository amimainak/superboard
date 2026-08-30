const { mathToLatex, EQUATION_CATEGORIES, EQUATION_LIBRARY } = require('../src/lib/whiteboard/math-input-parser.ts')

testCases = [
  'x^2 + 1/2 + sqrt(4)',
  'a_n + b_(n+1)',
  'sin(theta) = opp/hyp',
  'pi * r^2',
  'x >= 5 and x <= 10',
  'sum_(i=1)^n i = n(n+1)/2',
  'int_0^1 x^2 dx',
  'f(x) = ax^2 + bx + c',
  'a^2 - b^2 = (a+b)(a-b)',
  '(-b +- sqrt(b^2 - 4ac)) / (2a)',
  'd/dx x^n = n x^(n-1)',
  'sin^2(theta) + cos^2(theta) = 1',
  'e = lim_(n -> infinity) (1 + 1/n)^n',
  'y = mx + b',
  'A = pi r^2',
  'a/b + c/d',
  'sqrt(3)/2',
  'log(ab) = log(a) + log(b)',
  'C(n,k) = n! / (k!(n-k)!)',
  'x = (-b +- sqrt(b^2 - 4ac))/(2a)',
]

for (const tc of testCases) {
  const result = mathToLatex(tc)
  console.log(tc)
  console.log('  → ' + result)
  console.log()
}

console.log('Categories:', EQUATION_CATEGORIES)
console.log('Total equations:', EQUATION_LIBRARY.length)