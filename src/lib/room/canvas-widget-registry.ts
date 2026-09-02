// ============================================================
// Superboard — Canvas Widget Registry
// Centralized catalog of ALL canvas widget kinds
// ============================================================

export type ToolkitId = 'math' | 'physics' | 'chemistry' | 'biology' | 'language' | 'statistics' | 'earthscience' | 'arts' | 'classroom' | 'ai'

export type CanvasWidgetEntry = {
  kind: string
  label: string
  toolkit: ToolkitId
  gradeBands: Array<'K-2' | '3-5' | '6-8' | '9-12'>
  isDefault: boolean
}

// ============================================================
// Math Tools Widgets (35 kinds)
// ============================================================
const MATH_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'math-analog-clock', label: 'math-analog-clock', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-angle-maker', label: 'math-angle-maker', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-bar-chart', label: 'math-bar-chart', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-base-10', label: 'math-base-10', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-calculator', label: 'math-calculator', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-clock', label: 'math-clock', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-coin-counter', label: 'math-coin-counter', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-compass', label: 'math-compass', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-conic-sections', label: 'math-conic-sections', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-coordinate-plane', label: 'math-coordinate-plane', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-derivative-visualizer', label: 'math-derivative-visualizer', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-flashcards', label: 'math-flashcards', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-formula-reference', label: 'math-formula-reference', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-fraction-bar', label: 'math-fraction-bar', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-fraction-circle', label: 'math-fraction-circle', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-function-plotter', label: 'math-function-plotter', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-log-exp-visualizer', label: 'math-log-exp-visualizer', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-multi-function', label: 'math-multi-function', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-multiplication-array', label: 'math-multiplication-array', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-multiplication-grid', label: 'math-multiplication-grid', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-number-line', label: 'math-number-line', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-pattern-blocks', label: 'math-pattern-blocks', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-picture-graph', label: 'math-picture-graph', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-pie-chart', label: 'math-pie-chart', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-place-value', label: 'math-place-value', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-point-plotter', label: 'math-point-plotter', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-polygon', label: 'math-polygon', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-proof-builder', label: 'math-proof-builder', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-protractor', label: 'math-protractor', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-ratio-table', label: 'math-ratio-table', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-ruler', label: 'math-ruler', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-set-square', label: 'math-set-square', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-stats-toolbox', label: 'math-stats-toolbox', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-unit-converter', label: 'math-unit-converter', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'math-venn-diagram', label: 'math-venn-diagram', toolkit: 'math', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
]

// ============================================================
// Physics Widgets (14 kinds)
// ============================================================
const PHYSICS_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'phys-circuit-diagram', label: 'phys-circuit-diagram', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-energy-bar-charts', label: 'phys-energy-bar-charts', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-formula-calc', label: 'phys-formula-calc', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-free-body-diagram', label: 'phys-free-body-diagram', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-interactive-graphing', label: 'phys-interactive-graphing', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-magnetism', label: 'phys-magnetism', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-ohms-law', label: 'phys-ohms-law', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-pendulum-sim', label: 'phys-pendulum-sim', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-projectile-sim', label: 'phys-projectile-sim', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-ray-diagram', label: 'phys-ray-diagram', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-rotational-motion', label: 'phys-rotational-motion', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-unit-converter', label: 'phys-unit-converter', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-wave-interference', label: 'phys-wave-interference', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'phys-wave-sim', label: 'phys-wave-sim', toolkit: 'physics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
]

// ============================================================
// Chemistry Widgets (12 kinds)
// ============================================================
const CHEMISTRY_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'chem-equation-balancer', label: 'chem-equation-balancer', toolkit: 'chemistry', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'chem-gas-laws', label: 'chem-gas-laws', toolkit: 'chemistry', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'chem-ion-formation', label: 'chem-ion-formation', toolkit: 'chemistry', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'chem-lewis-dot', label: 'chem-lewis-dot', toolkit: 'chemistry', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'chem-molar-mass', label: 'chem-molar-mass', toolkit: 'chemistry', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'chem-periodic-table', label: 'chem-periodic-table', toolkit: 'chemistry', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'chem-periodic-trends', label: 'chem-periodic-trends', toolkit: 'chemistry', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'chem-ph-scale', label: 'chem-ph-scale', toolkit: 'chemistry', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'chem-sci-notation', label: 'chem-sci-notation', toolkit: 'chemistry', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'chem-stoichiometry', label: 'chem-stoichiometry', toolkit: 'chemistry', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'chem-titration', label: 'chem-titration', toolkit: 'chemistry', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'chem-vsepr', label: 'chem-vsepr', toolkit: 'chemistry', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
]

