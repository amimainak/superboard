// ============================================================
// Manipulative Registry
// ============================================================
// Central catalog of all manipulatives with metadata for
// the ManipulativePanel UI. Includes both existing and new
// manipulatives organized by subject category.
// ============================================================

export interface ManipulativeEntry {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  gradeBands: string[];
  icon: string;
  description: string;
}

export const MANIPULATIVE_REGISTRY: ManipulativeEntry[] = [
  // ============================================================
  // MATH
  // ============================================================
  {
    id: 'fraction-bar',
    name: 'Fraction Bars',
    category: 'MATH',
    subcategory: 'Fractions',
    gradeBands: ['3-5', '6-8'],
    icon: 'LayoutGrid',
    description: 'Visual fraction bars with customizable numerator/denominator',
  },
  {
    id: 'number-line',
    name: 'Number Line',
    category: 'MATH',
    subcategory: 'Number Sense',
    gradeBands: ['K-2', '3-5', '6-8'],
    icon: 'Minus',
    description: 'Customizable number line with tick marks and highlight values',
  },
  {
    id: 'base-ten-blocks',
    name: 'Base-Ten Blocks',
    category: 'MATH',
    subcategory: 'Place Value',
    gradeBands: ['K-2', '3-5'],
    icon: 'Box',
    description: 'Hundreds flats, tens rods, and ones cubes for place value',
  },
  {
    id: 'fraction-decimal-grid',
    name: 'Fraction→Decimal Grid',
    category: 'MATH',
    subcategory: 'Fractions',
    gradeBands: ['3-5', '6-8'],
    icon: 'Grid3x3',
    description: '10×10 grid showing fraction-to-decimal conversion via shading',
  },
  {
    id: 'geometry-compass',
    name: 'Geometry Compass',
    category: 'MATH',
    subcategory: 'Geometry',
    gradeBands: ['6-8', '9-12'],
    icon: 'Circle',
    description: 'Interactive compass with circle, radius line, and center point',
  },
  {
    id: 'protractor-tool',
    name: 'Protractor',
    category: 'MATH',
    subcategory: 'Measurement',
    gradeBands: ['4-6', '6-8'],
    icon: 'SemiCircle',
    description: 'Semi-circle protractor with degree markings every 10°',
  },
  {
    id: 'quadratic-graph',
    name: 'Quadratic Graph',
    category: 'MATH',
    subcategory: 'Algebra',
    gradeBands: ['8-10', '9-12'],
    icon: 'TrendingUp',
    description: 'XY axes with a parabola showing y=a(x-h)²+k',
  },
  {
    id: 'unit-circle',
    name: 'Unit Circle',
    category: 'MATH',
    subcategory: 'Trigonometry',
    gradeBands: ['9-12'],
    icon: 'RotateCw',
    description: 'Circle with sin, cos lines and labeled angle',
  },
  {
    id: 'slope-triangle',
    name: 'Slope Triangle',
    category: 'MATH',
    subcategory: 'Algebra',
    gradeBands: ['6-8', '9-12'],
    icon: 'Triangle',
    description: 'Right triangle on axes showing rise/run and slope calculation',
  },
  {
    id: 'box-plot',
    name: 'Box-and-Whisker Plot',
    category: 'MATH',
    subcategory: 'Statistics',
    gradeBands: ['6-8', '9-12'],
    icon: 'BarChart3',
    description: 'Statistical box plot with labeled min, Q1, median, Q3, max',
  },
  {
    id: 'stem-leaf-plot',
    name: 'Stem-and-Leaf Plot',
    category: 'MATH',
    subcategory: 'Statistics',
    gradeBands: ['4-6', '6-8'],
    icon: 'Table2',
    description: 'Stem and leaf display template for data organization',
  },

  // ============================================================
  // SCIENCE
  // ============================================================
  {
    id: 'molecular-model',
    name: 'Molecular Model',
    category: 'SCIENCE',
    subcategory: 'Chemistry',
    gradeBands: ['6-8', '9-12'],
    icon: 'Atom',
    description: 'Ball-and-stick molecular model representation',
  },
  {
    id: 'periodic-table-cell',
    name: 'Periodic Table Cell',
    category: 'SCIENCE',
    subcategory: 'Chemistry',
    gradeBands: ['6-8', '9-12'],
    icon: 'Grid2x2',
    description: 'Single periodic table element cell with atomic data',
  },
  {
    id: 'circuit-simple',
    name: 'Simple Circuit',
    category: 'SCIENCE',
    subcategory: 'Physics',
    gradeBands: ['4-6', '6-8'],
    icon: 'Zap',
    description: 'Basic electrical circuit with battery, wire, and bulb',
  },
  {
    id: 'force-diagram',
    name: 'Force Diagram',
    category: 'SCIENCE',
    subcategory: 'Physics',
    gradeBands: ['6-8', '9-12'],
    icon: 'ArrowUp',
    description: 'Free body diagram showing forces on an object',
  },
  {
    id: 'pendulum',
    name: 'Pendulum',
    category: 'SCIENCE',
    subcategory: 'Physics',
    gradeBands: ['6-8', '9-12'],
    icon: 'Clock',
    description: 'Pendulum diagram showing swing arc and forces',
  },
  {
    id: 'wave-form',
    name: 'Wave Form',
    category: 'SCIENCE',
    subcategory: 'Physics',
    gradeBands: ['6-8', '9-12'],
    icon: 'Waves',
    description: 'Sine wave with labeled amplitude, wavelength, and frequency',
  },
  {
    id: 'atom-model',
    name: 'Atom Model',
    category: 'SCIENCE',
    subcategory: 'Chemistry',
    gradeBands: ['4-6', '6-8'],
    icon: 'CircleDot',
    description: 'Bohr model atom with nucleus and electron shells',
  },
  {
    id: 'solar-system',
    name: 'Solar System',
    category: 'SCIENCE',
    subcategory: 'Earth Science',
    gradeBands: ['3-5', '6-8'],
    icon: 'Sun',
    description: 'Sun and 8 planets in orbital paths',
  },
  {
    id: 'rock-cycle',
    name: 'Rock Cycle',
    category: 'SCIENCE',
    subcategory: 'Earth Science',
    gradeBands: ['4-6', '6-8'],
    icon: 'RefreshCw',
    description: 'Circular diagram: igneous→sedimentary→metamorphic',
  },
  {
    id: 'water-cycle',
    name: 'Water Cycle',
    category: 'SCIENCE',
    subcategory: 'Earth Science',
    gradeBands: ['3-5', '4-6'],
    icon: 'CloudRain',
    description: 'Evaporation, condensation, precipitation, collection diagram',
  },
  {
    id: 'food-chain',
    name: 'Food Chain',
    category: 'SCIENCE',
    subcategory: 'Biology',
    gradeBands: ['3-5', '6-8'],
    icon: 'ArrowDown',
    description: 'Producer→primary→secondary→tertiary consumer chain',
  },
  {
    id: 'human-heart',
    name: 'Human Heart',
    category: 'SCIENCE',
    subcategory: 'Biology',
    gradeBands: ['6-8', '9-12'],
    icon: 'Heart',
    description: 'Simplified heart with 4 chambers and blood flow arrows',
  },
  {
    id: 'ph-scale',
    name: 'pH Scale',
    category: 'SCIENCE',
    subcategory: 'Chemistry',
    gradeBands: ['6-8', '9-12'],
    icon: 'Thermometer',
    description: 'Color gradient scale 0-14 with acid/base labels',
  },

  // ============================================================
  // LANGUAGE
  // ============================================================
  {
    id: 'phoneme-cards',
    name: 'Phoneme Cards',
    category: 'LANGUAGE',
    subcategory: 'Phonics',
    gradeBands: ['K-2'],
    icon: 'CreditCard',
    description: 'Individual phoneme sound cards for blending practice',
  },
  {
    id: 'sentence-builder',
    name: 'Sentence Builder',
    category: 'LANGUAGE',
    subcategory: 'Grammar',
    gradeBands: ['K-2', '3-5'],
    icon: 'Type',
    description: 'Color-coded word cards for building sentences',
  },
  {
    id: 'story-map',
    name: 'Story Map',
    category: 'LANGUAGE',
    subcategory: 'Reading',
    gradeBands: ['3-5', '6-8'],
    icon: 'Map',
    description: 'Story elements map: setting, characters, plot, theme',
  },
  {
    id: 'punctuation-cards',
    name: 'Punctuation Cards',
    category: 'LANGUAGE',
    subcategory: 'Grammar',
    gradeBands: ['1-3', '3-5'],
    icon: 'Hash',
    description: 'Punctuation mark cards with usage examples',
  },
  {
    id: 'word-web',
    name: 'Word Web',
    category: 'LANGUAGE',
    subcategory: 'Vocabulary',
    gradeBands: ['3-5', '6-8'],
    icon: 'Network',
    description: 'Central word with radiating synonyms/antonyms branches',
  },
  {
    id: 'writing-paragraph',
    name: 'Hamburger Paragraph',
    category: 'LANGUAGE',
    subcategory: 'Writing',
    gradeBands: ['3-5', '6-8'],
    icon: 'Layers',
    description: 'Topic sentence, details, and conclusion paragraph model',
  },
  {
    id: 'grammar-tree',
    name: 'Grammar Tree',
    category: 'LANGUAGE',
    subcategory: 'Grammar',
    gradeBands: ['6-8', '9-12'],
    icon: 'GitBranch',
    description: 'Sentence parse tree diagram (S→NP VP→Det N V)',
  },
  {
    id: 'spiral-curriculum',
    name: 'Spiral Curriculum',
    category: 'LANGUAGE',
    subcategory: 'Pedagogy',
    gradeBands: ['3-5', '6-8', '9-12'],
    icon: 'RefreshCcw',
    description: 'Spiral showing review of concepts at increasing depth',
  },

  // ============================================================
  // SOCIAL STUDIES
  // ============================================================
  {
    id: 'map-grid',
    name: 'Map Grid',
    category: 'SOCIAL_STUDIES',
    subcategory: 'Geography',
    gradeBands: ['3-5', '6-8'],
    icon: 'Grid3x3',
    description: 'Coordinate grid overlay for map reading practice',
  },
  {
    id: 'timeline-bar',
    name: 'Timeline',
    category: 'SOCIAL_STUDIES',
    subcategory: 'History',
    gradeBands: ['3-5', '6-8', '9-12'],
    icon: 'ArrowRight',
    description: 'Horizontal timeline with event markers',
  },
  {
    id: 'sorting-matrix',
    name: 'Sorting Matrix',
    category: 'SOCIAL_STUDIES',
    subcategory: 'Analysis',
    gradeBands: ['3-5', '6-8'],
    icon: 'LayoutList',
    description: 'Categorization grid for sorting concepts',
  },
  {
    id: 'world-map-continent',
    name: 'World Map',
    category: 'SOCIAL_STUDIES',
    subcategory: 'Geography',
    gradeBands: ['3-5', '6-8'],
    icon: 'Globe',
    description: 'Simplified continent outlines with labels and equator',
  },
  {
    id: 'government-branches',
    name: 'Government Branches',
    category: 'SOCIAL_STUDIES',
    subcategory: 'Civics',
    gradeBands: ['4-6', '6-8', '9-12'],
    icon: 'Building',
    description: 'Three-branch tree: Executive, Legislative, Judicial',
  },
  {
    id: 'economic-cycle',
    name: 'Economic Cycle',
    category: 'SOCIAL_STUDIES',
    subcategory: 'Economics',
    gradeBands: ['6-8', '9-12'],
    icon: 'Repeat',
    description: 'Circular flow: production→income→spending→production',
  },

  // ============================================================
  // TEST PREP
  // ============================================================
  {
    id: 'answer-grid-bubble',
    name: 'Bubble Sheet',
    category: 'TEST_PREP',
    subcategory: 'Answer Tools',
    gradeBands: ['6-8', '9-12'],
    icon: 'CircleDot',
    description: 'SAT/ACT style A-E bubble answer grid',
  },
  {
    id: 'test-strategy-clock',
    name: 'Time Management Clock',
    category: 'TEST_PREP',
    subcategory: 'Strategy',
    gradeBands: ['6-8', '9-12'],
    icon: 'Timer',
    description: 'Pie chart for test section time allocation strategy',
  },
  {
    id: 'elimination-board',
    name: 'Elimination Board',
    category: 'TEST_PREP',
    subcategory: 'Strategy',
    gradeBands: ['6-8', '9-12'],
    icon: 'XCircle',
    description: '4 answer choice cards for process of elimination',
  },

  // ============================================================
  // MUSIC
  // ============================================================
  {
    id: 'treble-clef-staff',
    name: 'Treble Clef Staff',
    category: 'MUSIC',
    subcategory: 'Notation',
    gradeBands: ['3-5', '6-8', '9-12'],
    icon: 'Music',
    description: '5-line staff with treble clef and labeled notes',
  },
  {
    id: 'rhythm-grid',
    name: 'Rhythm Grid',
    category: 'MUSIC',
    subcategory: 'Rhythm',
    gradeBands: ['3-5', '6-8'],
    icon: 'Drum',
    description: 'Grid showing whole, half, quarter, and eighth note values',
  },

  // ============================================================
  // GENERAL / CROSS-SUBJECT
  // ============================================================
  {
    id: 'coordinate-plane',
    name: 'Coordinate Plane',
    category: 'MATH',
    subcategory: 'Algebra',
    gradeBands: ['5-7', '6-8', '9-12'],
    icon: 'Crosshair',
    description: 'Standard XY coordinate plane with grid',
  },
  {
    id: 'pie-chart',
    name: 'Pie Chart',
    category: 'MATH',
    subcategory: 'Statistics',
    gradeBands: ['3-5', '6-8'],
    icon: 'PieChart',
    description: 'Circular chart with labeled segments',
  },
  {
    id: 'venn-diagram',
    name: 'Venn Diagram',
    category: 'GENERAL',
    subcategory: 'Graphic Organizer',
    gradeBands: ['3-5', '6-8', '9-12'],
    icon: 'Circle',
    description: 'Overlapping circles for comparing concepts',
  },
  {
    id: 'fraction-circle',
    name: 'Fraction Circles',
    category: 'MATH',
    subcategory: 'Fractions',
    gradeBands: ['K-2', '3-5'],
    icon: 'PieChart',
    description: 'Circular fraction model with shaded sectors',
  },
  {
    id: 'angle-measurer',
    name: 'Angle Measurer',
    category: 'MATH',
    subcategory: 'Geometry',
    gradeBands: ['4-6', '6-8'],
    icon: 'RotateCw',
    description: 'Interactive angle with degree measurement display',
  },
  {
    id: 'probability-spinner',
    name: 'Probability Spinner',
    category: 'MATH',
    subcategory: 'Probability',
    gradeBands: ['3-5', '6-8'],
    icon: 'Loader',
    description: 'Color-coded spinner for probability experiments',
  },
  {
    id: 'algebra-tile',
    name: 'Algebra Tiles',
    category: 'MATH',
    subcategory: 'Algebra',
    gradeBands: ['6-8', '9-12'],
    icon: 'Square',
    description: 'Colored tiles representing x, x², 1, -x, -x², -1',
  },
  {
    id: 'clock-face',
    name: 'Clock Face',
    category: 'MATH',
    subcategory: 'Measurement',
    gradeBands: ['K-2', '3-5'],
    icon: 'Clock',
    description: 'Analog clock with movable hour and minute hands',
  },
  {
    id: 'bar-chart',
    name: 'Bar Chart',
    category: 'MATH',
    subcategory: 'Statistics',
    gradeBands: ['3-5', '6-8'],
    icon: 'BarChart',
    description: 'Simple bar chart for data visualization',
  },
  {
    id: 'tangram',
    name: 'Tangram',
    category: 'MATH',
    subcategory: 'Geometry',
    gradeBands: ['K-2', '3-5'],
    icon: 'Puzzle',
    description: '7-piece tangram puzzle for spatial reasoning',
  },
  {
    id: 'pattern-blocks',
    name: 'Pattern Blocks',
    category: 'MATH',
    subcategory: 'Geometry',
    gradeBands: ['K-2', '3-5'],
    icon: 'Hexagon',
    description: 'Colored geometric shapes for pattern creation',
  },
];

