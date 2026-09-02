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
  // Phase 3 new math widgets
  { kind: 'math-coin-counter', label: 'Coin Counter', toolkit: 'math', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'math-analog-clock', label: 'Analog Clock', toolkit: 'math', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'math-pattern-blocks', label: 'Pattern Blocks', toolkit: 'math', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'math-picture-graph', label: 'Picture Graph', toolkit: 'math', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'math-stats-toolbox', label: 'Stats Toolbox', toolkit: 'math', gradeBands: ['6-8'], isDefault: true },
  { kind: 'math-point-plotter', label: 'Point Plotter', toolkit: 'math', gradeBands: ['6-8'], isDefault: true },
  { kind: 'math-ratio-table', label: 'Ratio Table', toolkit: 'math', gradeBands: ['6-8'], isDefault: true },
  { kind: 'math-multi-function', label: 'Multi-Function Plotter', toolkit: 'math', gradeBands: ['9-12'], isDefault: true },
  { kind: 'math-derivative-visualizer', label: 'Derivative Visualizer', toolkit: 'math', gradeBands: ['9-12'], isDefault: true },
  { kind: 'math-conic-sections', label: 'Conic Sections', toolkit: 'math', gradeBands: ['9-12'], isDefault: true },
  { kind: 'math-log-exp-visualizer', label: 'Log & Exp Visualizer', toolkit: 'math', gradeBands: ['9-12'], isDefault: true },
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
  // Phase 3 new physics widgets
  { kind: 'phys-magnetism', label: 'Magnetism Simulator', toolkit: 'physics', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'phys-wave-interference', label: 'Wave Interference', toolkit: 'physics', gradeBands: ['9-12'], isDefault: true },
  // Batch 2 new physics widgets
  { kind: 'phys-rotational-motion', label: 'Rotational Motion', toolkit: 'physics', gradeBands: ['9-12'], isDefault: true },
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
  // Phase 3 new chemistry widgets
  { kind: 'chem-periodic-trends', label: 'Periodic Trends', toolkit: 'chemistry', gradeBands: ['9-12'], isDefault: true },
  { kind: 'chem-stoichiometry', label: 'Stoichiometry Calculator', toolkit: 'chemistry', gradeBands: ['9-12'], isDefault: true },
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
  // Phase 3 new biology widgets
  { kind: 'bio-food-chain', label: 'Food Chain Builder', toolkit: 'biology', gradeBands: ['3-5', '6-8'], isDefault: true },
  { kind: 'bio-plant-life-cycle', label: 'Plant Life Cycle', toolkit: 'biology', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'bio-meiosis', label: 'Meiosis Visualizer', toolkit: 'biology', gradeBands: ['9-12'], isDefault: true },
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
  // Phase 4 English widgets
  { kind: 'lang-sight-words', label: 'Sight Word Bank', toolkit: 'language', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'lang-cvc-sort', label: 'CVC Word Sort', toolkit: 'language', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'lang-fluency-timer', label: 'Fluency Timer', toolkit: 'language', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'lang-argument-organizer', label: 'Argumentative Writing Organizer', toolkit: 'language', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'lang-text-evidence', label: 'Text Evidence Highlighter', toolkit: 'language', gradeBands: ['6-8'], isDefault: true },
  { kind: 'lang-context-clues-exp', label: 'Context Clues Explorer', toolkit: 'language', gradeBands: ['3-5', '6-8'], isDefault: true },
  { kind: 'lang-semicolon-punct', label: 'Semicolon & Advanced Punctuation', toolkit: 'language', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'lang-rhetorical-analysis', label: 'Rhetorical Analysis Framework', toolkit: 'language', gradeBands: ['9-12'], isDefault: true },
  { kind: 'lang-logical-fallacies', label: 'Logical Fallacies Reference', toolkit: 'language', gradeBands: ['9-12'], isDefault: true },
  { kind: 'lang-citation-gen', label: 'MLA/APA Citation Generator', toolkit: 'language', gradeBands: ['9-12'], isDefault: true },
  { kind: 'lang-essay-outline', label: 'Essay Outline Builder', toolkit: 'language', gradeBands: ['9-12'], isDefault: true },
  { kind: 'lang-tts-preview', label: 'Text-to-Speech Preview', toolkit: 'language', gradeBands: ['6-8', '9-12'], isDefault: true },
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
  // Phase 3 new earth science widgets
  { kind: 'earth-states-matter', label: 'States of Matter', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8'], isDefault: true },
  { kind: 'earth-animal-habitats', label: 'Animal Habitats', toolkit: 'earthscience', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'earth-sink-float', label: 'Sink or Float', toolkit: 'earthscience', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'earth-scientific-method', label: 'Scientific Method', toolkit: 'earthscience', gradeBands: ['6-8'], isDefault: true },
  { kind: 'earth-data-collection', label: 'Data Collection', toolkit: 'earthscience', gradeBands: ['6-8'], isDefault: true },
  // Batch 2 new earth science widgets
  { kind: 'sci-simple-machines', label: 'Simple Machines Explorer', toolkit: 'earthscience', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'sci-solar-system', label: 'Solar System', toolkit: 'earthscience', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'sci-water-cycle', label: 'Water Cycle', toolkit: 'earthscience', gradeBands: ['3-5', '6-8'], isDefault: true },
  { kind: 'sci-rock-cycle', label: 'Rock Cycle', toolkit: 'earthscience', gradeBands: ['6-8'], isDefault: true },
  { kind: 'sci-observation-journal', label: 'Observation Journal', toolkit: 'earthscience', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'sci-weather-patterns', label: 'Weather Patterns', toolkit: 'earthscience', gradeBands: ['6-8'], isDefault: true },
  { kind: 'sci-dimensional-analysis', label: 'Dimensional Analysis', toolkit: 'earthscience', gradeBands: ['9-12'], isDefault: true },
  { kind: 'sci-lab-report', label: 'Lab Report Template', toolkit: 'earthscience', gradeBands: ['6-8', '9-12'], isDefault: true },
]