// ============================================================
// Biology Widgets (13 kinds)
// ============================================================
const BIOLOGY_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'bio-body-systems', label: 'bio-body-systems', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'bio-cell-diagram', label: 'bio-cell-diagram', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'bio-cell-division', label: 'bio-cell-division', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'bio-dna-structure', label: 'bio-dna-structure', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'bio-food-chain', label: 'bio-food-chain', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'bio-food-web', label: 'bio-food-web', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'bio-human-body', label: 'bio-human-body', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'bio-meiosis', label: 'bio-meiosis', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'bio-natural-selection', label: 'bio-natural-selection', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'bio-photosynthesis-resp', label: 'bio-photosynthesis-resp', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'bio-plant-life-cycle', label: 'bio-plant-life-cycle', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'bio-punnett-square', label: 'bio-punnett-square', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'bio-taxonomy', label: 'bio-taxonomy', toolkit: 'biology', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
]

// ============================================================
// Language Widgets (21 kinds)
// ============================================================
const LANGUAGE_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'lang-argument-organizer', label: 'lang-argument-organizer', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-citation-gen', label: 'lang-citation-gen', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-context-clues-exp', label: 'lang-context-clues-exp', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-cvc-sort', label: 'lang-cvc-sort', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-essay-outline', label: 'lang-essay-outline', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-figurative-language', label: 'lang-figurative-language', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-fluency-timer', label: 'lang-fluency-timer', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-logical-fallacies', label: 'lang-logical-fallacies', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-paragraph-organizer', label: 'lang-paragraph-organizer', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-phonics', label: 'lang-phonics', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-pos-tagger', label: 'lang-pos-tagger', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-punctuation', label: 'lang-punctuation', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-rhetorical-analysis', label: 'lang-rhetorical-analysis', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-semicolon-punct', label: 'lang-semicolon-punct', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-sentence-expansion', label: 'lang-sentence-expansion', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-sentence-structure', label: 'lang-sentence-structure', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-sight-words', label: 'lang-sight-words', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-story-elements', label: 'lang-story-elements', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-text-evidence', label: 'lang-text-evidence', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-tts-preview', label: 'lang-tts-preview', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'lang-vocab-flashcards', label: 'lang-vocab-flashcards', toolkit: 'language', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
]

// ============================================================
// Statistics Widgets (6 kinds)
// ============================================================
const STATISTICS_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'stat-box-plot', label: 'stat-box-plot', toolkit: 'statistics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'stat-data-table', label: 'stat-data-table', toolkit: 'statistics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'stat-histogram', label: 'stat-histogram', toolkit: 'statistics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'stat-normal-dist', label: 'stat-normal-dist', toolkit: 'statistics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'stat-probability', label: 'stat-probability', toolkit: 'statistics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'stat-scatter', label: 'stat-scatter', toolkit: 'statistics', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
]