// ---- Utility functions ----

/**
 * Get all manipulatives for a given subject category.
 */
export function getManipulativesForSubject(subject: string): ManipulativeEntry[] {
  return MANIPULATIVE_REGISTRY.filter((m) => m.category === subject);
}

/**
 * Get all unique categories in the registry.
 */
export function getCategories(): string[] {
  const cats = new Set(MANIPULATIVE_REGISTRY.map((m) => m.category));
  return Array.from(cats);
}

/**
 * Get all unique subcategories for a given category.
 */
export function getSubcategories(category: string): string[] {
  const subs = new Set(
    MANIPULATIVE_REGISTRY.filter((m) => m.category === category).map((m) => m.subcategory)
  );
  return Array.from(subs);
}

/**
 * Fuzzy search manipulatives by name, category, subcategory, or description.
 */
export function searchManipulatives(query: string): ManipulativeEntry[] {
  if (!query || query.trim().length === 0) return MANIPULATIVE_REGISTRY;
  const q = query.toLowerCase().trim();
  return MANIPULATIVE_REGISTRY.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.subcategory.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
  );
}

/**
 * Map a Subject type to the registry category strings used.
 */
export const SUBJECT_CATEGORY_MAP: Record<string, string> = {
  MATH: 'MATH',
  SCIENCE: 'SCIENCE',
  LANGUAGE: 'LANGUAGE',
  SOCIAL_STUDIES: 'SOCIAL_STUDIES',
  TEST_PREP: 'TEST_PREP',
  MUSIC: 'MUSIC',
  GENERAL: 'GENERAL',
  CODING: 'GENERAL',
  ART: 'GENERAL',
  ESL: 'LANGUAGE',
};

/**
 * Get the primary category for a given Subject, plus GENERAL as fallback.
 */
export function getCategoriesForSubject(subject: string): string[] {
  const primary = SUBJECT_CATEGORY_MAP[subject] || 'GENERAL';
  const categories = [primary];
  if (primary !== 'GENERAL') categories.push('GENERAL');
  return categories;
}
