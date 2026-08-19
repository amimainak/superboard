---
Task ID: 1
Agent: main
Task: Language widget redesign - architecture-first rebuild

Work Log:
- Read all existing language widget files (CanvasLanguageWidgets.tsx, LanguageToolkit.tsx, LanguageUtilities.tsx)
- Analyzed existing patterns: CanvasWidgetProps, useConfigUpdater, cs() style helper, WIDGET_COMPONENTS registry
- Identified key problems: panel and canvas had completely separate implementations with different data
- Designed unified architecture: single component used by both canvas (via config) and panel (via local state)

---
Task ID: 2
Agent: main
Task: Create punctuation exercises data file

Work Log:
- Created /src/data/punctuation-exercises.ts with types (PunctRule, Difficulty, GradeBand, PunctExercise)
- Added PUNCT_RULES metadata for 10 rules
- Added ~64 quality exercises across all rules, difficulties, and grade bands
- Implemented helper functions: getExercisesByFilter, shuffleExercises, getExerciseById, generateWrongVariants
- generateWrongVariants is key for teacher authoring mode

---
Task ID: 3
Agent: main
Task: Build unified PunctuationPractice widget

Work Log:
- Created /src/components/whiteboard/PunctuationPracticeWidget.tsx
- Student mode: filters (rule, difficulty, band), 3-option quiz, score tracking, explanation display
- Teacher mode: write correct sentence, auto-generate wrong variants, pick correct, add explanations, preview as student
- Custom exercises persisted in widget config
- Exports: PunctuationPracticeWidget, DEFAULT_PUNCT_CONFIG, PunctWidgetConfig

---
Task ID: 4
Agent: main
Task: Integrate PunctuationPractice into canvas and panel

Work Log:
- Updated CanvasLanguageWidgets.tsx: replaced old CanvasPunctuationPractice with bridge to unified component
- Updated LanguageToolkit.tsx: replaced PunctuationInteractivePanel with unified component + local state
- Updated default config and size for lang-punctuation widget kind

---
Task ID: 5
Agent: main
Task: Build unified VocabFlashcards widget

Work Log:
- Created /src/data/vocab-cards.ts with ~40 cards across K-5, 6-8, 9-12 levels and multiple POS tags
- Created /src/components/whiteboard/VocabFlashcardsWidget.tsx
- Study mode: flip cards, navigation, POS/level filters, shuffle
- Create mode: add custom cards with word, definition, example, POS tag
- Integrated into CanvasLanguageWidgets and LanguageToolkit panel

---
Task ID: 6
Agent: main
Task: Upgrade POS Tagger to use compromise

Work Log:
- Created /src/components/whiteboard/POSTaggerWidget.tsx using compromise NLP library
- Removed ~3000-word hand-rolled dictionary from CanvasLanguageWidgets.tsx
- Added advanced/basic toggle, POS explanations, skeleton view
- Panel now uses same unified component (was already using compromise, but now canvas matches)
- Integrated into CanvasLanguageWidgets and LanguageToolkit panel

---
Task ID: 7
Agent: main
Task: Build verification

Work Log:
- All TypeScript type checks pass (tsc --noEmit)
- Full Next.js production build succeeds
- No new errors introduced

Stage Summary:
- Established unified architecture pattern: data file + widget component + canvas bridge + panel bridge
- 3 widgets fully rebuilt: PunctuationPractice, VocabFlashcards, POSTagger
- Removed ~3000 lines of hardcoded POS dictionaries, replaced with compromise library
- All widgets work on both canvas (Add to Board) and in the side panel
- Teacher authoring flow implemented for Punctuation Practice
- Exercise banks organized by rule, difficulty, and grade band

---
Task ID: 2
Agent: main
Task: Build remaining 4 unified language widgets (Sentence Structure, Phonics, Sentence Expansion, Figurative Language)

Work Log:
- Read existing CanvasLanguageWidgets.tsx, LanguageToolkit.tsx, PunctuationPracticeWidget.tsx, VocabFlashcardsWidget.tsx, POSTaggerWidget.tsx to understand the approved architecture
- Created 4 data files with exercises organized by category/difficulty/grade band:
  - src/data/sentence-structure-exercises.ts (48 exercises, 4 types: simple/compound/complex/compound-complex)
  - src/data/phonics-exercises.ts (40 exercises, 4 categories: word-family/syllable-type/digraph-blend/sound-pattern)
  - src/data/sentence-expansion-exercises.ts (40 exercises, 5 types: add-adjectives/adverbs/prepositional/combine-sentences/add-clause)
  - src/data/figurative-language-exercises.ts (42 exercises, 6 types: simile/metaphor/personification/hyperbole/alliteration/onomatopoeia)
- Built 4 unified widget components with student practice + teacher authoring modes:
  - src/components/whiteboard/SentenceStructureWidget.tsx
  - src/components/whiteboard/PhonicsBuilderWidget.tsx
  - src/components/whiteboard/SentenceExpansionWidget.tsx
  - src/components/whiteboard/FigurativeLanguageWidget.tsx
- Updated CanvasLanguageWidgets.tsx: replaced inline SentenceBuilder and FigLangFinder with unified components, added CanvasPhonicsPractice and CanvasSentenceExpansion wrappers, updated registry/config/size/labels for 9 total lang widgets
- Updated CanvasWidgets.tsx: registered lang-phonics and lang-sentence-expansion in WIDGET_COMPONENTS, getDefaultWidgetConfig, getWidgetDefaultSize
- Updated LanguageToolkit.tsx: replaced 4 lazy-loaded panel wrappers with unified component wrappers (local state + compact mode), added 'Add to Board' buttons for Phonics and Sentence Expansion, updated section titles

Stage Summary:
- All 9 language widgets now follow unified canvas-primary architecture
- 6 exercise-based widgets have student practice + teacher authoring modes
- 3 interactive tools (POS Tagger, Story Elements Map, Paragraph Organizer) remain as-is
- Total exercise count: 170+ across all widgets
- Build passes with zero type errors and zero build errors
