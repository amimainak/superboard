// ============================================================
// Superboard — Canvas Widget Registry
// Centralized catalog of ALL individual canvas widget kinds
// that can be placed on the board. Used by the curation system
// to let tutors hide/show individual widgets and save templates.
// ============================================================

export type ToolkitId = 'math' | 'physics' | 'chemistry' | 'biology' | 'language' | 'statistics' | 'earthscience' | 'arts' | 'classroom' | 'ai'

export type CanvasWidgetEntry = {
  /** Unique widget kind used in WidgetElement.widgetKind */
  kind: string
  /** Human-readable label */
  label: string
  /** Which toolkit panel this belongs to */
  toolkit: ToolkitId
  /** Grade bands this widget is relevant for */
  gradeBands: Array<'K-2' | '3-5' | '6-8' | '9-12'>
  /** Whether this widget is shown by default (not hidden) */
  isDefault: boolean
}

// ============================================================
// Math Widgets (22 canvas kinds)
// ============================================================
const MATH_WIDGETS: CanvasWidgetEntry[] = [
  // Canvas tools from MathToolkit CANVAS_TOOLS
  { kind: 'math-fraction-circle', label: 'Fraction Circle', toolkit: 'math', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'math-fraction-bar', label: 'Fraction Bar', toolkit: 'math', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'math-number-line', label: 'Number Line', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8'], isDefault: true },
  { kind: 'math-angle-maker', label: 'Angle Maker', toolkit: 'math', gradeBands: ['6-8'], isDefault: true },
  { kind: 'math-polygon', label: 'Polygon', toolkit: 'math', gradeBands: ['6-8'], isDefault: true },
  { kind: 'math-coordinate-plane', label: 'Coordinate Plane', toolkit: 'math', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'math-venn-diagram', label: 'Venn Diagram', toolkit: 'math', gradeBands: ['9-12'], isDefault: true },
  { kind: 'math-bar-chart', label: 'Bar Chart', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8'], isDefault: true },
  { kind: 'math-pie-chart', label: 'Pie Chart', toolkit: 'math', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'math-place-value', label: 'Place Value Chart', toolkit: 'math', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'math-clock', label: 'Clock', toolkit: 'math', gradeBands: ['K-2', '3-5'], isDefault: false },
  { kind: 'math-base-10', label: 'Base-10 Blocks', toolkit: 'math', gradeBands: ['K-2', '3-5'], isDefault: false },
  { kind: 'math-multiplication-array', label: 'Multiplication Array', toolkit: 'math', gradeBands: ['3-5'], isDefault: false },
  { kind: 'math-function-plotter', label: 'Function Plotter', toolkit: 'math', gradeBands: ['6-8', '9-12'], isDefault: true },
  // Measurement tools
  { kind: 'math-protractor', label: 'Protractor', toolkit: 'math', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'math-ruler', label: 'Ruler', toolkit: 'math', gradeBands: ['3-5', '6-8'], isDefault: true },
  { kind: 'math-set-square', label: 'Set Square', toolkit: 'math', gradeBands: ['6-8', '9-12'], isDefault: false },
  { kind: 'math-compass', label: 'Compass', toolkit: 'math', gradeBands: ['6-8', '9-12'], isDefault: false },
  // Additional from CanvasMathWidgets
  { kind: 'math-multiplication-grid', label: 'Multiplication Grid', toolkit: 'math', gradeBands: ['3-5'], isDefault: false },
  { kind: 'math-flashcards', label: 'Flashcards', toolkit: 'math', gradeBands: ['K-2', '3-5'], isDefault: false },
  { kind: 'math-calculator', label: 'Calculator', toolkit: 'math', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'math-unit-converter', label: 'Unit Converter', toolkit: 'math', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'math-formula-reference', label: 'Formula Reference', toolkit: 'math', gradeBands: ['9-12'], isDefault: true },
  { kind: 'math-proof-builder', label: 'Proof Builder', toolkit: 'math', gradeBands: ['9-12'], isDefault: false },
]

// ============================================================
// Physics Widgets (11 canvas kinds)
// ============================================================
const PHYSICS_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'phys-formula-calc', label: 'Formula Calculator', toolkit: 'physics', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'phys-wave-sim', label: 'Wave Simulator', toolkit: 'physics', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'phys-pendulum-sim', label: 'Pendulum Simulator', toolkit: 'physics', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'phys-unit-converter', label: 'Science Unit Converter', toolkit: 'physics', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'phys-projectile-sim', label: 'Projectile Motion', toolkit: 'physics', gradeBands: ['9-12'], isDefault: true },
  { kind: 'phys-ohms-law', label: "Ohm's Law Calculator", toolkit: 'physics', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'phys-circuit-diagram', label: 'Circuit Diagram Builder', toolkit: 'physics', gradeBands: ['9-12'], isDefault: false },
  { kind: 'phys-free-body-diagram', label: 'Free Body Diagram', toolkit: 'physics', gradeBands: ['9-12'], isDefault: true },
  { kind: 'phys-ray-diagram', label: 'Ray Diagram Optics', toolkit: 'physics', gradeBands: ['9-12'], isDefault: false },
  { kind: 'phys-energy-bar-charts', label: 'Energy Bar Charts', toolkit: 'physics', gradeBands: ['9-12'], isDefault: false },
  { kind: 'phys-interactive-graphing', label: 'Interactive Graphing', toolkit: 'physics', gradeBands: ['6-8', '9-12'], isDefault: true },
]