// ============================================================
// Earth Science Widgets (19 kinds)
// ============================================================
const EARTHSCIENCE_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'earth-animal-habitats', label: 'earth-animal-habitats', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'earth-data-collection', label: 'earth-data-collection', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'earth-plate-tectonics', label: 'earth-plate-tectonics', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'earth-rock-cycle', label: 'earth-rock-cycle', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'earth-scientific-method', label: 'earth-scientific-method', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'earth-sink-float', label: 'earth-sink-float', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'earth-solar-system', label: 'earth-solar-system', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'earth-states-matter', label: 'earth-states-matter', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'earth-topographic-map', label: 'earth-topographic-map', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'earth-water-carbon-cycle', label: 'earth-water-carbon-cycle', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'earth-weather-map', label: 'earth-weather-map', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'sci-dimensional-analysis', label: 'sci-dimensional-analysis', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'sci-lab-report', label: 'sci-lab-report', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'sci-observation-journal', label: 'sci-observation-journal', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'sci-rock-cycle', label: 'sci-rock-cycle', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'sci-simple-machines', label: 'sci-simple-machines', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'sci-solar-system', label: 'sci-solar-system', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'sci-water-cycle', label: 'sci-water-cycle', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'sci-weather-patterns', label: 'sci-weather-patterns', toolkit: 'earthscience', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
]

// ============================================================
// Arts & Music Widgets (14 kinds)
// ============================================================
const ARTS_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'arts-art-timeline', label: 'arts-art-timeline', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-artist-spotlight', label: 'arts-artist-spotlight', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-chord-progression', label: 'arts-chord-progression', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-color-theory', label: 'arts-color-theory', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-compare', label: 'arts-compare', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-compositional', label: 'arts-compositional', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-criticism', label: 'arts-criticism', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-elements-art', label: 'arts-elements-art', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-perspective-grid', label: 'arts-perspective-grid', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-rhythm-builder', label: 'arts-rhythm-builder', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-staff-notation', label: 'arts-staff-notation', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-symmetry-drawing', label: 'arts-symmetry-drawing', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-two-point-persp', label: 'arts-two-point-persp', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'arts-value-shading', label: 'arts-value-shading', toolkit: 'arts', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
]

// ============================================================
// Classroom Widgets (4 kinds)
// ============================================================
const CLASSROOM_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'classroom-graphing', label: 'classroom-graphing', toolkit: 'classroom', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'classroom-quiz', label: 'classroom-quiz', toolkit: 'classroom', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'classroom-random-picker', label: 'classroom-random-picker', toolkit: 'classroom', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'classroom-timer', label: 'classroom-timer', toolkit: 'classroom', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
]

// ============================================================
// AI Tools Widgets (3 kinds)
// ============================================================
const AI_WIDGETS: CanvasWidgetEntry[] = [
  { kind: 'ai-draft-feedback', label: 'ai-draft-feedback', toolkit: 'ai', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'ai-generate-similar', label: 'ai-generate-similar', toolkit: 'ai', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
  { kind: 'ai-reading-level', label: 'ai-reading-level', toolkit: 'ai', gradeBands: ['K-2', '3-5', '6-8', '9-12'], isDefault: true },
]

export const ALL_CANVAS_WIDGETS: CanvasWidgetEntry[] = [
  ...MATH_WIDGETS,
  ...PHYSICS_WIDGETS,
  ...CHEMISTRY_WIDGETS,
  ...BIOLOGY_WIDGETS,
  ...LANGUAGE_WIDGETS,
  ...STATISTICS_WIDGETS,
  ...EARTHSCIENCE_WIDGETS,
  ...ARTS_WIDGETS,
  ...CLASSROOM_WIDGETS,
  ...AI_WIDGETS,
]

export const CANVAS_WIDGET_MAP: Record<string, CanvasWidgetEntry> = {}
for (const w of ALL_CANVAS_WIDGETS) {
  CANVAS_WIDGET_MAP[w.kind] = w
}

export function getWidgetsForToolkit(toolkit: ToolkitId): CanvasWidgetEntry[] {
  return ALL_CANVAS_WIDGETS.filter(w => w.toolkit === toolkit)
}

export function getDefaultWidgetKinds(): Set<string> {
  return new Set(ALL_CANVAS_WIDGETS.filter(w => w.isDefault).map(w => w.kind))
}

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

export const TOOLKIT_ICONS: Record<ToolkitId, string> = {
  math: 'Calculator',
  physics: 'Zap',
  chemistry: 'Atom',
  biology: 'Leaf',
  language: 'Languages',
  statistics: 'BarChart3',
  earthscience: 'Globe',
  arts: 'Palette',
  classroom: 'Timer',
  ai: 'Sparkles',
}
