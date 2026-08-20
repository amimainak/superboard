# Task: Replace GeoGebra with Mafs for Function Plotter

## Summary
Successfully replaced the GeoGebra graphing calculator panel with a Mafs-based Function Plotter widget. The new widget is a proper on-canvas interactive widget following existing patterns, not a side panel.

## What was done
1. Explored codebase architecture for widgets, toolkits, and GeoGebra references
2. Installed `mafs` (MIT licensed) via npm
3. Created `CanvasFunctionPlotter` component using Mafs (Mafs, Coordinates.Cartesian, Plot.OfX, Text)
4. Registered widget in WIDGET_COMPONENTS, getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS
5. Added to MathToolkit CANVAS_TOOLS with bands ['all', 'middle', 'highschool']
6. Added 'math-function-plotter' to ToolId type union
7. Removed GeoGebra from: WidgetPanel.tsx (import + render case), widget-store.ts (type + AVAILABLE_WIDGETS), widget-registry.ts (CORE_WIDGETS entry), index.ts (barrel export), features.ts (feature name + config), dashboard/page.tsx (marketing text), pricing/page.tsx (feature row), widgets.css (dark + light styles)
8. Deleted GeoGebraPanel.tsx entirely
9. Build compiles cleanly with `npx next build`

## Files Modified
- `src/components/whiteboard/CanvasMathWidgets.tsx` — Added Mafs import, CanvasFunctionPlotter component, registry entries
- `src/components/whiteboard/CanvasWidgets.tsx` — Registered in WIDGET_COMPONENTS, getDefaultWidgetConfig, getWidgetDefaultSize
- `src/components/room/widgets/MathToolkit.tsx` — Added to CANVAS_TOOLS array
- `src/lib/whiteboard/types.ts` — Added 'math-function-plotter' to ToolId union
- `src/components/room/widgets/WidgetPanel.tsx` — Removed GeoGebraPanel import and case
- `src/lib/room/widget-store.ts` — Removed 'geogebra' from WidgetId union and AVAILABLE_WIDGETS
- `src/lib/room/widget-registry.ts` — Removed geogebra entry from CORE_WIDGETS
- `src/components/room/widgets/index.ts` — Removed GeoGebraPanel barrel export
- `src/lib/features.ts` — Replaced 'geogebra' feature with 'function_plotter'
- `src/app/dashboard/page.tsx` — Removed GeoGebra from marketing text
- `src/app/pricing/page.tsx` — Replaced GeoGebra pricing row with Function Plotter
- `src/components/room/widgets/widgets.css` — Removed all GeoGebra CSS (dark + light)

## Files Deleted
- `src/components/room/widgets/GeoGebraPanel.tsx` — Entire file removed

## Files Created
None (all changes were edits to existing files)

## Compilation Issues
1. `Cartesian` is not directly exported from 'mafs' — it's accessed via `Coordinates.Cartesian`
2. Axis options use `axis: boolean`, `lines: number | false`, `labels: LabelMaker` — not object-style stroke props
3. `Plot.OfX` uses `weight` not `strokeWidth` for line thickness
4. `Text` component uses `attach` (CardinalDirection) not `anchorX`/`anchorY`
5. `math-function-plotter` needed to be added to the ToolId type union in types.ts

All issues were resolved and the build compiles cleanly.