// ============================================================
// Chemistry Widgets (10 canvas kinds)
// ============================================================
const CHEMISTRY_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'chem-periodic-table', label: 'Periodic Table', toolkit: 'chemistry', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'chem-equation-balancer', label: 'Equation Balancer', toolkit: 'chemistry', gradeBands: ['9-12'], isDefault: true },
  { kind: 'chem-ph-scale', label: 'pH Scale Visualizer', toolkit: 'chemistry', gradeBands: ['9-12'], isDefault: true },
  { kind: 'chem-sci-notation', label: 'Scientific Notation', toolkit: 'chemistry', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'chem-molar-mass', label: 'Molar Mass Calculator', toolkit: 'chemistry', gradeBands: ['9-12'], isDefault: true },
  { kind: 'chem-lewis-dot', label: 'Lewis Dot Structures', toolkit: 'chemistry', gradeBands: ['9-12'], isDefault: false },
  { kind: 'chem-vsepr', label: 'Molecular Geometry (VSEPR)', toolkit: 'chemistry', gradeBands: ['9-12'], isDefault: false },
  { kind: 'chem-gas-laws', label: 'Gas Laws Simulator', toolkit: 'chemistry', gradeBands: ['9-12'], isDefault: true },
  { kind: 'chem-titration', label: 'Acid-Base Titration', toolkit: 'chemistry', gradeBands: ['9-12'], isDefault: false },
  { kind: 'chem-ion-formation', label: 'Ion Formation Visualizer', toolkit: 'chemistry', gradeBands: ['6-8', '9-12'], isDefault: false },
]

// ============================================================
// Biology Widgets (10 canvas kinds)
// ============================================================
const BIOLOGY_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'bio-cell-diagram', label: 'Cell Diagram Builder', toolkit: 'biology', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'bio-dna-transcription', label: 'DNA Transcription', toolkit: 'biology', gradeBands: ['9-12'], isDefault: true },
  { kind: 'bio-punnett-square', label: 'Punnett Square', toolkit: 'biology', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'bio-ecosystem', label: 'Ecosystem Diagram', toolkit: 'biology', gradeBands: ['6-8'], isDefault: true },
  { kind: 'bio-human-body', label: 'Human Body Systems', toolkit: 'biology', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'bio-evolution-tree', label: 'Evolution Tree', toolkit: 'biology', gradeBands: ['9-12'], isDefault: false },
  { kind: 'bio-photosynthesis', label: 'Photosynthesis Diagram', toolkit: 'biology', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'bio-respiration', label: 'Cell Respiration', toolkit: 'biology', gradeBands: ['9-12'], isDefault: false },
  { kind: 'bio-food-web', label: 'Food Web Builder', toolkit: 'biology', gradeBands: ['3-5', '6-8'], isDefault: true },
  { kind: 'bio-classification', label: 'Classification Key', toolkit: 'biology', gradeBands: ['6-8', '9-12'], isDefault: false },
]

