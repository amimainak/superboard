// ============================================================
// Suggested Widget — Topic-to-Widget Keyword Mapping
// ============================================================
// Used by /api/room/[roomId]/resume to suggest a starting widget
// for a tutor's next session, based on the `topicsForNext` field
// from the most recent LessonNote.
//
// IMPORTANT: This is a SIMPLE object lookup — no AI, no embedding,
// no fuzzy match. Iteration order is preserved (first match wins)
// so place the most specific keywords first.
//
// Every widget kind below MUST exist in
// `src/lib/room/canvas-widget-registry.ts` so that the
// "Start with this widget" button can actually place it.
// ============================================================

export interface SuggestedWidget {
  /** Canvas widget kind (must exist in canvas-widget-registry.ts). */
  kind: string;
  /** Human-readable label for the "Start with this widget" button. */
  label: string;
}

/**
 * Ordered list of (keyword → widget) rules.
 * The first keyword (case-insensitive, substring match) found in
 * `topicsForNext` wins.
 */
const KEYWORD_MAP: Array<{ keywords: string[]; widget: SuggestedWidget }> = [
  // ---- Math: fractions / decimals / percent ----
  { keywords: ['equivalent fraction', 'comparing fraction', 'fraction'], widget: { kind: 'math-fraction-bar', label: 'Fraction Bar' } },
  { keywords: ['percent', 'percentage'], widget: { kind: 'math-fraction-circle', label: 'Fraction Circle' } },
  { keywords: ['decimal'], widget: { kind: 'math-fraction-bar', label: 'Fraction Bar' } },
  { keywords: ['ratio', 'proportion'], widget: { kind: 'math-ratio-table', label: 'Ratio Table' } },

  // ---- Math: algebra / equations / functions ----
  { keywords: ['equation', 'algebra', 'two-step', 'one-step'], widget: { kind: 'math-function-plotter', label: 'Function Plotter' } },
  { keywords: ['function', 'graphing', 'graph', 'linear', 'quadratic'], widget: { kind: 'math-coordinate-plane', label: 'Coordinate Plane' } },
  { keywords: ['coordinate'], widget: { kind: 'math-coordinate-plane', label: 'Coordinate Plane' } },

  // ---- Math: geometry ----
  { keywords: ['polygon', 'shape', 'geometry', 'triangle', 'quadrilateral'], widget: { kind: 'math-polygon', label: 'Polygon' } },
  { keywords: ['angle'], widget: { kind: 'math-angle-maker', label: 'Angle Maker' } },
  { keywords: ['transform', 'reflection', 'rotation', 'translation'], widget: { kind: 'math-coordinate-plane', label: 'Coordinate Plane' } },
  { keywords: ['protractor'], widget: { kind: 'math-protractor', label: 'Protractor' } },

  // ---- Math: number sense ----
  { keywords: ['number line'], widget: { kind: 'math-number-line', label: 'Number Line' } },
  { keywords: ['place value'], widget: { kind: 'math-place-value', label: 'Place Value Chart' } },
  { keywords: ['base 10', 'base ten', 'base-10'], widget: { kind: 'math-base-10', label: 'Base-10 Blocks' } },
  { keywords: ['multiplication', 'multiply'], widget: { kind: 'math-multiplication-grid', label: 'Multiplication Grid' } },
  { keywords: ['division', 'divide'], widget: { kind: 'math-multiplication-array', label: 'Multiplication Array' } },
  { keywords: ['pattern block'], widget: { kind: 'math-pattern-blocks', label: 'Pattern Blocks' } },

  // ---- Math: measurement / time / money ----
  { keywords: ['clock', 'time', 'elapsed time'], widget: { kind: 'math-analog-clock', label: 'Analog Clock' } },
  { keywords: ['money', 'coin'], widget: { kind: 'math-coin-counter', label: 'Coin Counter' } },
  { keywords: ['ruler', 'measure'], widget: { kind: 'math-ruler', label: 'Ruler' } },

  // ---- Math: stats / data ----
  { keywords: ['bar chart', 'bar graph', 'data'], widget: { kind: 'math-bar-chart', label: 'Bar Chart' } },
  { keywords: ['pie chart'], widget: { kind: 'math-pie-chart', label: 'Pie Chart' } },
  { keywords: ['venn'], widget: { kind: 'math-venn-diagram', label: 'Venn Diagram' } },
  { keywords: ['statistics', 'stats', 'mean', 'median', 'mode'], widget: { kind: 'math-stats-toolbox', label: 'Stats Toolbox' } },

  // ---- Math: advanced ----
  { keywords: ['derivative', 'calculus'], widget: { kind: 'math-derivative-visualizer', label: 'Derivative Visualizer' } },
  { keywords: ['conic'], widget: { kind: 'math-conic-sections', label: 'Conic Sections' } },
  { keywords: ['log', 'exponent', 'exponential'], widget: { kind: 'math-log-exp-visualizer', label: 'Log & Exp Visualizer' } },
  { keywords: ['proof'], widget: { kind: 'math-proof-builder', label: 'Proof Builder' } },

  // ---- Chemistry ----
  { keywords: ['atom', 'element', 'periodic table'], widget: { kind: 'chem-periodic-table', label: 'Periodic Table' } },
  { keywords: ['periodic trend'], widget: { kind: 'chem-periodic-trends', label: 'Periodic Trends' } },
  { keywords: ['bond', 'lewis', 'electron dot'], widget: { kind: 'chem-lewis-dot', label: 'Lewis Dot Structure' } },
  { keywords: ['vsepr', 'molecular geometry'], widget: { kind: 'chem-vsepr', label: 'VSEPR Model' } },
  { keywords: ['balance', 'reaction', 'equation', 'stoichiometry'], widget: { kind: 'chem-equation-balancer', label: 'Equation Balancer' } },
  { keywords: ['mole', 'molar mass'], widget: { kind: 'chem-molar-mass', label: 'Molar Mass' } },
  { keywords: ['ph', 'acid', 'base'], widget: { kind: 'chem-ph-scale', label: 'pH Scale' } },
  { keywords: ['gas', 'pressure', 'boyle', 'charles'], widget: { kind: 'chem-gas-laws', label: 'Gas Laws' } },
  { keywords: ['titration'], widget: { kind: 'chem-titration', label: 'Titration' } },
  { keywords: ['ion'], widget: { kind: 'chem-ion-formation', label: 'Ion Formation' } },
  { keywords: ['scientific notation'], widget: { kind: 'chem-sci-notation', label: 'Scientific Notation' } },

  // ---- Biology ----
  { keywords: ['cell', 'mitosis'], widget: { kind: 'bio-cell-diagram', label: 'Cell Diagram' } },
  { keywords: ['meiosis'], widget: { kind: 'bio-meiosis', label: 'Meiosis' } },
  { keywords: ['cell division'], widget: { kind: 'bio-cell-division', label: 'Cell Division' } },
  { keywords: ['dna', 'genetics', 'gene'], widget: { kind: 'bio-dna-structure', label: 'DNA Structure' } },
  { keywords: ['punnett', 'heredity', 'inheritance'], widget: { kind: 'bio-punnett-square', label: 'Punnett Square' } },
  { keywords: ['photosynthesis', 'respiration'], widget: { kind: 'bio-photosynthesis-resp', label: 'Photosynthesis & Respiration' } },
  { keywords: ['body', 'anatomy', 'organ'], widget: { kind: 'bio-body-systems', label: 'Body Systems' } },
  { keywords: ['human body'], widget: { kind: 'bio-human-body', label: 'Human Body' } },
  { keywords: ['food chain', 'food web', 'ecosystem'], widget: { kind: 'bio-food-web', label: 'Food Web' } },
  { keywords: ['natural selection', 'evolution'], widget: { kind: 'bio-natural-selection', label: 'Natural Selection' } },
  { keywords: ['taxonomy', 'classification'], widget: { kind: 'bio-taxonomy', label: 'Taxonomy' } },
  { keywords: ['plant', 'life cycle'], widget: { kind: 'bio-plant-life-cycle', label: 'Plant Life Cycle' } },

  // ---- Physics ----
  { keywords: ['circuit', 'electricity', 'current', 'voltage'], widget: { kind: 'phys-circuit-diagram', label: 'Circuit Diagram' } },
  { keywords: ['ohm'], widget: { kind: 'phys-ohms-law', label: "Ohm's Law" } },
  { keywords: ['magnet', 'magnetism'], widget: { kind: 'phys-magnetism', label: 'Magnetism' } },
  { keywords: ['force', 'free body', 'newton'], widget: { kind: 'phys-free-body-diagram', label: 'Free Body Diagram' } },
  { keywords: ['projectile'], widget: { kind: 'phys-projectile-sim', label: 'Projectile Sim' } },
  { keywords: ['pendulum'], widget: { kind: 'phys-pendulum-sim', label: 'Pendulum Sim' } },
  { keywords: ['wave', 'interference'], widget: { kind: 'phys-wave-sim', label: 'Wave Sim' } },
  { keywords: ['energy', 'work'], widget: { kind: 'phys-energy-bar-charts', label: 'Energy Bar Charts' } },
  { keywords: ['rotation', 'torque'], widget: { kind: 'phys-rotational-motion', label: 'Rotational Motion' } },
  { keywords: ['ray', 'lens', 'mirror', 'optics'], widget: { kind: 'phys-ray-diagram', label: 'Ray Diagram' } },
  { keywords: ['formula', 'kinematic'], widget: { kind: 'phys-formula-calc', label: 'Formula Calculator' } },

  // ---- Language Arts ----
  { keywords: ['essay', 'argument', 'writing', 'paragraph'], widget: { kind: 'lang-argument-organizer', label: 'Argument Organizer' } },
  { keywords: ['citation', 'bibliography', 'mla', 'apa'], widget: { kind: 'lang-citation-gen', label: 'Citation Generator' } },
  { keywords: ['vocabulary', 'context clue'], widget: { kind: 'lang-context-clues-exp', label: 'Context Clues Explorer' } },
];

/**
 * Find the best widget suggestion for the given `topicsForNext` text.
 * Returns `null` if no keyword matches (caller shows the generic
 * "pick a widget from the toolkit" message).
 */
export function suggestWidgetForTopics(topicsForNext: string | null | undefined): SuggestedWidget | null {
  if (!topicsForNext) return null;
  const text = topicsForNext.toLowerCase();
  for (const rule of KEYWORD_MAP) {
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        return rule.widget;
      }
    }
  }
  return null;
}