// ============================================================
// Arts Widgets (14 canvas kinds)
// ============================================================
const ARTS_WIDGETS: CanvasWidgetEntry[] = [
  // Phase 1 arts widgets
  { kind: 'arts-color-theory', label: 'Color Theory Explorer', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-perspective-grid', label: 'Perspective Grid', toolkit: 'arts', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'arts-staff-notation', label: 'Staff Notation Builder', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-compare', label: 'Artwork Comparison', toolkit: 'arts', gradeBands: ['6-8', '9-12'], isDefault: true },
  // Phase 4 arts widgets
  { kind: 'arts-elements-art', label: 'Elements of Art', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-symmetry-drawing', label: 'Symmetry Drawing Tool', toolkit: 'arts', gradeBands: ['K-2', '3-5'], isDefault: true },
  { kind: 'arts-rhythm-builder', label: 'Rhythm Builder', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8'], isDefault: true },
  { kind: 'arts-artist-spotlight', label: 'Artist Spotlight', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8'], isDefault: true },
  { kind: 'arts-art-timeline', label: 'Art History Timeline', toolkit: 'arts', gradeBands: ['3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-value-shading', label: 'Value & Shading Study', toolkit: 'arts', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'arts-compositional', label: 'Compositional Analysis', toolkit: 'arts', gradeBands: ['9-12'], isDefault: true },
  { kind: 'arts-criticism', label: 'Art Criticism Framework', toolkit: 'arts', gradeBands: ['9-12'], isDefault: true },
  { kind: 'arts-two-point-persp', label: 'Two-Point Perspective', toolkit: 'arts', gradeBands: ['9-12'], isDefault: true },
  { kind: 'arts-chord-progression', label: 'Chord Progression Builder', toolkit: 'arts', gradeBands: ['6-8', '9-12'], isDefault: true },
]

// ============================================================
// Classroom Widgets (3 canvas kinds)
// ============================================================
const CLASSROOM_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'classroom-timer', label: 'Timer', toolkit: 'classroom', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'classroom-random-picker', label: 'Random Picker', toolkit: 'classroom', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'classroom-graphing', label: 'Interactive Graphing', toolkit: 'classroom', gradeBands: ['6-8', '9-12'], isDefault: true },
  { kind: 'classroom-quiz', label: 'Interactive Quiz (L3)', toolkit: 'classroom', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
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