// ============================================================
// Language Widgets (23 canvas kinds)
// ============================================================
const LANGUAGE_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'lang-pos-tagger', label: 'Part of Speech Tagger', toolkit: 'language', gradeBands: ['3-5', '6-8'], isDefault: true },
  { kind: 'lang-sentence-builder', label: 'Sentence Builder', toolkit: 'language', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'lang-word-family', label: 'Word Family Tree', toolkit: 'language', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'lang-syllable-counter', label: 'Syllable Counter', toolkit: 'language', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'lang-rhyme-finder', label: 'Rhyme Finder', toolkit: 'language', gradeBands: ['K-2', '3-5'], isDefault: false },
  { kind: 'lang-analogy-solver', label: 'Analogy Solver', toolkit: 'language', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'lang-context-clues', label: 'Context Clues', toolkit: 'language', gradeBands: ['3-5', '6-8'], isDefault: true },
  { kind: 'lang-figurative-lang', label: 'Figurative Language', toolkit: 'language', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'lang-text-structure', label: 'Text Structure', toolkit: 'language', gradeBands: ['6-8', '9-12'], isDefault: false },
  { kind: 'lang-vocabulary-builder', label: 'Vocabulary Builder', toolkit: 'language', gradeBands: ['3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-spelling-patterns', label: 'Spelling Patterns', toolkit: 'language', gradeBands: ['K-2', '3-5'], isDefault: false },
  { kind: 'lang-grammar-diagnostic', label: 'Grammar Diagnostic', toolkit: 'language', gradeBands: ['6-8', '9-12'], isDefault: false },
  { kind: 'lang-reading-strategies', label: 'Reading Strategies', toolkit: 'language', gradeBands: ['3-5', '6-8'], isDefault: false },
  { kind: 'lang-writing-checklist', label: 'Writing Checklist', toolkit: 'language', gradeBands: ['3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-phonics', label: 'Phonics Decoder', toolkit: 'language', gradeBands: ['K-2'], isDefault: true },
  { kind: 'lang-root-morphology', label: 'Root & Morphology', toolkit: 'language', gradeBands: ['6-8', '9-12'], isDefault: false },
  { kind: 'lang-active-passive', label: 'Active & Passive Voice', toolkit: 'language', gradeBands: ['6-8', '9-12'], isDefault: false },
  { kind: 'lang-punctuation', label: 'Punctuation Practice', toolkit: 'language', gradeBands: ['3-5', '6-8'], isDefault: true },
  { kind: 'lang-story-elements', label: 'Story Elements Map', toolkit: 'language', gradeBands: ['3-5', '6-8'], isDefault: true },
  { kind: 'lang-persuasive-writing', label: 'Persuasive Writing', toolkit: 'language', gradeBands: ['6-8', '9-12'], isDefault: false },
  { kind: 'lang-vocab-flashcards', label: 'Vocab Flashcards', toolkit: 'language', gradeBands: ['3-5', '6-8', '9-12'], isDefault: false },
  { kind: 'lang-conjunctions', label: 'Conjunction Junction', toolkit: 'language', gradeBands: ['3-5', '6-8'], isDefault: false },
  { kind: 'lang-prefix-suffix', label: 'Prefix & Suffix', toolkit: 'language', gradeBands: ['3-5', '6-8'], isDefault: true },
]

// ============================================================
// Statistics Widgets (6 canvas kinds)
// ============================================================
const STATISTICS_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'stat-data-table', label: 'Data Table', toolkit: 'statistics', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'stat-histogram', label: 'Histogram Builder', toolkit: 'statistics', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'stat-box-plot', label: 'Box Plot Generator', toolkit: 'statistics', gradeBands: ['9-12'], isDefault: true },
  { kind: 'stat-scatter', label: 'Scatter Plot', toolkit: 'statistics', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'stat-normal-dist', label: 'Normal Distribution', toolkit: 'statistics', gradeBands: ['9-12'], isDefault: true },
  { kind: 'stat-probability', label: 'Probability Simulator', toolkit: 'statistics', gradeBands: ['6-8', '9-12'], isDefault: true },
]

