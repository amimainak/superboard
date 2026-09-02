# Task 3: Build 9 Missing Phase 3 Science Canvas Widgets

## Summary
Built 9 new interactive canvas science widgets and registered them in the full widget system.

## Widgets Created

1. **CanvasSimpleMachines** (`sci-simple-machines`) — K-5
   - Grid of 6 simple machines (lever, pulley, wheel & axle, inclined plane, wedge, screw)
   - Click to see animated SVG diagram, description, mechanical advantage formula, real-world examples
   - ~60 lines of interactive code

2. **CanvasSolarSystem** (`sci-solar-system`) — K-2, 3-5
   - SVG solar system with 8 planets orbiting the sun
   - Speed slider, click planet for name/size/distance/fun facts
   - Saturn rings, dark space background

3. **CanvasWaterCycle** (`sci-water-cycle`) — 3-5, 6-8
   - Circular flow diagram with mountains, water body, sun, cloud, tree
   - 5 stages: evaporation, transpiration, condensation, precipitation, collection
   - Click stage for explanation panel

4. **CanvasRockCycle** (`sci-rock-cycle`) — 6-8
   - Triangle diagram with 3 rock types (igneous, sedimentary, metamorphic)
   - 6 transition arrows between types
   - Click rock for formation process, examples, process description

5. **CanvasObservationJournal** (`sci-observation-journal`) — K-2, 3-5
   - Two-tab interface: New Entry form + Entries list
   - Date, location, weather (emoji picker), observations textarea
   - Save entries, delete entries, config-synced

6. **CanvasLabReportTemplate** (`sci-lab-report`) — 6-8, 9-12
   - 7 tabbed sections: Title, Hypothesis, Materials, Procedure, Data, Analysis, Conclusion
   - Progress bar showing completion percentage
   - Check marks on filled sections

7. **CanvasWeatherPatterns** (`sci-weather-patterns`) — 6-8
   - 6 patterns: Cold Front, Warm Front, Stationary Front, High Pressure, Low Pressure, Precipitation Types
   - Weather map symbol SVG display, description, effects list
   - Grid of icons with detail panel

8. **CanvasRotationalMotion** (`phys-rotational-motion`) — 9-12
   - Rotating SVG object with mass and force visualization
   - 4 sliders: Force, Arm Length, Mass, Radius
   - Real-time physics calculations: τ, I, α, ω with formulas shown

9. **CanvasDimensionalAnalysis** (`sci-dimensional-analysis`) — 9-12
   - Unit conversion tool with 16+ unit types across length, mass, volume, time
   - Step-by-step conversion visualization with unit cancellation (strikethrough)
   - Large result display, common conversion reference grid

## Files Modified

1. **src/components/whiteboard/CanvasScienceWidgets.tsx**
   - Added 9 widget components (~550 lines)
   - Added 9 entries to `getScienceWidgetDefaultConfig`
   - Added 9 entries to `getScienceWidgetDefaultSize`
   - Added 9 entries to `SCIENCE_WIDGET_KIND_LABELS`

2. **src/components/whiteboard/CanvasWidgets.tsx**
   - Added 9 imports from CanvasScienceWidgets
   - Added 9 entries to `WIDGET_COMPONENTS` map
   - Added 9 cases to `getDefaultWidgetConfig` switch
   - Added 9 cases to `getWidgetDefaultSize` switch

3. **src/lib/room/canvas-widget-registry.ts**
   - Added `phys-rotational-motion` to PHYSICS_WIDGETS
   - Added 8 entries to EARTH_SCIENCE_WIDGETS

4. **src/components/room/widgets/EarthScienceToolkit.tsx**
   - All tab: 8 new section entries with + Add to Board buttons
   - K-5 tab: 3 new entries (Simple Machines, Solar System, Observation Journal)
   - 6-8 tab: 4 new entries (Water Cycle, Rock Cycle, Weather Patterns, Lab Report)
   - 9-12 tab: 5 new entries (Water Cycle, Rock Cycle, Weather Patterns, Lab Report, Dimensional Analysis)

5. **src/components/room/widgets/PhysicsToolkit.tsx**
   - High school tab: 1 new entry (Rotational Motion)

## Verification
- TypeScript compilation: 0 new errors (all pre-existing errors in server/index.ts excluded)
- All widgets self-contained with NO external dependencies
- All widgets use isDark prop for color support
- All widgets use useConfigUpdater for state sync
