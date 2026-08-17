# Task 2a Work Record: Recording Widget

## Status: COMPLETED

## Files Created
- `src/components/room/widgets/RecordingWidget.tsx` — Main widget component (~290 lines)

## Files Modified
- `src/lib/room/widget-store.ts` — Added `recording` to WidgetId union, added Recording to AVAILABLE_WIDGETS
- `src/components/room/widgets/WidgetPanel.tsx` — Imported RecordingWidget, added case in renderWidget switch
- `src/components/room/widgets/WidgetToggleBar.tsx` — Added RecordCircle icon SVG
- `src/components/room/widgets/widgets.css` — Added ~360 lines of recording widget CSS
- `src/components/room/widgets/index.ts` — Added RecordingWidget export
- `worklog.md` — Appended task 2a work log

## Key Design Decisions
1. **SVG-to-canvas approach** instead of getDisplayMedia() — avoids screen-sharing dialog popup
2. **Ref-based rAF loop** — avoids React 19 lint rule about circular useCallback dependencies
3. **Lazy useState initializer** for isTutor — avoids set-state-in-effect lint error
4. **No external dependencies** — uses only browser-native MediaRecorder, canvas, XMLSerializer APIs
5. **COPPA-compliant** — all data stays in browser memory (Blob), nothing uploaded to server

## Lint Status
- Zero new lint errors from all changes (verified with `bun run lint`)

## Integration Points
- Toggle button appears in "Collaborate" section of WidgetToggleBar
- Opens in right-side widget panel with tab, consistent with all other widgets
- Finds SVG via `.whiteboard-root svg` CSS selector
- Audio capture is best-effort from any `<audio>`/`<video>` DOM elements
