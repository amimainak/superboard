---
Task ID: 1
Agent: Main
Task: Replace tldraw v5 with custom Fabric.js whiteboard

Work Log:
- Analyzed tldraw v5 integration (3 files: TldrawCanvas.tsx, Whiteboard.tsx, FileAttachmentsBar.tsx)
- Installed fabric@6.9.1 and perfect-freehand@1.2.3
- Created FabricCanvas/index.tsx — main canvas component with:
  - Freehand drawing, rectangle, ellipse, line, arrow tools
  - IText for inline text editing
  - Object eraser (click to remove)
  - Pan (hand tool + middle click) and zoom (mouse wheel)
  - Read-only mode for student focus lockout
  - ResizeObserver for responsive canvas
- Created FabricCanvas/hooks.ts — useCanvasTools, useCanvasHistory, useKeyboardShortcuts
- Created FabricCanvas/useYjsCanvasSync.ts — per-object Yjs CRDT sync:
  - Same per-record format as original tldraw sync
  - 200ms debounced batch writes, dirty-set conflict resolution
  - Version counters per object
- Modified Whiteboard.tsx — swapped TldrawCanvas for FabricCanvas
- Modified FileAttachmentsBar.tsx — replaced tldraw API calls with Fabric.js equivalents
- Fixed all TypeScript compilation errors
- Build verified: `next build` passes cleanly
- Committed and pushed to GitHub

Stage Summary:
- Custom whiteboard built with Fabric.js v6 + perfect-freehand
- No license required (MIT) — replaces paid tldraw v5
- ~60% of surrounding components needed zero changes
- Yjs sync layer adapted from original tldraw sync engine
- TldrawCanvas.tsx kept as fallback reference
- Deployed to Vercel via GitHub push