// ============================================================
// Earth Science Widgets (6 canvas kinds)
// ============================================================
const EARTH_SCIENCE_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'earth-layers', label: 'Earth Layers', toolkit: 'earthscience', gradeBands: ['6-8'], isDefault: true },
  { kind: 'earth-plate-tectonics', label: 'Plate Tectonics', toolkit: 'earthscience', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'earth-rock-cycle', label: 'Rock Cycle', toolkit: 'earthscience', gradeBands: ['6-8'], isDefault: true },
  { kind: 'earth-water-cycle', label: 'Water Cycle', toolkit: 'earthscience', gradeBands: ['3-5', '6-8'], isDefault: true },
  { kind: 'earth-weather-map', label: 'Weather Map', toolkit: 'earthscience', gradeBands: ['3-5', '6-8'], isDefault: true },
  { kind: 'earth-solar-system', label: 'Solar System', toolkit: 'earthscience', gradeBands: ['3-5', '6-8'], isDefault: true },
]

// ============================================================
// Arts Widgets (4 canvas kinds)
// ============================================================
const ARTS_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'arts-color-theory', label: 'Color Theory Explorer', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-perspective-grid', label: 'Perspective Grid', toolkit: 'arts', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'arts-staff-notation', label: 'Staff Notation Builder', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-compare', label: 'Artwork Comparison', toolkit: 'arts', gradeBands: ['6-8', '9-12'], isDefault: true },
]

// ============================================================
// Classroom Widgets (3 canvas kinds)
// ============================================================
const CLASSROOM_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'classroom-timer', label: 'Timer', toolkit: 'classroom', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'classroom-random-picker', label: 'Random Picker', toolkit: 'classroom', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'classroom-graphing', label: 'Interactive Graphing', toolkit: 'classroom', gradeBands: ['6-8', '9-12'], isDefault: true },
]

// ============================================================
// AI Widgets (3 canvas kinds)
// ============================================================
const AI_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'ai-generate-similar', label: 'Generate Similar', toolkit: 'ai', gradeBands: ['3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'ai-reading-level', label: 'Reading Level Adapter', toolkit: 'ai', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'ai-draft-feedback', label: 'Draft Feedback', toolkit: 'ai', gradeBands: ['6-8', '9-12'], isDefault: true },
]

// ============================================================
// Combined Registry
// ============================================================

export const ALL_CANVAS_WIDGETS: CanvasWidgetEntry[] = [
  ...MATH_WIDGETS,
  ...PHYSICS_WIDGETS,
  ...CHEMISTRY_WIDGETS,
  ...BIOLOGY_WIDGETS,
  ...LANGUAGE_WIDGETS,
  ...STATISTICS_WIDGETS,
  ...EARTH_SCIENCE_WIDGETS,
  ...ARTS_WIDGETS,
  ...CLASSROOM_WIDGETS,
  ...AI_WIDGETS,
]

/** Map from widget kind to entry for O(1) lookup */
export const CANVAS_WIDGET_MAP: Record<string, CanvasWidgetEntry> = {}
for (const w of ALL_CANVAS_WIDGETS) {
  CANVAS_WIDGET_MAP[w.kind] = w
}

/** Get widgets for a specific toolkit */
export function getWidgetsForToolkit(toolkit: ToolkitId): CanvasWidgetEntry[] {
  return ALL_CANVAS_WIDGETS.filter(w => w.toolkit === toolkit)
}

/** Get default (always-visible) widget kinds */
export function getDefaultWidgetKinds(): Set<string> {
  return new Set(ALL_CANVAS_WIDGETS.filter(w => w.isDefault).map(w => w.kind))
}

/** Toolkit display labels */
export const TOOLKIT_LABELS: Record<ToolkitId, string> = {
  math: 'Math Tools',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  language: 'Language',
  statistics: 'Statistics',
  earthscience: 'Earth Science',
  arts: 'Arts & Music',
  classroom: 'Classroom',
  ai: 'AI Tools',
}

/** Toolkit icon names (matching WidgetToggleBar icons) */
export const TOOLKIT_ICONS: Record<ToolkitId, string> = {
  math: 'Calculator',
  physics: 'Zap',
  chemistry: 'Atom',
  biology: 'Leaf',
  language: 'Languages',
  statistics: 'BarChart3',
  earthscience: 'Globe',
  classroom: 'Timer',
  ai: 'Sparkles',
}
