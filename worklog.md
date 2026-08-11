---
Task ID: 1
Agent: main
Task: Sprint 1 — Implement session controls, accessibility, PDF export, and question bank

Work Log:
- Analyzed current codebase: useFocusMode stubs, app-store, FabricCanvas, Whiteboard, Toolbar, SessionTimer, PageSidebar, useYjsProvider, useYjsCanvasSync
- Updated Zustand store (app-store.ts) with new state: penFreeze, scratchpadOpen, accessibilityMode, colorBlindMode + actions
- Created SessionControls.tsx: tutor-only panel with Focus Mode, Pen Freeze, Scratchpad, Accessibility popover (font modes + color-blind modes)
- Rewrote useFocusMode.ts: wired viewport broadcast via Yjs awareness.setLocalStateField('viewport'), debounced 50ms, student-side awareness listener for viewport receive
- Updated FabricCanvas/index.tsx: new props (appliedViewport, focusMode, isScratchpad), viewport broadcast effect (tutor side), viewport apply effect (student side)
- Updated useYjsCanvasSync.ts: added mapKeyPrefix prop for scratchpad support (uses 'scratchpad-shapes' vs 'page-shapes')
- Updated Whiteboard.tsx: integrated all Sprint 1 controls, awareness listener for tutor viewport, student banners for focus/freeze/scratchpad states
- Added QuestionItem model to Prisma schema with subject/gradeBand/topic/difficulty/curriculum/standardCode/stem/LaTeX/SVG/solution fields
- Created /api/questions GET route with filtering by subject, gradeBand, topic, difficulty, curriculum
- Created seed-questions.ts with 20 math + 3 science questions across all grade bands (K-2, 3-5, 6-8, 9-12)
- Created canvas-export.ts with openCanvasForPrint (browser print-to-PDF), downloadCanvasAsPng, and useCanvasExport hook

Stage Summary:
- Feature 1 (Bring All to Me): Fully wired via Yjs awareness viewport broadcast/receive
- Feature 2 (Pen Freeze): Toggle in SessionControls, sets readOnly on students
- Feature 3 (Private Scratchpad): Separate Yjs map key, tutor-only toggle with visual indicator
- Feature 4 (Accessibility): 4 modes (normal, dyslexia, high-contrast, large-text) in popover
- Feature 5 (Color-Blindness): 4 modes (none, protanopia, deuteranopia, tritanopia) in popover
- Feature 6 (Living Notes): canvas-export.ts with print-to-PDF, PNG download, brandable headers
- Feature 7 (Question Bank): Prisma model + API route + 23 seed questions across MATH/SCIENCE
