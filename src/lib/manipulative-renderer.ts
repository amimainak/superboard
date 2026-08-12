// ============================================================
// Manipulative Renderer — AI-Generated Math Manipulatives
// ============================================================
// Converts AI-generated manipulative descriptions into Fabric.js
// object groups. Each manipulative is a self-contained Group of
// objects that can be moved, resized, and interacted with.
//
// Used by AI actions like "create-fraction-bars", "create-number-line",
// "create-base-ten-blocks", etc.
// ============================================================

import {
  Rect,
  Circle,
  Line,
  IText,
  Group,
  Triangle,
  Polygon,
  Path,
  Ellipse,
  Polyline,
  type Object as FabricObject,
} from 'fabric';

// ---- Types ----

export interface ManipulativeSpec {
  type: string;
  params: Record<string, any>;
}

// ---- Color palette for manipulatives ----

const MANIPULATIVE_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
];

function getColor(index: number): string {
  return MANIPULATIVE_COLORS[index % MANIPULATIVE_COLORS.length];
}

// ---- Main entry point ----

/**
 * Render a manipulative specification into an array of Fabric.js objects.
 * Each manipulative type has its own factory function.
 */
export function renderManipulative(spec: ManipulativeSpec): FabricObject[] {
  switch (spec.type) {
    case 'fraction-bar':
      return createFractionBars(spec.params);
    case 'number-line':
      return createNumberLine(spec.params);
    case 'base-ten-blocks':
      return createBaseTenBlocks(spec.params);
    case 'coordinate-grid':
      return createCoordinateGrid(spec.params);
    case 'angle-protractor':
      return createAngleProtractor(spec.params);
    case 'geometry-shape':
      return createGeometryShape(spec.params);
    case 'place-value-chart':
      return createPlaceValueChart(spec.params);
    case 'clock':
      return createClock(spec.params);
    case 'bar-chart':
      return createBarChart(spec.params);
    // ---- New manipulatives ----
    case 'fraction-decimal-grid':
      return createFractionDecimalGrid(spec.params);
    case 'geometry-compass':
      return createGeometryCompass(spec.params);
    case 'protractor-tool':
      return createProtractorTool(spec.params);
    case 'quadratic-graph':
      return createQuadraticGraph(spec.params);
    case 'unit-circle':
      return createUnitCircle(spec.params);
    case 'slope-triangle':
      return createSlopeTriangle(spec.params);
    case 'box-plot':
      return createBoxPlot(spec.params);
    case 'stem-leaf-plot':
      return createStemLeafPlot(spec.params);
    case 'solar-system':
      return createSolarSystem(spec.params);
    case 'rock-cycle':
      return createRockCycle(spec.params);
    case 'water-cycle':
      return createWaterCycle(spec.params);
    case 'food-chain':
      return createFoodChain(spec.params);
    case 'human-heart':
      return createHumanHeart(spec.params);
    case 'ph-scale':
      return createPHScale(spec.params);
    case 'word-web':
      return createWordWeb(spec.params);
    case 'writing-paragraph':
      return createWritingParagraph(spec.params);
    case 'grammar-tree':
      return createGrammarTree(spec.params);
    case 'spiral-curriculum':
      return createSpiralCurriculum(spec.params);
    case 'world-map-continent':
      return createWorldMapContinent(spec.params);
    case 'government-branches':
      return createGovernmentBranches(spec.params);
    case 'economic-cycle':
      return createEconomicCycle(spec.params);
    case 'answer-grid-bubble':
      return createAnswerGridBubble(spec.params);
    case 'test-strategy-clock':
      return createTestStrategyClock(spec.params);
    case 'elimination-board':
      return createEliminationBoard(spec.params);
    case 'treble-clef-staff':
      return createTrebleClefStaff(spec.params);
    case 'rhythm-grid':
      return createRhythmGrid(spec.params);
    default:
      return createGenericManipulative(spec);
  }
}

// ============================================================
// Fraction Bars
// ============================================================
// Visual representation of fractions using colored bars.
// params: { numerator, denominator, label? }

function createFractionBars(params: Record<string, any>): FabricObject[] {
  const {
    numerator = 1,
    denominator = 4,
    label,
    x = 100,
    y = 100,
    width = 300,
    height = 40,
  } = params;

  const objects: FabricObject[] = [];
  const slotWidth = width / denominator;

  // Background bar (outline)
  const bg = new Rect({
    left: x,
    top: y,
    width,
    height,
    fill: 'transparent',
    stroke: '#374151',
    strokeWidth: 2,
    rx: 4,
    ry: 4,
  } as any);
  objects.push(bg);

  // Filled slots (numerator)
  for (let i = 0; i < numerator && i < denominator; i++) {
    const filled = new Rect({
      left: x + i * slotWidth + 1,
      top: y + 1,
      width: slotWidth - 2,
      height: height - 2,
      fill: getColor(i),
      stroke: '#374151',
      strokeWidth: 1,
      rx: 3,
      ry: 3,
    } as any);
    objects.push(filled);
  }

  // Slot dividers
  for (let i = 1; i < denominator; i++) {
    const divider = new Line(
      [x + i * slotWidth, y, x + i * slotWidth, y + height],
      {
        stroke: '#374151',
        strokeWidth: 1.5,
      } as any
    );
    objects.push(divider);
  }

  // Label
  const labelText = label || `${numerator}/${denominator}`;
  const labelObj = new IText(labelText, {
    left: x + width / 2,
    top: y + height + 12,
    fontSize: 18,
    fontFamily: 'Inter, system-ui, sans-serif',
    fill: '#374151',
    originX: 'center',
    originY: 'top',
    textAlign: 'center',
  } as any);
  objects.push(labelObj);

  // Wrap in a group
  const group = new Group(objects, {
    left: x,
    top: y,
  } as any);
  (group as any).name = `manipulative-fraction-bar-${Date.now()}`;
  return [group];
}

// ============================================================
// Number Line
// ============================================================
// Horizontal number line with tick marks and labels.
// params: { min, max, step?, highlightValues?, label? }

function createNumberLine(params: Record<string, any>): FabricObject[] {
  const {
    min = 0,
    max = 10,
    step = 1,
    highlightValues = [],
    label,
    x = 100,
    y = 200,
    length = 500,
  } = params;

  const objects: FabricObject[] = [];
  const tickSpacing = length / ((max - min) / step);

  // Main line
  const mainLine = new Line([x, y, x + length, y], {
    stroke: '#374151',
    strokeWidth: 2,
    strokeLineCap: 'round',
  } as any);
  objects.push(mainLine);

  // Arrow at end
  const arrow = new Triangle({
    left: x + length,
    top: y,
    width: 12,
    height: 12,
    fill: '#374151',
    angle: 90,
    originX: 'center',
    originY: 'center',
  } as any);
  objects.push(arrow);

  // Tick marks and labels
  const totalTicks = Math.round((max - min) / step);
  for (let i = 0; i <= totalTicks; i++) {
    const value = min + i * step;
    const tickX = x + i * tickSpacing;
    const isHighlighted = highlightValues.includes(value);

    // Tick mark
    const tick = new Line([tickX, y - 8, tickX, y + 8], {
      stroke: isHighlighted ? '#059669' : '#374151',
      strokeWidth: isHighlighted ? 3 : 1.5,
    } as any);
    objects.push(tick);

    // Highlight dot
    if (isHighlighted) {
      const dot = new Circle({
        left: tickX,
        top: y - 16,
        radius: 6,
        fill: '#059669',
        originX: 'center',
        originY: 'center',
      } as any);
      objects.push(dot);
    }

    // Number label (show every step, or every other for small steps)
    const showLabel = step >= 1 || i % Math.max(1, Math.round(1 / step)) === 0;
    if (showLabel) {
      const numLabel = new IText(
        Number.isInteger(value) ? String(value) : value.toFixed(1),
        {
          left: tickX,
          top: y + 16,
          fontSize: 14,
          fontFamily: 'Inter, system-ui, sans-serif',
          fill: '#374151',
          originX: 'center',
          originY: 'top',
          textAlign: 'center',
        } as any
      );
      objects.push(numLabel);
    }
  }

  // Optional top label
  if (label) {
    const titleLabel = new IText(label, {
      left: x + length / 2,
      top: y - 40,
      fontSize: 16,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#374151',
      originX: 'center',
      originY: 'top',
      fontWeight: 'bold',
    } as any);
    objects.push(titleLabel);
  }

  const group = new Group(objects, {
    left: x,
    top: y - 40,
  } as any);
  (group as any).name = `manipulative-number-line-${Date.now()}`;
  return [group];
}

// ============================================================
// Base-Ten Blocks
// ============================================================
// Visual representation of base-10 place value.
// params: { hundreds, tens, ones, x?, y? }

function createBaseTenBlocks(params: Record<string, any>): FabricObject[] {
  const {
    hundreds = 0,
    tens = 0,
    ones = 0,
    x = 100,
    y = 100,
    unitSize = 20,
  } = params;

  const objects: FabricObject[] = [];
  let currentX = x;
  const gap = 10;

  // Label
  if (hundreds > 0 || tens > 0 || ones > 0) {
    const titleLabel = new IText('Base-Ten Blocks', {
      left: x,
      top: y - 30,
      fontSize: 16,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#374151',
      fontWeight: 'bold',
    } as any);
    objects.push(titleLabel);
  }

  // Hundreds (large 10x10 grid)
  for (let h = 0; h < Math.min(hundreds, 5); h++) {
    const block = new Rect({
      left: currentX,
      top: y,
      width: unitSize * 10,
      height: unitSize * 10,
      fill: '#fbbf24',
      stroke: '#374151',
      strokeWidth: 2,
    } as any);
    objects.push(block);

    // Grid lines for hundreds block
    for (let i = 1; i < 10; i++) {
      const vLine = new Line(
        [currentX + i * unitSize, y, currentX + i * unitSize, y + unitSize * 10],
        { stroke: '#92400e', strokeWidth: 0.5 } as any
      );
      objects.push(vLine);
      const hLine = new Line(
        [currentX, y + i * unitSize, currentX + unitSize * 10, y + i * unitSize],
        { stroke: '#92400e', strokeWidth: 0.5 } as any
      );
      objects.push(hLine);
    }

    // Count label
    const hLabel = new IText(`${hundreds}00`, {
      left: currentX + unitSize * 5,
      top: y + unitSize * 10 + 8,
      fontSize: 14,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#92400e',
      originX: 'center',
    } as any);
    objects.push(hLabel);

    currentX += unitSize * 10 + gap;
  }

  // Tens (1x10 rods)
  for (let t = 0; t < Math.min(tens, 5); t++) {
    const rod = new Rect({
      left: currentX,
      top: y,
      width: unitSize,
      height: unitSize * 10,
      fill: '#60a5fa',
      stroke: '#1e3a5f',
      strokeWidth: 1.5,
    } as any);
    objects.push(rod);

    // Grid lines for tens rod
    for (let i = 1; i < 10; i++) {
      const hLine = new Line(
        [currentX, y + i * unitSize, currentX + unitSize, y + i * unitSize],
        { stroke: '#1e3a5f', strokeWidth: 0.5 } as any
      );
      objects.push(hLine);
    }

    const tLabel = new IText(`${tens}x10`, {
      left: currentX + unitSize / 2,
      top: y + unitSize * 10 + 8,
      fontSize: 14,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#1e3a5f',
      originX: 'center',
    } as any);
    objects.push(tLabel);

    currentX += unitSize + gap;
  }

  // Ones (individual unit cubes)
  for (let o = 0; o < Math.min(ones, 10); o++) {
    const cube = new Rect({
      left: currentX + (o % 5) * (unitSize + gap),
      top: y + Math.floor(o / 5) * (unitSize + gap),
      width: unitSize,
      height: unitSize,
      fill: '#34d399',
      stroke: '#065f46',
      strokeWidth: 1.5,
    } as any);
    objects.push(cube);
  }

  if (ones > 0) {
    const oLabel = new IText(`${ones}`, {
      left: currentX + Math.min(ones, 5) * (unitSize + gap) / 2 - gap / 2,
      top: y + (ones > 5 ? 2 : 1) * (unitSize + gap) + 8,
      fontSize: 14,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#065f46',
      originX: 'center',
    } as any);
    objects.push(oLabel);
  }

  const group = new Group(objects, {
    left: x,
    top: y - 30,
  } as any);
  (group as any).name = `manipulative-base-ten-${Date.now()}`;
  return [group];
}

// ============================================================
// Coordinate Grid
// ============================================================
// X-Y coordinate plane with grid lines.
// params: { xMin, xMax, yMin, yMax, step?, points? }

function createCoordinateGrid(params: Record<string, any>): FabricObject[] {
  const {
    xMin = -5,
    xMax = 5,
    yMin = -5,
    yMax = 5,
    step = 1,
    points = [],
    x = 200,
    y = 200,
    cellSize = 40,
  } = params;

  const objects: FabricObject[] = [];
  const originX = (0 - xMin) * cellSize;
  const originY = (yMax - 0) * cellSize;

  // Grid lines
  for (let gx = xMin; gx <= xMax; gx += step) {
    const px = (gx - xMin) * cellSize;
    const isAxis = gx === 0;
    const line = new Line([px, 0, px, (yMax - yMin) * cellSize], {
      stroke: isAxis ? '#374151' : '#e5e7eb',
      strokeWidth: isAxis ? 2 : 0.5,
    } as any);
    objects.push(line);
  }

  for (let gy = yMin; gy <= yMax; gy += step) {
    const py = (yMax - gy) * cellSize;
    const isAxis = gy === 0;
    const line = new Line([0, py, (xMax - xMin) * cellSize, py], {
      stroke: isAxis ? '#374151' : '#e5e7eb',
      strokeWidth: isAxis ? 2 : 0.5,
    } as any);
    objects.push(line);
  }

  // Axis labels
  for (let gx = xMin; gx <= xMax; gx += step) {
    if (gx === 0) continue;
    const px = (gx - xMin) * cellSize;
    const label = new IText(String(gx), {
      left: px,
      top: originY + 6,
      fontSize: 11,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#6b7280',
      originX: 'center',
      originY: 'top',
    } as any);
    objects.push(label);
  }

  for (let gy = yMin; gy <= yMax; gy += step) {
    if (gy === 0) continue;
    const py = (yMax - gy) * cellSize;
    const label = new IText(String(gy), {
      left: originX - 8,
      top: py,
      fontSize: 11,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#6b7280',
      originX: 'right',
      originY: 'center',
    } as any);
    objects.push(label);
  }

  // Origin label
  const originLabel = new IText('0', {
    left: originX - 8,
    top: originY + 6,
    fontSize: 11,
    fontFamily: 'Inter, system-ui, sans-serif',
    fill: '#6b7280',
    originX: 'right',
    originY: 'top',
  } as any);
  objects.push(originLabel);

  // Plotted points
  points.forEach((pt: { x: number; y: number; label?: string; color?: string }, idx: number) => {
    const px = (pt.x - xMin) * cellSize;
    const py = (yMax - pt.y) * cellSize;
    const color = pt.color || getColor(idx);

    const dot = new Circle({
      left: px,
      top: py,
      radius: 5,
      fill: color,
      stroke: '#ffffff',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
    } as any);
    objects.push(dot);

    if (pt.label) {
      const ptLabel = new IText(pt.label, {
        left: px + 8,
        top: py - 8,
        fontSize: 12,
        fontFamily: 'Inter, system-ui, sans-serif',
        fill: color,
      } as any);
      objects.push(ptLabel);
    }
  });

  const group = new Group(objects, {
    left: x,
    top: y,
  } as any);
  (group as any).name = `manipulative-coordinate-grid-${Date.now()}`;
  return [group];
}

// ============================================================
// Angle Protractor
// ============================================================
// Visual angle measurement with arc and degree label.
// params: { degrees, radius?, label? }

function createAngleProtractor(params: Record<string, any>): FabricObject[] {
  const {
    degrees = 90,
    radius = 80,
    label,
    x = 200,
    y = 250,
  } = params;

  const objects: FabricObject[] = [];
  const rad = (degrees * Math.PI) / 180;

  // Baseline arm
  const baseArm = new Line([x, y, x + radius + 20, y], {
    stroke: '#374151',
    strokeWidth: 2,
    strokeLineCap: 'round',
  } as any);
  objects.push(baseArm);

  // Angle arm
  const endX = x + (radius + 20) * Math.cos(-rad);
  const endY = y + (radius + 20) * Math.sin(-rad);
  const angleArm = new Line([x, y, endX, endY], {
    stroke: '#374151',
    strokeWidth: 2,
    strokeLineCap: 'round',
  } as any);
  objects.push(angleArm);

  // Arc (approximate with line segments)
  const arcSegments = 36;
  const arcRadius = radius * 0.4;
  for (let i = 0; i < arcSegments; i++) {
    const startAngle = -((i / arcSegments) * rad);
    const endAngle = -(((i + 1) / arcSegments) * rad);
    const x1 = x + arcRadius * Math.cos(startAngle);
    const y1 = y + arcRadius * Math.sin(startAngle);
    const x2 = x + arcRadius * Math.cos(endAngle);
    const y2 = y + arcRadius * Math.sin(endAngle);

    const seg = new Line([x1, y1, x2, y2], {
      stroke: '#059669',
      strokeWidth: 2,
    } as any);
    objects.push(seg);
  }

  // Angle label
  const labelAngle = -rad / 2;
  const labelRadius = radius * 0.55;
  const angleLabel = new IText(
    label || `${degrees}°`,
    {
      left: x + labelRadius * Math.cos(labelAngle),
      top: y + labelRadius * Math.sin(labelAngle),
      fontSize: 18,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#059669',
      originX: 'center',
      originY: 'center',
      fontWeight: 'bold',
    } as any
  );
  objects.push(angleLabel);

  // Vertex dot
  const vertex = new Circle({
    left: x,
    top: y,
    radius: 4,
    fill: '#374151',
    originX: 'center',
    originY: 'center',
  } as any);
  objects.push(vertex);

  // Right angle indicator for 90°
  if (degrees === 90) {
    const squareSize = 15;
    const square = new Polyline(
      [x + squareSize, y, x + squareSize, y - squareSize, x, y - squareSize],
      {
        stroke: '#059669',
        strokeWidth: 1.5,
        fill: '',
      } as any
    );
    objects.push(square);
  }

  const group = new Group(objects, {
    left: x - 20,
    top: y - radius - 20,
  } as any);
  (group as any).name = `manipulative-angle-${Date.now()}`;
  return [group];
}

// ============================================================
// Geometry Shape
// ============================================================
// Common geometric shapes with labels and measurements.
// params: { shape, sideLength?, width?, height?, radius?, label? }

function createGeometryShape(params: Record<string, any>): FabricObject[] {
  const {
    shape = 'square',
    sideLength = 100,
    width,
    height,
    radius = 50,
    label,
    x = 200,
    y = 200,
    fill = 'transparent',
    stroke = '#374151',
    strokeWidth = 2,
    showDimensions = true,
  } = params;

  const objects: FabricObject[] = [];
  let shapeObj: FabricObject;
  const w = width || sideLength;
  const h = height || sideLength;

  switch (shape) {
    case 'rectangle':
      shapeObj = new Rect({
        left: x, top: y, width: w, height: h,
        fill, stroke, strokeWidth,
      } as any);
      break;

    case 'square':
      shapeObj = new Rect({
        left: x, top: y, width: sideLength, height: sideLength,
        fill, stroke, strokeWidth,
      } as any);
      break;

    case 'circle':
      shapeObj = new Circle({
        left: x + radius, top: y + radius, radius,
        fill, stroke, strokeWidth,
        originX: 'center', originY: 'center',
      } as any);
      break;

    case 'triangle': {
      const triHeight = sideLength * (Math.sqrt(3) / 2);
      const triPoints = [
        { x: x + sideLength / 2, y: y },
        { x: x + sideLength, y: y + triHeight },
        { x: x, y: y + triHeight },
      ];
      shapeObj = new Polygon(triPoints, {
        fill, stroke, strokeWidth,
      } as any);
      break;
    }

    case 'pentagon': {
      const pentPoints = generateRegularPolygonPoints(x + sideLength / 2, y + sideLength / 2, sideLength / 2, 5, -Math.PI / 2);
      shapeObj = new Polygon(pentPoints, {
        fill, stroke, strokeWidth,
      } as any);
      break;
    }

    case 'hexagon': {
      const hexPoints = generateRegularPolygonPoints(x + sideLength / 2, y + sideLength / 2, sideLength / 2, 6, 0);
      shapeObj = new Polygon(hexPoints, {
        fill, stroke, strokeWidth,
      } as any);
      break;
    }

    default:
      shapeObj = new Rect({
        left: x, top: y, width: w, height: h,
        fill, stroke, strokeWidth,
      } as any);
  }

  objects.push(shapeObj);

  // Dimension labels
  if (showDimensions) {
    if (shape === 'circle') {
      const dimLabel = new IText(`r = ${radius}`, {
        left: x + radius,
        top: y + radius + radius + 10,
        fontSize: 14,
        fontFamily: 'Inter, system-ui, sans-serif',
        fill: '#6b7280',
        originX: 'center',
      } as any);
      objects.push(dimLabel);
    } else if (shape === 'rectangle' || shape === 'square') {
      const actualW = shape === 'square' ? sideLength : w;
      const actualH = shape === 'square' ? sideLength : h;
      const wLabel = new IText(`${actualW}`, {
        left: x + actualW / 2,
        top: y + actualH + 10,
        fontSize: 14,
        fontFamily: 'Inter, system-ui, sans-serif',
        fill: '#6b7280',
        originX: 'center',
      } as any);
      objects.push(wLabel);

      if (shape === 'rectangle' && w !== h) {
        const hLabel = new IText(`${actualH}`, {
          left: x + actualW + 10,
          top: y + actualH / 2,
          fontSize: 14,
          fontFamily: 'Inter, system-ui, sans-serif',
          fill: '#6b7280',
          originY: 'center',
        } as any);
        objects.push(hLabel);
      }
    }
  }

  // Custom label
  if (label) {
    const customLabel = new IText(label, {
      left: x + (shape === 'circle' ? radius : (w || sideLength) / 2),
      top: shape === 'circle' ? y - 10 : y - 10,
      fontSize: 16,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#374151',
      originX: 'center',
      originY: 'bottom',
      fontWeight: 'bold',
    } as any);
    objects.push(customLabel);
  }

  const group = new Group(objects, {
    left: x,
    top: y,
  } as any);
  (group as any).name = `manipulative-geometry-${shape}-${Date.now()}`;
  return [group];
}

// ============================================================
// Place Value Chart
// ============================================================
// params: { columns: [{ header, value }], x?, y? }

function createPlaceValueChart(params: Record<string, any>): FabricObject[] {
  const {
    columns = [
      { header: 'Thousands', value: '1' },
      { header: 'Hundreds', value: '2' },
      { header: 'Tens', value: '3' },
      { header: 'Ones', value: '4' },
    ],
    x = 100,
    y = 100,
    colWidth = 80,
    rowHeight = 60,
  } = params;

  const objects: FabricObject[] = [];

  columns.forEach((col: { header: string; value: string }, idx: number) => {
    const cx = x + idx * colWidth;

    // Column background
    const bg = new Rect({
      left: cx, top: y,
      width: colWidth, height: rowHeight,
      fill: idx % 2 === 0 ? '#f0fdf4' : '#ecfdf5',
      stroke: '#374151',
      strokeWidth: 1.5,
    } as any);
    objects.push(bg);

    // Header
    const header = new IText(col.header, {
      left: cx + colWidth / 2,
      top: y + 8,
      fontSize: 11,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#6b7280',
      originX: 'center',
      textAlign: 'center',
    } as any);
    objects.push(header);

    // Value
    const value = new IText(col.value, {
      left: cx + colWidth / 2,
      top: y + 30,
      fontSize: 28,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#059669',
      originX: 'center',
      fontWeight: 'bold',
    } as any);
    objects.push(value);
  });

  const group = new Group(objects, {
    left: x,
    top: y,
  } as any);
  (group as any).name = `manipulative-place-value-${Date.now()}`;
  return [group];
}

// ============================================================
// Clock
// ============================================================
// Analog clock face for time-telling exercises.
// params: { hours, minutes, label? }

function createClock(params: Record<string, any>): FabricObject[] {
  const {
    hours = 3,
    minutes = 0,
    label,
    x = 200,
    y = 200,
    radius = 80,
  } = params;

  const objects: FabricObject[] = [];

  // Clock face
  const face = new Circle({
    left: x,
    top: y,
    radius,
    fill: '#ffffff',
    stroke: '#374151',
    strokeWidth: 3,
    originX: 'center',
    originY: 'center',
  } as any);
  objects.push(face);

  // Hour markers and numbers
  for (let i = 1; i <= 12; i++) {
    const angle = ((i * 30 - 90) * Math.PI) / 180;
    const innerR = radius - 8;
    const outerR = radius - 2;

    // Tick mark
    const tick = new Line(
      [x + innerR * Math.cos(angle), y + innerR * Math.sin(angle),
       x + outerR * Math.cos(angle), y + outerR * Math.sin(angle)],
      { stroke: '#374151', strokeWidth: 2 } as any
    );
    objects.push(tick);

    // Number
    const numR = radius - 18;
    const num = new IText(String(i), {
      left: x + numR * Math.cos(angle),
      top: y + numR * Math.sin(angle),
      fontSize: 14,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#374151',
      originX: 'center',
      originY: 'center',
      fontWeight: i % 3 === 0 ? 'bold' : 'normal',
    } as any);
    objects.push(num);
  }

  // Minute markers
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue; // Skip hour positions
    const angle = ((i * 6 - 90) * Math.PI) / 180;
    const outerR = radius - 2;
    const innerR = radius - 5;
    const tick = new Line(
      [x + innerR * Math.cos(angle), y + innerR * Math.sin(angle),
       x + outerR * Math.cos(angle), y + outerR * Math.sin(angle)],
      { stroke: '#d1d5db', strokeWidth: 1 } as any
    );
    objects.push(tick);
  }

  // Hour hand
  const hourAngle = ((hours % 12 + minutes / 60) * 30 - 90) * (Math.PI / 180);
  const hourLength = radius * 0.5;
  const hourHand = new Line(
    [x, y, x + hourLength * Math.cos(hourAngle), y + hourLength * Math.sin(hourAngle)],
    { stroke: '#374151', strokeWidth: 4, strokeLineCap: 'round' } as any
  );
  objects.push(hourHand);

  // Minute hand
  const minuteAngle = (minutes * 6 - 90) * (Math.PI / 180);
  const minuteLength = radius * 0.7;
  const minuteHand = new Line(
    [x, y, x + minuteLength * Math.cos(minuteAngle), y + minuteLength * Math.sin(minuteAngle)],
    { stroke: '#6b7280', strokeWidth: 2.5, strokeLineCap: 'round' } as any
  );
  objects.push(minuteHand);

  // Center dot
  const centerDot = new Circle({
    left: x, top: y, radius: 4,
    fill: '#374151',
    originX: 'center', originY: 'center',
  } as any);
  objects.push(centerDot);

  // Digital time label below
  const timeStr = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')}`;
  const digitalLabel = new IText(label || timeStr, {
    left: x,
    top: y + radius + 16,
    fontSize: 16,
    fontFamily: 'Inter, system-ui, sans-serif',
    fill: '#374151',
    originX: 'center',
    fontWeight: 'bold',
  } as any);
  objects.push(digitalLabel);

  const group = new Group(objects, {
    left: x - radius - 10,
    top: y - radius - 10,
  } as any);
  (group as any).name = `manipulative-clock-${Date.now()}`;
  return [group];
}

// ============================================================
// Bar Chart
// ============================================================
// Simple bar chart for data visualization.
// params: { data: [{ label, value, color? }], title? }

function createBarChart(params: Record<string, any>): FabricObject[] {
  const {
    data = [
      { label: 'A', value: 5 },
      { label: 'B', value: 8 },
      { label: 'C', value: 3 },
    ],
    title,
    x = 100,
    y = 100,
    chartWidth = 300,
    chartHeight = 200,
    barWidth = 40,
  } = params;

  const objects: FabricObject[] = [];
  const maxValue = Math.max(...data.map((d: { value: number }) => d.value), 1);
  const barGap = (chartWidth - data.length * barWidth) / (data.length + 1);

  // Y-axis
  const yAxis = new Line([x, y, x, y + chartHeight], {
    stroke: '#374151', strokeWidth: 2,
  } as any);
  objects.push(yAxis);

  // X-axis
  const xAxis = new Line([x, y + chartHeight, x + chartWidth, y + chartHeight], {
    stroke: '#374151', strokeWidth: 2,
  } as any);
  objects.push(xAxis);

  // Bars
  data.forEach((item: { label: string; value: number; color?: string }, idx: number) => {
    const barHeight = (item.value / maxValue) * (chartHeight - 20);
    const bx = x + barGap + idx * (barWidth + barGap);
    const by = y + chartHeight - barHeight;
    const color = item.color || getColor(idx);

    const bar = new Rect({
      left: bx, top: by, width: barWidth, height: barHeight,
      fill: color, stroke: '#374151', strokeWidth: 1, rx: 3, ry: 3,
    } as any);
    objects.push(bar);

    // Value label on top
    const valLabel = new IText(String(item.value), {
      left: bx + barWidth / 2, top: by - 8,
      fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#374151', originX: 'center', originY: 'bottom',
    } as any);
    objects.push(valLabel);

    // Category label
    const catLabel = new IText(item.label, {
      left: bx + barWidth / 2, top: y + chartHeight + 8,
      fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#6b7280', originX: 'center',
    } as any);
    objects.push(catLabel);
  });

  // Title
  if (title) {
    const titleLabel = new IText(title, {
      left: x + chartWidth / 2, top: y - 24,
      fontSize: 16, fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#374151', originX: 'center', fontWeight: 'bold',
    } as any);
    objects.push(titleLabel);
  }

  const group = new Group(objects, {
    left: x,
    top: title ? y - 24 : y,
  } as any);
  (group as any).name = `manipulative-bar-chart-${Date.now()}`;
  return [group];
}

// ============================================================
// Generic Manipulative (fallback)
// ============================================================

function createGenericManipulative(spec: ManipulativeSpec): FabricObject[] {
  const { params } = spec;
  const x = params.x || 200;
  const y = params.y || 200;

  // Draw a labeled card with the spec type
  const bg = new Rect({
    left: x, top: y, width: 200, height: 80,
    fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 2, rx: 8, ry: 8,
  } as any);

  const icon = new IText('🧩', {
    left: x + 16, top: y + 20,
    fontSize: 28,
  } as any);

  const label = new IText(spec.type || 'Manipulative', {
    left: x + 56, top: y + 20,
    fontSize: 14,
    fontFamily: 'Inter, system-ui, sans-serif',
    fill: '#92400e',
    fontWeight: 'bold',
  } as any);

  const subtitle = new IText('AI-generated manipulative', {
    left: x + 56, top: y + 42,
    fontSize: 11,
    fontFamily: 'Inter, system-ui, sans-serif',
    fill: '#b45309',
  } as any);

  const group = new Group([bg, icon, label, subtitle], {
    left: x, top: y,
  } as any);
  (group as any).name = `manipulative-generic-${Date.now()}`;
  return [group];
}

// ============================================================
// NEW MANIPULATIVES (26 additions)
// ============================================================

// ---- MATH (8 new) ----

// ============================================================
// Fraction Decimal Grid
// ============================================================
// 10x10 grid where shading shows fraction→decimal conversion

function createFractionDecimalGrid(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0, shaded = 37, label } = params;
  const objects: FabricObject[] = [];
  const gridSize = 10;
  const cellSize = 18;
  const totalSize = gridSize * cellSize;
  const ox = x - totalSize / 2;
  const oy = y - totalSize / 2;

  // Shaded cells
  let count = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const isShaded = count < shaded;
      const cell = new Rect({
        left: ox + c * cellSize, top: oy + r * cellSize,
        width: cellSize, height: cellSize,
        fill: isShaded ? '#3b82f6' : '#ffffff',
        stroke: '#9ca3af', strokeWidth: 1,
        name: `manipulative-fraction-decimal-grid-cell-${r}-${c}`,
      } as any);
      objects.push(cell);
      count++;
    }
  }

  // Border
  const border = new Rect({
    left: ox, top: oy, width: totalSize, height: totalSize,
    fill: 'transparent', stroke: '#374151', strokeWidth: 2,
    name: 'manipulative-fraction-decimal-grid-border',
  } as any);
  objects.push(border);

  // Labels
  const fracText = label || `${shaded}/100`;
  const decText = (shaded / 100).toFixed(2);
  const fracLabel = new IText(fracText, {
    left: x, top: oy + totalSize + 8,
    fontSize: 14, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-fraction-decimal-grid-label',
  } as any);
  objects.push(fracLabel);

  const decLabel = new IText(`= ${decText}`, {
    left: x, top: oy + totalSize + 26,
    fontSize: 14, fontFamily: 'Inter', fill: '#6b7280',
    originX: 'center',
    name: 'manipulative-fraction-decimal-grid-decimal',
  } as any);
  objects.push(decLabel);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-fraction-decimal-grid-${Date.now()}`;
  return [group];
}

// ============================================================
// Geometry Compass
// ============================================================

function createGeometryCompass(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0, radius = 100 } = params;
  const objects: FabricObject[] = [];

  // Center point
  const center = new Circle({
    left: x, top: y, radius: 5,
    fill: '#ef4444', stroke: '#374151', strokeWidth: 1.5,
    originX: 'center', originY: 'center',
    name: 'manipulative-geometry-compass-center',
  } as any);
  objects.push(center);

  // Circle
  const circle = new Circle({
    left: x, top: y, radius,
    fill: 'transparent', stroke: '#3b82f6', strokeWidth: 2,
    originX: 'center', originY: 'center',
    name: 'manipulative-geometry-compass-circle',
  } as any);
  objects.push(circle);

  // Radius line
  const radiusLine = new Line([x, y, x + radius, y], {
    stroke: '#ef4444', strokeWidth: 2, strokeLineCap: 'round',
    strokeDashArray: [6, 4],
    name: 'manipulative-geometry-compass-radius',
  } as any);
  objects.push(radiusLine);

  // Radius label
  const rLabel = new IText(`r = ${radius}`, {
    left: x + radius / 2, top: y - 14,
    fontSize: 13, fontFamily: 'Inter', fill: '#ef4444',
    originX: 'center', originY: 'bottom',
    name: 'manipulative-geometry-compass-label',
  } as any);
  objects.push(rLabel);

  // Compass legs
  const leg1 = new Line([x, y, x - 30, y + 60], {
    stroke: '#374151', strokeWidth: 3, strokeLineCap: 'round',
    name: 'manipulative-geometry-compass-leg1',
  } as any);
  objects.push(leg1);
  const leg2 = new Line([x, y, x - 20, y + 70], {
    stroke: '#374151', strokeWidth: 3, strokeLineCap: 'round',
    name: 'manipulative-geometry-compass-leg2',
  } as any);
  objects.push(leg2);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-geometry-compass-${Date.now()}`;
  return [group];
}

// ============================================================
// Protractor Tool
// ============================================================

function createProtractorTool(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0, radius = 120 } = params;
  const objects: FabricObject[] = [];

  // Semi-circle body using a Path (approximate with an arc path)
  const pathStr = `M ${x - radius} ${y} A ${radius} ${radius} 0 0 1 ${x + radius} ${y} L ${x - radius} ${y} Z`;
  const body = new Path(pathStr, {
    fill: 'rgba(251, 191, 36, 0.15)', stroke: '#374151', strokeWidth: 2,
    name: 'manipulative-protractor-body',
  } as any);
  objects.push(body);

  // Inner semi-circle
  const innerR = radius * 0.85;
  const innerPath = `M ${x - innerR} ${y} A ${innerR} ${innerR} 0 0 1 ${x + innerR} ${y}`;
  const innerArc = new Path(innerPath, {
    fill: 'transparent', stroke: '#d1d5db', strokeWidth: 1,
    name: 'manipulative-protractor-inner',
  } as any);
  objects.push(innerArc);

  // Baseline
  const baseline = new Line([x - radius - 10, y, x + radius + 10, y], {
    stroke: '#374151', strokeWidth: 2,
    name: 'manipulative-protractor-baseline',
  } as any);
  objects.push(baseline);

  // Tick marks and labels
  for (let deg = 0; deg <= 180; deg += 10) {
    const rad = (deg - 180) * (Math.PI / 180);
    const isMajor = deg % 30 === 0;
    const tickOuter = radius;
    const tickInner = isMajor ? radius - 16 : radius - 10;
    const tx1 = x + tickOuter * Math.cos(rad);
    const ty1 = y + tickOuter * Math.sin(rad);
    const tx2 = x + tickInner * Math.cos(rad);
    const ty2 = y + tickInner * Math.sin(rad);
    const tick = new Line([tx1, ty1, tx2, ty2], {
      stroke: '#374151', strokeWidth: isMajor ? 1.5 : 0.8,
      name: `manipulative-protractor-tick-${deg}`,
    } as any);
    objects.push(tick);

    if (isMajor) {
      const labelR = radius - 24;
      const lx = x + labelR * Math.cos(rad);
      const ly = y + labelR * Math.sin(rad);
      const label = new IText(String(deg), {
        left: lx, top: ly,
        fontSize: 10, fontFamily: 'Inter', fill: '#374151',
        originX: 'center', originY: 'center',
        name: `manipulative-protractor-label-${deg}`,
      } as any);
      objects.push(label);
    }
  }

  // Center point
  const cp = new Circle({
    left: x, top: y, radius: 3,
    fill: '#ef4444', originX: 'center', originY: 'center',
    name: 'manipulative-protractor-center',
  } as any);
  objects.push(cp);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-protractor-tool-${Date.now()}`;
  return [group];
}

// ============================================================
// Quadratic Graph
// ============================================================

function createQuadraticGraph(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0, a = 1, h = 0, k = 0, size = 200 } = params;
  const objects: FabricObject[] = [];
  const half = size / 2;
  const scale = 20; // pixels per unit

  // Background
  const bg = new Rect({
    left: x - half, top: y - half, width: size, height: size,
    fill: '#f9fafb', stroke: '#374151', strokeWidth: 2,
    name: 'manipulative-quadratic-graph-bg',
  } as any);
  objects.push(bg);

  // Grid lines
  for (let i = -Math.floor(half / scale); i <= Math.floor(half / scale); i++) {
    const gx = x + i * scale;
    const gy = y + i * scale;
    const vLine = new Line([gx, y - half, gx, y + half], {
      stroke: '#e5e7eb', strokeWidth: 0.5, name: `manipulative-quadratic-grid-v-${i}`,
    } as any);
    const hLine = new Line([x - half, gy, x + half, gy], {
      stroke: '#e5e7eb', strokeWidth: 0.5, name: `manipulative-quadratic-grid-h-${i}`,
    } as any);
    objects.push(vLine, hLine);
  }

  // Axes
  const xAxis = new Line([x - half, y, x + half, y], {
    stroke: '#374151', strokeWidth: 2, name: 'manipulative-quadratic-xaxis',
  } as any);
  const yAxis = new Line([x, y - half, x, y + half], {
    stroke: '#374151', strokeWidth: 2, name: 'manipulative-quadratic-yaxis',
  } as any);
  objects.push(xAxis, yAxis);

  // Parabola points
  const points: Array<[number, number]> = [];
  for (let px = -half; px <= half; px += 2) {
    const ux = px / scale;
    const uy = a * (ux - h) * (ux - h) + k;
    const py = -uy * scale;
    if (Math.abs(py) <= half) {
      points.push([x + px, y + py]);
    }
  }
  for (let i = 0; i < points.length - 1; i++) {
    const seg = new Line([points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]], {
      stroke: '#ef4444', strokeWidth: 3, strokeLineCap: 'round',
      name: `manipulative-quadratic-curve-${i}`,
    } as any);
    objects.push(seg);
  }

  // Vertex dot
  const vx = x + h * scale;
  const vy = y - k * scale;
  const vertex = new Circle({
    left: vx, top: vy, radius: 5,
    fill: '#ef4444', stroke: '#ffffff', strokeWidth: 1.5,
    originX: 'center', originY: 'center',
    name: 'manipulative-quadratic-vertex',
  } as any);
  objects.push(vertex);

  // Equation label
  const eqLabel = new IText(`y = ${a}(x${h >= 0 ? '-' : '+'}${Math.abs(h)})² ${k >= 0 ? '+' : ''}${k}`, {
    left: x + half - 8, top: y - half + 12,
    fontSize: 14, fontFamily: 'Inter', fill: '#ef4444',
    originX: 'right', fontWeight: 'bold',
    name: 'manipulative-quadratic-equation',
  } as any);
  objects.push(eqLabel);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-quadratic-graph-${Date.now()}`;
  return [group];
}

// ============================================================
// Unit Circle
// ============================================================

function createUnitCircle(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0, angle = 45, radius = 120 } = params;
  const objects: FabricObject[] = [];

  // Background
  const bg = new Rect({
    left: x - radius - 30, top: y - radius - 30,
    width: (radius + 30) * 2, height: (radius + 30) * 2,
    fill: '#f9fafb', stroke: '#d1d5db', strokeWidth: 1, rx: 8,
    name: 'manipulative-unit-circle-bg',
  } as any);
  objects.push(bg);

  // Axes
  const xAxis = new Line([x - radius - 15, y, x + radius + 15, y], {
    stroke: '#374151', strokeWidth: 1.5, name: 'manipulative-unit-circle-xaxis',
  } as any);
  const yAxis = new Line([x, y - radius - 15, x, y + radius + 15], {
    stroke: '#374151', strokeWidth: 1.5, name: 'manipulative-unit-circle-yaxis',
  } as any);
  objects.push(xAxis, yAxis);

  // Circle
  const circle = new Circle({
    left: x, top: y, radius,
    fill: 'transparent', stroke: '#374151', strokeWidth: 2,
    originX: 'center', originY: 'center',
    name: 'manipulative-unit-circle-main',
  } as any);
  objects.push(circle);

  // Angle arc
  const arcR = 25;
 const arcAngleRad = (angle) * (Math.PI / 180);
  const arcPath = `M ${x + arcR} ${y} A ${arcR} ${arcR} 0 0 0 ${x + arcR * Math.cos(-arcAngleRad)} ${y - arcR * Math.sin(arcAngleRad)}`;
  const arc = new Path(arcPath, {
    fill: 'transparent', stroke: '#f97316', strokeWidth: 2,
    name: 'manipulative-unit-circle-arc',
  } as any);
  objects.push(arc);

  // Angle label
  const labelAngle = arcAngleRad / 2;
  const alx = x + (arcR + 14) * Math.cos(-labelAngle);
  const aly = y - (arcR + 14) * Math.sin(labelAngle);
  const angleLabel = new IText(`${angle}°`, {
    left: alx, top: aly, fontSize: 12, fontFamily: 'Inter', fill: '#f97316',
    originX: 'center', originY: 'center', fontWeight: 'bold',
    name: 'manipulative-unit-circle-angle-label',
  } as any);
  objects.push(angleLabel);

  // Point on circle
  const px = x + radius * Math.cos(-arcAngleRad);
  const py = y - radius * Math.sin(arcAngleRad);
  const point = new Circle({
    left: px, top: py, radius: 5,
    fill: '#ef4444', originX: 'center', originY: 'center',
    name: 'manipulative-unit-circle-point',
  } as any);
  objects.push(point);

  // cos line (horizontal) — green
  const cosLine = new Line([x, y, px, y], {
    stroke: '#22c55e', strokeWidth: 3, strokeLineCap: 'round',
    name: 'manipulative-unit-circle-cos',
  } as any);
  objects.push(cosLine);
  const cosLabel = new IText(`cos = ${Math.cos(arcAngleRad).toFixed(2)}`, {
    left: (x + px) / 2, top: y + 14,
    fontSize: 12, fontFamily: 'Inter', fill: '#22c55e',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-unit-circle-cos-label',
  } as any);
  objects.push(cosLabel);

  // sin line (vertical) — blue
  const sinLine = new Line([px, y, px, py], {
    stroke: '#3b82f6', strokeWidth: 3, strokeLineCap: 'round',
    name: 'manipulative-unit-circle-sin',
  } as any);
  objects.push(sinLine);
  const sinLabel = new IText(`sin = ${Math.sin(arcAngleRad).toFixed(2)}`, {
    left: px + 14, top: (y + py) / 2,
    fontSize: 12, fontFamily: 'Inter', fill: '#3b82f6',
    originX: 'left', originY: 'center', fontWeight: 'bold',
    name: 'manipulative-unit-circle-sin-label',
  } as any);
  objects.push(sinLabel);

  // Radius line
  const radiusLine = new Line([x, y, px, py], {
    stroke: '#6b7280', strokeWidth: 1.5, strokeDashArray: [4, 3],
    name: 'manipulative-unit-circle-radius',
  } as any);
  objects.push(radiusLine);

  // Axis labels
  const xLabel = new IText('x', {
    left: x + radius + 12, top: y - 6, fontSize: 13, fontFamily: 'Inter', fill: '#374151',
    name: 'manipulative-unit-circle-x-label',
  } as any);
  const yLabel = new IText('y', {
    left: x + 6, top: y - radius - 16, fontSize: 13, fontFamily: 'Inter', fill: '#374151',
    name: 'manipulative-unit-circle-y-label',
  } as any);
  objects.push(xLabel, yLabel);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-unit-circle-${Date.now()}`;
  return [group];
}

// ============================================================
// Slope Triangle
// ============================================================

function createSlopeTriangle(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0, rise = 3, run = 4, scale = 30 } = params;
  const objects: FabricObject[] = [];
  const w = Math.abs(run) * scale + 60;
  const h = Math.abs(rise) * scale + 60;
  const ox = x - w / 2;
  const oy = y + h / 2;

  // Axes
  const xAxis = new Line([ox, oy, ox + w, oy], {
    stroke: '#374151', strokeWidth: 2, name: 'manipulative-slope-triangle-xaxis',
  } as any);
  const yAxis = new Line([ox, oy, ox, oy - h], {
    stroke: '#374151', strokeWidth: 2, name: 'manipulative-slope-triangle-yaxis',
  } as any);
  objects.push(xAxis, yAxis);

  // Triangle vertices
  const ax = ox + 20; const ay = oy;
  const bx = ax + run * scale; const by = oy;
  const cx = bx; const cy = oy - rise * scale;

  // Triangle fill
  const triPoints = [{ x: ax, y: ay }, { x: bx, y: by }, { x: cx, y: cy }];
  const tri = new Polygon(triPoints as any, {
    fill: 'rgba(34, 197, 94, 0.15)', stroke: '#22c55e', strokeWidth: 2,
    name: 'manipulative-slope-triangle-fill',
  } as any);
  objects.push(tri);

  // Rise line (vertical, right side)
  const riseLine = new Line([bx, by, cx, cy], {
    stroke: '#ef4444', strokeWidth: 3, strokeLineCap: 'round',
    name: 'manipulative-slope-triangle-rise',
  } as any);
  objects.push(riseLine);

  // Run line (horizontal, bottom)
  const runLine = new Line([ax, ay, bx, by], {
    stroke: '#3b82f6', strokeWidth: 3, strokeLineCap: 'round',
    name: 'manipulative-slope-triangle-run',
  } as any);
  objects.push(runLine);

  // Hypotenuse (dashed)
  const hypLine = new Line([ax, ay, cx, cy], {
    stroke: '#6b7280', strokeWidth: 2, strokeDashArray: [6, 4],
    name: 'manipulative-slope-triangle-hypotenuse',
  } as any);
  objects.push(hypLine);

  // Right angle marker
  const markerSize = 10;
  const marker = new Polyline([bx - markerSize, by, bx - markerSize, by - markerSize, bx, by - markerSize], {
    stroke: '#374151', strokeWidth: 1.5,
    name: 'manipulative-slope-triangle-right-angle',
    fill: '',
  } as any);
  objects.push(marker);

  // Labels
  const riseLabel = new IText(`rise = ${rise}`, {
    left: bx + 12, top: (by + cy) / 2,
    fontSize: 14, fontFamily: 'Inter', fill: '#ef4444',
    originY: 'center', fontWeight: 'bold',
    name: 'manipulative-slope-triangle-rise-label',
  } as any);
  objects.push(riseLabel);

  const runLabel = new IText(`run = ${run}`, {
    left: (ax + bx) / 2, top: oy + 10,
    fontSize: 14, fontFamily: 'Inter', fill: '#3b82f6',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-slope-triangle-run-label',
  } as any);
  objects.push(runLabel);

  const slopeLabel = new IText(`slope = ${rise}/${run} = ${(rise / run).toFixed(2)}`, {
    left: x, top: oy - h - 10,
    fontSize: 15, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-slope-triangle-slope-label',
  } as any);
  objects.push(slopeLabel);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-slope-triangle-${Date.now()}`;
  return [group];
}

// ============================================================
// Box Plot
// ============================================================

function createBoxPlot(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0, min = 2, q1 = 5, median = 8, q3 = 12, max = 18 } = params;
  const objects: FabricObject[] = [];
  const width = 300;
  const height = 80;
  const ox = x - width / 2;
  const oy = y - height / 2;
  const scale = width / (max - min);
  const valToX = (v: number) => ox + (v - min) * scale;

  // Number line
  const numLine = new Line([ox, oy + height / 2, ox + width, oy + height / 2], {
    stroke: '#374151', strokeWidth: 2, name: 'manipulative-box-plot-line',
  } as any);
  objects.push(numLine);

  // Whiskers
  const wLeft = new Line([valToX(min), oy + height / 2, valToX(q1), oy + height / 2], {
    stroke: '#374151', strokeWidth: 2, name: 'manipulative-box-plot-whisker-left',
  } as any);
  const wRight = new Line([valToX(q3), oy + height / 2, valToX(max), oy + height / 2], {
    stroke: '#374151', strokeWidth: 2, name: 'manipulative-box-plot-whisker-right',
  } as any);
  objects.push(wLeft, wRight);

  // Whisker caps
  const capH = 20;
  [min, max].forEach((v) => {
    const cap = new Line([valToX(v), oy + (height - capH) / 2, valToX(v), oy + (height + capH) / 2], {
      stroke: '#374151', strokeWidth: 2, name: `manipulative-box-plot-cap-${v}`,
    } as any);
    objects.push(cap);
  });

  // Box
  const boxW = valToX(q3) - valToX(q1);
  const box = new Rect({
    left: valToX(q1), top: oy + 8, width: boxW, height: height - 16,
    fill: 'rgba(59, 130, 246, 0.15)', stroke: '#3b82f6', strokeWidth: 2,
    name: 'manipulative-box-plot-box',
  } as any);
  objects.push(box);

  // Median line
  const medLine = new Line([valToX(median), oy + 8, valToX(median), oy + height - 8], {
    stroke: '#ef4444', strokeWidth: 3, strokeLineCap: 'round',
    name: 'manipulative-box-plot-median',
  } as any);
  objects.push(medLine);

  // Labels
  const labels: [number, string][] = [[min, 'Min'], [q1, 'Q1'], [median, 'Med'], [q3, 'Q3'], [max, 'Max']];
  labels.forEach(([v, text]) => {
    const lbl = new IText(`${text}: ${v}`, {
      left: valToX(v), top: oy + height / 2 + 12,
      fontSize: 11, fontFamily: 'Inter', fill: '#374151',
      originX: 'center',
      name: `manipulative-box-plot-label-${text}`,
    } as any);
    objects.push(lbl);
  });

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-box-plot-${Date.now()}`;
  return [group];
}

// ============================================================
// Stem and Leaf Plot
// ============================================================

function createStemLeafPlot(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];
  const data = [
    { stem: '1', leaves: '2  5  8' },
    { stem: '2', leaves: '0  3  3  7' },
    { stem: '3', leaves: '1  4  9' },
    { stem: '4', leaves: '0  2  5  5  8' },
    { stem: '5', leaves: '1  6' },
  ];

  const rowHeight = 28;
  const totalHeight = data.length * rowHeight + 50;
  const ox = x - 100;
  const oy = y - totalHeight / 2;

  // Background
  const bg = new Rect({
    left: ox - 10, top: oy - 10, width: 220, height: totalHeight + 20,
    fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1, rx: 6,
    name: 'manipulative-stem-leaf-bg',
  } as any);
  objects.push(bg);

  // Title
  const title = new IText('Stem-and-Leaf Plot', {
    left: x, top: oy,
    fontSize: 14, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-stem-leaf-title',
  } as any);
  objects.push(title);

  // Headers
  const stemHeader = new IText('Stem', {
    left: ox + 10, top: oy + 24,
    fontSize: 12, fontFamily: 'Inter', fill: '#6b7280', fontWeight: 'bold',
    name: 'manipulative-stem-leaf-stem-header',
  } as any);
  const leafHeader = new IText('Leaves', {
    left: ox + 65, top: oy + 24,
    fontSize: 12, fontFamily: 'Inter', fill: '#6b7280', fontWeight: 'bold',
    name: 'manipulative-stem-leaf-leaf-header',
  } as any);
  objects.push(stemHeader, leafHeader);

  // Divider
  const divider = new Line([ox, oy + 42, ox + 200, oy + 42], {
    stroke: '#e5e7eb', strokeWidth: 1, name: 'manipulative-stem-leaf-divider',
  } as any);
  objects.push(divider);

  // Data rows
  data.forEach((row, i) => {
    const ry = oy + 48 + i * rowHeight;
    const stemLbl = new IText(row.stem, {
      left: ox + 20, top: ry,
      fontSize: 14, fontFamily: 'Inter', fill: '#374151', fontWeight: 'bold',
      name: `manipulative-stem-leaf-stem-${i}`,
    } as any);
    const leafLbl = new IText(row.leaves, {
      left: ox + 65, top: ry,
      fontSize: 14, fontFamily: 'Inter', fill: '#3b82f6',
      name: `manipulative-stem-leaf-leaves-${i}`,
    } as any);
    const sep = new Line([ox + 48, ry - 2, ox + 48, ry + 16], {
      stroke: '#d1d5db', strokeWidth: 1, name: `manipulative-stem-leaf-sep-${i}`,
    } as any);
    objects.push(stemLbl, leafLbl, sep);
  });

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-stem-leaf-plot-${Date.now()}`;
  return [group];
}

// ---- SCIENCE (6 new) ----

// ============================================================
// Solar System
// ============================================================

function createSolarSystem(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];

  // Sun
  const sun = new Circle({
    left: x, top: y, radius: 22,
    fill: '#fbbf24', stroke: '#f59e0b', strokeWidth: 2,
    originX: 'center', originY: 'center',
    name: 'manipulative-solar-system-sun',
  } as any);
  objects.push(sun);
  const sunLabel = new IText('Sun', {
    left: x, top: y + 28,
    fontSize: 9, fontFamily: 'Inter', fill: '#92400e',
    originX: 'center',
    name: 'manipulative-solar-system-sun-label',
  } as any);
  objects.push(sunLabel);

  const planets = [
    { name: 'Mercury', r: 40, size: 4, color: '#9ca3af' },
    { name: 'Venus', r: 55, size: 6, color: '#f97316' },
    { name: 'Earth', r: 72, size: 7, color: '#3b82f6' },
    { name: 'Mars', r: 90, size: 5, color: '#ef4444' },
    { name: 'Jupiter', r: 115, size: 14, color: '#f59e0b' },
    { name: 'Saturn', r: 140, size: 12, color: '#eab308' },
    { name: 'Uranus', r: 162, size: 9, color: '#14b8a6' },
    { name: 'Neptune', r: 182, size: 8, color: '#3b82f6' },
  ];

  planets.forEach((p, i) => {
    // Orbit
    const orbit = new Circle({
      left: x, top: y, radius: p.r,
      fill: 'transparent', stroke: '#e5e7eb', strokeWidth: 0.8,
      originX: 'center', originY: 'center',
      name: `manipulative-solar-system-orbit-${i}`,
    } as any);
    objects.push(orbit);

    // Planet (place at top of orbit)
    const px = x;
    const py = y - p.r;
    const planet = new Circle({
      left: px, top: py, radius: p.size,
      fill: p.color, stroke: '#ffffff', strokeWidth: 1,
      originX: 'center', originY: 'center',
      name: `manipulative-solar-system-planet-${i}`,
    } as any);
    objects.push(planet);

    // Saturn rings
    if (p.name === 'Saturn') {
      const ring = new Ellipse({
        left: px, top: py, rx: p.size + 8, ry: 3,
        fill: 'transparent', stroke: '#d97706', strokeWidth: 1.5,
        originX: 'center', originY: 'center',
        name: 'manipulative-solar-system-saturn-ring',
      } as any);
      objects.push(ring);
    }

    // Label
    const label = new IText(p.name, {
      left: px, top: py - p.size - 6,
      fontSize: 8, fontFamily: 'Inter', fill: '#6b7280',
      originX: 'center', originY: 'bottom',
      name: `manipulative-solar-system-label-${i}`,
    } as any);
    objects.push(label);
  });

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-solar-system-${Date.now()}`;
  return [group];
}

// ============================================================
// Rock Cycle
// ============================================================

function createRockCycle(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0, radius = 100 } = params;
  const objects: FabricObject[] = [];

  // Three nodes in triangle
  const nodes = [
    { label: 'Igneous', sublabel: 'Magma cools', color: '#ef4444', angle: -90 },
    { label: 'Sedimentary', sublabel: 'Compaction', color: '#eab308', angle: 30 },
    { label: 'Metamorphic', sublabel: 'Heat & Pressure', color: '#8b5cf6', angle: 150 },
  ];

  const positions = nodes.map(n => ({
    px: x + radius * Math.cos((n.angle * Math.PI) / 180),
    py: y + radius * Math.sin((n.angle * Math.PI) / 180),
    ...n,
  }));

  // Curved arrows between nodes
  for (let i = 0; i < positions.length; i++) {
    const from = positions[i];
    const to = positions[(i + 1) % positions.length];
    // Simple line arrows
    const arrow = new Line([from.px, from.py, to.px, to.py], {
      stroke: '#9ca3af', strokeWidth: 2, strokeDashArray: [6, 4],
      name: `manipulative-rock-cycle-arrow-${i}`,
    } as any);
    objects.push(arrow);

    // Arrowhead
    const mid = { x: (from.px + to.px) / 2, y: (from.py + to.py) / 2 };
    const processLabel = new IText(i === 0 ? 'Weathering' : i === 1 ? 'Heating' : 'Melting', {
      left: mid.x, top: mid.y - 10,
      fontSize: 10, fontFamily: 'Inter', fill: '#6b7280',
      originX: 'center',
      name: `manipulative-rock-cycle-process-${i}`,
    } as any);
    objects.push(processLabel);
  }

  // Nodes
  positions.forEach((p, i) => {
    const box = new Rect({
      left: p.px - 45, top: p.py - 20, width: 90, height: 40,
      fill: p.color + '20', stroke: p.color, strokeWidth: 2, rx: 8,
      name: `manipulative-rock-cycle-node-${i}`,
    } as any);
    objects.push(box);

    const label = new IText(p.label, {
      left: p.px, top: p.py - 6,
      fontSize: 13, fontFamily: 'Inter', fill: p.color,
      originX: 'center', originY: 'center', fontWeight: 'bold',
      name: `manipulative-rock-cycle-label-${i}`,
    } as any);
    objects.push(label);
  });

  // Title
  const title = new IText('Rock Cycle', {
    left: x, top: y + radius + 30,
    fontSize: 16, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-rock-cycle-title',
  } as any);
  objects.push(title);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-rock-cycle-${Date.now()}`;
  return [group];
}

// ============================================================
// Water Cycle
// ============================================================

function createWaterCycle(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];

  // Background
  const bg = new Rect({
    left: x - 170, top: y - 120, width: 340, height: 240,
    fill: '#eff6ff', stroke: '#d1d5db', strokeWidth: 1, rx: 12,
    name: 'manipulative-water-cycle-bg',
  } as any);
  objects.push(bg);

  // Sun
  const sun = new Circle({
    left: x + 120, top: y - 85, radius: 25,
    fill: '#fbbf24', stroke: '#f59e0b', strokeWidth: 2,
    originX: 'center', originY: 'center',
    name: 'manipulative-water-cycle-sun',
  } as any);
  objects.push(sun);

  // Water body
  const water = new Ellipse({
    left: x, top: y + 80, rx: 140, ry: 25,
    fill: '#bfdbfe', stroke: '#3b82f6', strokeWidth: 2,
    originX: 'center', originY: 'center',
    name: 'manipulative-water-cycle-water',
  } as any);
  objects.push(water);

  // Land/mountain
  const mountain = new Triangle({
    left: x - 60, top: y - 20,
    width: 120, height: 80,
    fill: '#86efac', stroke: '#22c55e', strokeWidth: 2,
    originX: 'center', originY: 'bottom',
    name: 'manipulative-water-cycle-mountain',
  } as any);
  objects.push(mountain);

  // Cloud
  const cloud1 = new Circle({ left: x - 80, top: y - 70, radius: 20, fill: '#e5e7eb', originX: 'center', originY: 'center', name: 'manipulative-water-cycle-cloud1' } as any);
  const cloud2 = new Circle({ left: x - 60, top: y - 80, radius: 24, fill: '#d1d5db', originX: 'center', originY: 'center', name: 'manipulative-water-cycle-cloud2' } as any);
  const cloud3 = new Circle({ left: x - 40, top: y - 70, radius: 20, fill: '#e5e7eb', originX: 'center', originY: 'center', name: 'manipulative-water-cycle-cloud3' } as any);
  objects.push(cloud1, cloud2, cloud3);

  // Process labels with arrows
  const processes = [
    { label: 'Evaporation', lx: x + 50, ly: y + 40, color: '#f97316' },
    { label: 'Condensation', lx: x - 130, ly: y - 50, color: '#6b7280' },
    { label: 'Precipitation', lx: x - 40, ly: y - 20, color: '#3b82f6' },
    { label: 'Collection', lx: x, top: y + 90, color: '#22c55e' } as any,
  ];

  processes.forEach((p, i) => {
    const lbl = new IText(p.label, {
      left: p.lx, top: p.ly,
      fontSize: 11, fontFamily: 'Inter', fill: p.color,
      originX: 'center', fontWeight: 'bold',
      name: `manipulative-water-cycle-label-${i}`,
    } as any);
    objects.push(lbl);
  });

  // Arrows (simplified as lines)
  const arrows = [
    [x + 50, y + 60, x + 50, y - 30],   // evaporation up
    [x + 50, y - 50, x - 20, y - 70],    // condensation left
    [x - 40, y - 50, x - 40, y + 40],    // precipitation down
    [x - 40, y + 70, x + 80, y + 70],    // collection right
  ];
  arrows.forEach(([x1, y1, x2, y2], i) => {
    const arr = new Line([x1, y1, x2, y2], {
      stroke: '#6b7280', strokeWidth: 1.5, strokeDashArray: [4, 3],
      name: `manipulative-water-cycle-arrow-${i}`,
    } as any);
    objects.push(arr);
  });

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-water-cycle-${Date.now()}`;
  return [group];
}

// ============================================================
// Food Chain
// ============================================================

function createFoodChain(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];

  const levels = [
    { label: 'Sun', sublabel: 'Energy Source', color: '#fbbf24' },
    { label: 'Grass', sublabel: 'Producer', color: '#22c55e' },
    { label: 'Grasshopper', sublabel: 'Primary Consumer', color: '#f97316' },
    { label: 'Frog', sublabel: 'Secondary Consumer', color: '#3b82f6' },
    { label: 'Snake', sublabel: 'Tertiary Consumer', color: '#ef4444' },
  ];

  const boxW = 100;
  const boxH = 36;
  const gap = 12;
  const totalH = levels.length * boxH + (levels.length - 1) * gap;
  const startY = y - totalH / 2;

  levels.forEach((level, i) => {
    const ly = startY + i * (boxH + gap);
    const box = new Rect({
      left: x - boxW / 2, top: ly, width: boxW, height: boxH,
      fill: level.color + '20', stroke: level.color, strokeWidth: 2, rx: 6,
      name: `manipulative-food-chain-node-${i}`,
    } as any);
    objects.push(box);

    const label = new IText(level.label, {
      left: x - 10, top: ly + 4,
      fontSize: 13, fontFamily: 'Inter', fill: '#374151',
      originX: 'center', fontWeight: 'bold',
      name: `manipulative-food-chain-label-${i}`,
    } as any);
    objects.push(label);

    const sublabel = new IText(level.sublabel, {
      left: x - 10, top: ly + 20,
      fontSize: 9, fontFamily: 'Inter', fill: '#6b7280',
      originX: 'center',
      name: `manipulative-food-chain-sublabel-${i}`,
    } as any);
    objects.push(sublabel);

    // Arrow between nodes
    if (i < levels.length - 1) {
      const arrow = new Line([x, ly + boxH, x, ly + boxH + gap], {
        stroke: '#374151', strokeWidth: 2,
        name: `manipulative-food-chain-arrow-${i}`,
      } as any);
      objects.push(arrow);
      // Arrowhead
      const head = new Triangle({
        left: x, top: ly + boxH + gap - 2,
        width: 8, height: 8, fill: '#374151',
        originX: 'center', originY: 'center', angle: 180,
        name: `manipulative-food-chain-arrowhead-${i}`,
      } as any);
      objects.push(head);
    }
  });

  // Title
  const title = new IText('Food Chain', {
    left: x, top: startY - 20,
    fontSize: 15, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-food-chain-title',
  } as any);
  objects.push(title);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-food-chain-${Date.now()}`;
  return [group];
}

// ============================================================
// Human Heart
// ============================================================

function createHumanHeart(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];

  // Heart outline using Path
  const heartPath = 'M 0 -40 C -50 -80, -90 -30, -50 10 C -20 40, 0 70, 0 80 C 0 70, 20 40, 50 10 C 90 -30, 50 -80, 0 -40 Z';
  const heart = new Path(heartPath, {
    left: x, top: y,
    fill: '#fecaca', stroke: '#ef4444', strokeWidth: 2.5,
    originX: 'center', originY: 'center',
    name: 'manipulative-human-heart-outline',
  } as any);
  objects.push(heart);

  // Chambers (simplified rectangles inside)
  const chambers = [
    { label: 'RA', lx: x - 28, ly: y - 20, color: '#bfdbfe' },
    { label: 'LA', lx: x + 8, ly: y - 20, color: '#bbf7d0' },
    { label: 'RV', lx: x - 28, ly: y + 10, color: '#fde68a' },
    { label: 'LV', lx: x + 8, ly: y + 10, color: '#fbcfe8' },
  ];

  chambers.forEach((ch) => {
    const box = new Rect({
      left: ch.lx, top: ch.ly, width: 36, height: 26,
      fill: ch.color, stroke: '#374151', strokeWidth: 1, rx: 4,
      name: `manipulative-human-heart-chamber-${ch.label}`,
    } as any);
    objects.push(box);

    const lbl = new IText(ch.label, {
      left: ch.lx + 18, top: ch.ly + 13,
      fontSize: 11, fontFamily: 'Inter', fill: '#374151',
      originX: 'center', originY: 'center', fontWeight: 'bold',
      name: `manipulative-human-heart-chamber-label-${ch.label}`,
    } as any);
    objects.push(lbl);
  });

  // Flow arrows
  const flows = [
    [x - 28, y + 10, x - 28, y - 20], // RA → RV (down)
    [x + 44, y - 7, x + 8, y - 7],   // LA → RA (left)
    [x + 44, y + 23, x + 44, y + 40], // LV out (down)
  ];
  flows.forEach(([x1, y1, x2, y2], i) => {
    const arrow = new Line([x1, y1, x2, y2], {
      stroke: '#ef4444', strokeWidth: 2, strokeLineCap: 'round',
      name: `manipulative-human-heart-flow-${i}`,
    } as any);
    objects.push(arrow);
  });

  // Title
  const title = new IText('Human Heart', {
    left: x, top: y + 90,
    fontSize: 14, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-human-heart-title',
  } as any);
  objects.push(title);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-human-heart-${Date.now()}`;
  return [group];
}

// ============================================================
// pH Scale
// ============================================================

function createPHScale(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];
  const width = 400;
  const height = 40;
  const ox = x - width / 2;
  const oy = y - height / 2;

  // Color gradient bar (segments)
  const phColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  ];
  const segW = width / 14;
  phColors.forEach((color, i) => {
    const seg = new Rect({
      left: ox + i * segW, top: oy, width: segW + 1, height: height,
      fill: color, stroke: 'transparent', strokeWidth: 0,
      name: `manipulative-ph-scale-seg-${i}`,
    } as any);
    objects.push(seg);
  });

  // Border
  const border = new Rect({
    left: ox, top: oy, width: width, height: height,
    fill: 'transparent', stroke: '#374151', strokeWidth: 2, rx: 4,
    name: 'manipulative-ph-scale-border',
  } as any);
  objects.push(border);

  // Number labels
  for (let i = 0; i <= 14; i++) {
    const lx = ox + (i / 14) * width;
    const lbl = new IText(String(i), {
      left: lx, top: oy + height + 6,
      fontSize: 11, fontFamily: 'Inter', fill: '#374151',
      originX: 'center', fontWeight: 'bold',
      name: `manipulative-ph-scale-num-${i}`,
    } as any);
    objects.push(lbl);
  }

  // Example substances
  const examples = [
    { label: 'Acid', x: ox + (1 / 14) * width, color: '#ef4444' },
    { label: 'Water', x: ox + (7 / 14) * width, color: '#22c55e' },
    { label: 'Base', x: ox + (13 / 14) * width, color: '#a855f7' },
  ];
  examples.forEach((ex) => {
    const lbl = new IText(ex.label, {
      left: ex.x, top: oy - 14,
      fontSize: 11, fontFamily: 'Inter', fill: ex.color,
      originX: 'center', fontWeight: 'bold',
      name: `manipulative-ph-scale-example-${ex.label}`,
    } as any);
    objects.push(lbl);
  });

  // Arrow indicators
  const acidArrow = new Line([ox, oy + height + 28, ox + width / 2 - 10, oy + height + 28], {
    stroke: '#ef4444', strokeWidth: 2, name: 'manipulative-ph-scale-acid-arrow',
  } as any);
  const baseArrow = new Line([ox + width / 2 + 10, oy + height + 28, ox + width, oy + height + 28], {
    stroke: '#a855f7', strokeWidth: 2, name: 'manipulative-ph-scale-base-arrow',
  } as any);
  objects.push(acidArrow, baseArrow);

  const acidLabel = new IText('← Acidic', {
    left: ox + 30, top: oy + height + 32,
    fontSize: 12, fontFamily: 'Inter', fill: '#ef4444', fontWeight: 'bold',
    name: 'manipulative-ph-scale-acid-label',
  } as any);
  const baseLabel = new IText('Basic →', {
    left: ox + width - 50, top: oy + height + 32,
    fontSize: 12, fontFamily: 'Inter', fill: '#a855f7', fontWeight: 'bold',
    name: 'manipulative-ph-scale-base-label',
  } as any);
  objects.push(acidLabel, baseLabel);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-ph-scale-${Date.now()}`;
  return [group];
}

// ---- LANGUAGE (4 new) ----

// ============================================================
// Word Web
// ============================================================

function createWordWeb(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0, word = 'Happy' } = params;
  const objects: FabricObject[] = [];

  const synonyms = ['Joyful', 'Glad', 'Cheerful', 'Content'];
  const antonyms = ['Sad', 'Unhappy', 'Miserable', 'Gloomy'];
  const branches = [...synonyms.map(s => ({ text: s, type: 'synonym' as const })), ...antonyms.map(a => ({ text: a, type: 'antonym' as const }))];

  // Center word
  const centerCircle = new Circle({
    left: x, top: y, radius: 36,
    fill: '#dbeafe', stroke: '#3b82f6', strokeWidth: 2,
    originX: 'center', originY: 'center',
    name: 'manipulative-word-web-center',
  } as any);
  objects.push(centerCircle);

  const centerText = new IText(word, {
    left: x, top: y,
    fontSize: 16, fontFamily: 'Inter', fill: '#1e40af',
    originX: 'center', originY: 'center', fontWeight: 'bold',
    name: 'manipulative-word-web-center-text',
  } as any);
  objects.push(centerText);

  // Branches
  branches.forEach((branch, i) => {
    const angle = (i / branches.length) * 2 * Math.PI - Math.PI / 2;
    const dist = 90;
    const bx = x + dist * Math.cos(angle);
    const by = y + dist * Math.sin(angle);
    const color = branch.type === 'synonym' ? '#22c55e' : '#ef4444';

    // Connecting line
    const line = new Line([x, y, bx, by], {
      stroke: color, strokeWidth: 2, name: `manipulative-word-web-line-${i}`,
    } as any);
    objects.push(line);

    // Branch bubble
    const bubble = new Circle({
      left: bx, top: by, radius: 28,
      fill: color + '15', stroke: color, strokeWidth: 1.5,
      originX: 'center', originY: 'center',
      name: `manipulative-word-web-bubble-${i}`,
    } as any);
    objects.push(bubble);

    // Branch text
    const text = new IText(branch.text, {
      left: bx, top: by,
      fontSize: 11, fontFamily: 'Inter', fill: color,
      originX: 'center', originY: 'center',
      name: `manipulative-word-web-text-${i}`,
    } as any);
    objects.push(text);
  });

  // Legend
  const synLegend = new IText('● Synonyms', {
    left: x - 60, top: y + 120,
    fontSize: 11, fontFamily: 'Inter', fill: '#22c55e', fontWeight: 'bold',
    name: 'manipulative-word-web-syn-legend',
  } as any);
  const antLegend = new IText('● Antonyms', {
    left: x + 20, top: y + 120,
    fontSize: 11, fontFamily: 'Inter', fill: '#ef4444', fontWeight: 'bold',
    name: 'manipulative-word-web-ant-legend',
  } as any);
  objects.push(synLegend, antLegend);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-word-web-${Date.now()}`;
  return [group];
}

// ============================================================
// Writing Paragraph (Hamburger Model)
// ============================================================

function createWritingParagraph(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];

  const layers = [
    { label: 'Conclusion', sublabel: 'Restate + closing', color: '#f97316', w: 140, h: 24 },
    { label: 'Detail 3', sublabel: 'Supporting evidence', color: '#eab308', w: 170, h: 28 },
    { label: 'Detail 2', sublabel: 'Supporting evidence', color: '#22c55e', w: 190, h: 28 },
    { label: 'Detail 1', sublabel: 'Supporting evidence', color: '#14b8a6', w: 210, h: 28 },
    { label: 'Topic Sentence', sublabel: 'Main idea', color: '#ef4444', w: 230, h: 30 },
  ];

  let currentY = y - 100;
  layers.forEach((layer, i) => {
    const lx = x - layer.w / 2;
    const box = new Rect({
      left: lx, top: currentY, width: layer.w, height: layer.h,
      fill: layer.color + '25', stroke: layer.color, strokeWidth: 2, rx: 6,
      name: `manipulative-writing-paragraph-layer-${i}`,
    } as any);
    objects.push(box);

    const label = new IText(layer.label, {
      left: x, top: currentY + (i === 0 || i === 4 ? 4 : 5),
      fontSize: 13, fontFamily: 'Inter', fill: layer.color,
      originX: 'center', fontWeight: 'bold',
      name: `manipulative-writing-paragraph-label-${i}`,
    } as any);
    objects.push(label);

    if (i !== 4 && i !== 0) {
      const sub = new IText(layer.sublabel, {
        left: x, top: currentY + 18,
        fontSize: 9, fontFamily: 'Inter', fill: '#6b7280',
        originX: 'center',
        name: `manipulative-writing-paragraph-sub-${i}`,
      } as any);
      objects.push(sub);
    }

    currentY += layer.h + 4;
  });

  // Title
  const title = new IText('Hamburger Paragraph Model', {
    left: x, top: y - 130,
    fontSize: 14, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-writing-paragraph-title',
  } as any);
  objects.push(title);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-writing-paragraph-${Date.now()}`;
  return [group];
}

// ============================================================
// Grammar Tree
// ============================================================

function createGrammarTree(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0, sentence = 'The cat sat' } = params;
  const objects: FabricObject[] = [];

  // Parse tree structure (simplified SVO)
  const tree = {
    label: 'S', children: [
      { label: 'NP', text: 'The cat', children: [
        { label: 'Det', text: 'The' },
        { label: 'N', text: 'cat' },
      ]},
      { label: 'VP', text: 'sat', children: [
        { label: 'V', text: 'sat' },
      ]},
    ]
  };

  const levels: Array<Array<{ label: string; text?: string; lx: number }>> = [];

  // Level 0: S
  levels.push([{ label: tree.label, text: sentence, lx: x }]);

  // Level 1: NP, VP
  const l1Count = tree.children.length;
  const l1Spacing = 120;
  levels.push(tree.children.map((child, i) => ({
    label: child.label, text: child.text,
    lx: x + (i - (l1Count - 1) / 2) * l1Spacing,
  })));

  // Level 2: Det, N, V
  const l2Nodes: Array<{ label: string; text?: string; lx: number }> = [];
  tree.children.forEach((child, ci) => {
    const parentX = levels[1][ci].lx;
    const count = child.children.length;
    child.children.forEach((grandchild, gi) => {
      l2Nodes.push({
        label: grandchild.label, text: grandchild.text,
        lx: parentX + (gi - (count - 1) / 2) * 50,
      });
    });
  });
  levels.push(l2Nodes);

  const startY = y - 60;
  const levelGap = 50;

  levels.forEach((level, li) => {
    const ly = startY + li * levelGap;
    level.forEach((node) => {
      // Draw connecting lines to parent
      if (li > 0) {
        const parent = levels[li - 1].find(p =>
      Math.abs(p.lx - node.lx) < 100
        );
        if (parent) {
          const line = new Line([parent.lx, startY + (li - 1) * levelGap + 20, node.lx, ly], {
            stroke: '#9ca3af', strokeWidth: 1.5,
            name: `manipulative-grammar-tree-line-${li}-${node.label}`,
          } as any);
          objects.push(line);
        }
      }

      // Node label
      const isWord = li === levels.length - 1;
      const nodeColor = isWord ? '#374151' : '#3b82f6';
      const bgBox = new Rect({
        left: node.lx - 18, top: ly - 10, width: 36, height: 20,
        fill: isWord ? '#f3f4f6' : '#dbeafe',
        stroke: isWord ? '#d1d5db' : '#3b82f6',
        strokeWidth: 1, rx: 4,
        name: `manipulative-grammar-tree-node-bg-${li}-${node.label}`,
      } as any);
      objects.push(bgBox);

      const label = new IText(node.label, {
        left: node.lx, top: ly,
        fontSize: 12, fontFamily: 'Inter', fill: nodeColor,
        originX: 'center', originY: 'center', fontWeight: 'bold',
        name: `manipulative-grammar-tree-node-${li}-${node.label}`,
      } as any);
      objects.push(label);

      // Word text below terminal nodes
      if (isWord && node.text) {
        const wordText = new IText(node.text, {
          left: node.lx, top: ly + 16,
          fontSize: 13, fontFamily: 'Inter', fill: '#374151',
          originX: 'center', fontStyle: 'italic',
          name: `manipulative-grammar-tree-word-${node.label}`,
        } as any);
        objects.push(wordText);
      }
    });
  });

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-grammar-tree-${Date.now()}`;
  return [group];
}

// ============================================================
// Spiral Curriculum
// ============================================================

function createSpiralCurriculum(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];

  const spirals = [
    { label: 'Review', radius: 30, color: '#ef4444' },
    { label: 'New Topic', radius: 60, color: '#f97316' },
    { label: 'Deeper', radius: 90, color: '#eab308' },
    { label: 'Application', radius: 120, color: '#22c55e' },
  ];

  // Spirals (ellipses to suggest depth)
  spirals.forEach((s, i) => {
    const ellipse = new Ellipse({
      left: x, top: y, rx: s.radius, ry: s.radius * 0.7,
      fill: 'transparent', stroke: s.color, strokeWidth: 2,
      originX: 'center', originY: 'center',
      name: `manipulative-spiral-curriculum-ellipse-${i}`,
    } as any);
    objects.push(ellipse);
  });

  // Ascending arrow (suggests going up in complexity)
  const arrowPath = `M ${x - 120} ${y + 60} Q ${x} ${y - 140} ${x + 120} ${y + 60}`;
  const arrow = new Path(arrowPath, {
    fill: 'transparent', stroke: '#8b5cf6', strokeWidth: 3,
    strokeDashArray: [8, 4],
    name: 'manipulative-spiral-curriculum-arrow',
  } as any);
  objects.push(arrow);

  // Arrow tip
  const tip = new Triangle({
    left: x + 120, top: y + 55,
    width: 14, height: 14, fill: '#8b5cf6',
    originX: 'center', originY: 'center', angle: -30,
    name: 'manipulative-spiral-curriculum-tip',
  } as any);
  objects.push(tip);

  // Labels on the right
  spirals.forEach((s, i) => {
    const lbl = new IText(s.label, {
      left: x + s.radius + 12, top: y - 4 + i * 2,
      fontSize: 11, fontFamily: 'Inter', fill: s.color,
      originY: 'center', fontWeight: 'bold',
      name: `manipulative-spiral-curriculum-label-${i}`,
    } as any);
    objects.push(lbl);
  });

  // Center label
  const center = new IText('Core\nConcept', {
    left: x, top: y,
    fontSize: 12, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', originY: 'center', fontWeight: 'bold',
    name: 'manipulative-spiral-curriculum-center',
  } as any);
  objects.push(center);

  // Title
  const title = new IText('Spiral Curriculum', {
    left: x, top: y + 110,
    fontSize: 15, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-spiral-curriculum-title',
  } as any);
  objects.push(title);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-spiral-curriculum-${Date.now()}`;
  return [group];
}

// ---- SOCIAL STUDIES (3 new) ----

// ============================================================
// World Map (Simplified Continents)
// ============================================================

function createWorldMapContinent(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];

  // Ocean background
  const ocean = new Rect({
    left: x - 200, top: y - 100, width: 400, height: 200,
    fill: '#dbeafe', stroke: '#374151', strokeWidth: 2, rx: 8,
    name: 'manipulative-world-map-ocean',
  } as any);
  objects.push(ocean);

  // Simplified continent shapes (rectangles with rounded corners as approximations)
  const continents = [
    { label: 'N. America', lx: -140, ly: -60, w: 80, h: 55, color: '#22c55e' },
    { label: 'S. America', lx: -110, ly: 10, w: 45, h: 70, color: '#16a34a' },
    { label: 'Europe', lx: 10, ly: -60, w: 50, h: 40, color: '#f97316' },
    { label: 'Africa', lx: 15, ly: -15, w: 55, h: 75, color: '#eab308' },
    { label: 'Asia', lx: 70, ly: -70, w: 100, h: 65, color: '#ef4444' },
    { label: 'Australia', lx: 130, ly: 25, w: 45, h: 35, color: '#8b5cf6' },
  { label: 'Antarctica', lx: -50, ly: 75, w: 180, h: 18, color: '#e5e7eb' },
  ];

  continents.forEach((c, i) => {
    const cx = x + c.lx + c.w / 2;
    const cy = y + c.ly + c.h / 2;
    const shape = new Rect({
      left: x + c.lx, top: y + c.ly, width: c.w, height: c.h,
      fill: c.color + '40', stroke: c.color, strokeWidth: 1.5, rx: 6,
      name: `manipulative-world-map-continent-${i}`,
    } as any);
    objects.push(shape);

    const label = new IText(c.label, {
      left: cx, top: cy,
      fontSize: 9, fontFamily: 'Inter', fill: '#374151',
      originX: 'center', originY: 'center', fontWeight: 'bold',
      name: `manipulative-world-map-label-${i}`,
    } as any);
    objects.push(label);
  });

  // Equator line
  const equator = new Line([x - 200, y, x + 200, y], {
    stroke: '#3b82f6', strokeWidth: 1, strokeDashArray: [4, 4],
    name: 'manipulative-world-map-equator',
  } as any);
  objects.push(equator);
  const eqLabel = new IText('Equator', {
    left: x + 210, top: y - 6,
    fontSize: 9, fontFamily: 'Inter', fill: '#3b82f6',
    name: 'manipulative-world-map-equator-label',
  } as any);
  objects.push(eqLabel);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-world-map-continent-${Date.now()}`;
  return [group];
}

// ============================================================
// Government Branches
// ============================================================

function createGovernmentBranches(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];

  // Top node: Government
  const topBox = new Rect({
    left: x - 55, top: y - 80, width: 110, height: 36,
    fill: '#1e40af', stroke: '#1e3a8a', strokeWidth: 2, rx: 6,
    name: 'manipulative-government-branches-top',
  } as any);
  objects.push(topBox);
  const topLabel = new IText('Government', {
    left: x, top: y - 62,
    fontSize: 14, fontFamily: 'Inter', fill: '#ffffff',
    originX: 'center', originY: 'center', fontWeight: 'bold',
    name: 'manipulative-government-branches-top-label',
  } as any);
  objects.push(topLabel);

  const branches = [
    { label: 'Executive', desc: 'President', color: '#ef4444' },
    { label: 'Legislative', desc: 'Congress', color: '#3b82f6' },
    { label: 'Judicial', desc: 'Supreme Court', color: '#22c55e' },
  ];

  const spacing = 130;
  const branchY = y + 10;

  branches.forEach((branch, i) => {
    const bx = x + (i - 1) * spacing;

    // Connecting line
    const line = new Line([x, y - 44, bx, branchY - 22], {
      stroke: '#374151', strokeWidth: 2,
      name: `manipulative-government-branches-line-${i}`,
    } as any);
    objects.push(line);

    // Branch box
    const box = new Rect({
      left: bx - 52, top: branchY - 22, width: 104, height: 50,
      fill: branch.color + '15', stroke: branch.color, strokeWidth: 2, rx: 6,
      name: `manipulative-government-branches-branch-${i}`,
    } as any);
    objects.push(box);

    const label = new IText(branch.label, {
      left: bx, top: branchY - 6,
      fontSize: 13, fontFamily: 'Inter', fill: branch.color,
      originX: 'center', fontWeight: 'bold',
      name: `manipulative-government-branches-label-${i}`,
    } as any);
    objects.push(label);

    const desc = new IText(branch.desc, {
      left: bx, top: branchY + 12,
      fontSize: 10, fontFamily: 'Inter', fill: '#6b7280',
      originX: 'center',
      name: `manipulative-government-branches-desc-${i}`,
    } as any);
    objects.push(desc);
  });

  // Checks & Balances label
  const checksLabel = new IText('Checks & Balances', {
    left: x, top: y + 65,
    fontSize: 12, fontFamily: 'Inter', fill: '#6b7280',
    originX: 'center', fontStyle: 'italic',
    name: 'manipulative-government-branches-checks',
  } as any);
  objects.push(checksLabel);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-government-branches-${Date.now()}`;
  return [group];
}

// ============================================================
// Economic Cycle
// ============================================================

function createEconomicCycle(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0, radius = 90 } = params;
  const objects: FabricObject[] = [];

  const stages = [
    { label: 'Production', sublabel: 'Goods & services', color: '#3b82f6', angle: -90 },
    { label: 'Income', sublabel: 'Wages & profits', color: '#22c55e', angle: 0 },
    { label: 'Spending', sublabel: 'Consumption', color: '#f97316', angle: 90 },
    { label: 'Revenue', sublabel: 'Business income', color: '#8b5cf6', angle: 180 },
  ];

  // Center label
  const centerLabel = new IText('Economic\nCycle', {
    left: x, top: y,
    fontSize: 14, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', originY: 'center', fontWeight: 'bold',
    name: 'manipulative-economic-cycle-center',
  } as any);
  objects.push(centerLabel);

  const positions = stages.map(s => ({
    px: x + radius * Math.cos((s.angle * Math.PI) / 180),
    py: y + radius * Math.sin((s.angle * Math.PI) / 180),
    ...s,
  }));

  // Arrows between stages
  for (let i = 0; i < positions.length; i++) {
    const from = positions[i];
    const to = positions[(i + 1) % positions.length];
    const arrow = new Line([from.px, from.py, to.px, to.py], {
      stroke: '#9ca3af', strokeWidth: 2,
      name: `manipulative-economic-cycle-arrow-${i}`,
    } as any);
    objects.push(arrow);

    // Arrowhead triangle
    const head = new Triangle({
      left: to.px, top: to.py,
      width: 10, height: 10, fill: '#9ca3af',
      originX: 'center', originY: 'center',
      angle: Math.atan2(to.py - from.py, to.px - from.px) * (180 / Math.PI) + 90,
      name: `manipulative-economic-cycle-head-${i}`,
    } as any);
    objects.push(head);
  }

  // Stage nodes
  positions.forEach((p, i) => {
    const box = new Rect({
      left: p.px - 48, top: p.py - 22, width: 96, height: 44,
      fill: p.color + '20', stroke: p.color, strokeWidth: 2, rx: 8,
      name: `manipulative-economic-cycle-node-${i}`,
    } as any);
    objects.push(box);

    const label = new IText(p.label, {
      left: p.px, top: p.py - 6,
      fontSize: 12, fontFamily: 'Inter', fill: p.color,
      originX: 'center', fontWeight: 'bold',
      name: `manipulative-economic-cycle-label-${i}`,
    } as any);
    objects.push(label);

    const sublabel = new IText(p.sublabel, {
      left: p.px, top: p.py + 10,
      fontSize: 9, fontFamily: 'Inter', fill: '#6b7280',
      originX: 'center',
      name: `manipulative-economic-cycle-sublabel-${i}`,
    } as any);
    objects.push(sublabel);
  });

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-economic-cycle-${Date.now()}`;
  return [group];
}

// ---- TEST PREP (3 new) ----

// ============================================================
// Answer Grid Bubble (SAT/ACT style)
// ============================================================

function createAnswerGridBubble(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0, rows = 5, cols = 5 } = params;
  const objects: FabricObject[] = [];
  const options = ['A', 'B', 'C', 'D', 'E'];
  const bubbleR = 10;
  const cellW = 40;
  const cellH = 32;
  const totalW = cols * cellW + 50;
  const totalH = rows * cellH + 30;
  const ox = x - totalW / 2;
  const oy = y - totalH / 2;

  // Background
  const bg = new Rect({
    left: ox - 8, top: oy - 8, width: totalW + 16, height: totalH + 16,
    fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1, rx: 6,
    name: 'manipulative-answer-grid-bg',
  } as any);
  objects.push(bg);

  // Header row
  options.forEach((opt, i) => {
    const lbl = new IText(opt, {
      left: ox + 55 + i * cellW + cellW / 2, top: oy + 4,
      fontSize: 12, fontFamily: 'Inter', fill: '#374151',
      originX: 'center', fontWeight: 'bold',
      name: `manipulative-answer-grid-header-${i}`,
    } as any);
    objects.push(lbl);
  });

  // Question rows with bubbles
  for (let r = 0; r < rows; r++) {
    const ry = oy + 26 + r * cellH;

    // Question number
    const num = new IText(String(r + 1), {
      left: ox + 18, top: ry + 4,
      fontSize: 12, fontFamily: 'Inter', fill: '#374151',
      originX: 'center',
      name: `manipulative-answer-grid-num-${r}`,
    } as any);
    objects.push(num);

    // Bubbles
    for (let c = 0; c < cols; c++) {
      const cx = ox + 55 + c * cellW + cellW / 2;
      const cy = ry + 8;
      const bubble = new Circle({
        left: cx, top: cy, radius: bubbleR,
        fill: 'transparent', stroke: '#374151', strokeWidth: 1.5,
        originX: 'center', originY: 'center',
        name: `manipulative-answer-grid-bubble-${r}-${c}`,
      } as any);
      objects.push(bubble);
    }
  }

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-answer-grid-bubble-${Date.now()}`;
  return [group];
}

// ============================================================
// Test Strategy Clock
// ============================================================

function createTestStrategyClock(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];
  const radius = 90;

  const sections = [
    { label: 'Easy 20%', pct: 20, color: '#22c55e' },
    { label: 'Medium 50%', pct: 50, color: '#eab308' },
    { label: 'Hard 20%', pct: 20, color: '#f97316' },
    { label: 'Review 10%', pct: 10, color: '#3b82f6' },
  ];

  let startAngle = -90;
  sections.forEach((sec, i) => {
    const sweepAngle = (sec.pct / 100) * 360;
    const endAngle = startAngle + sweepAngle;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = sweepAngle > 180 ? 1 : 0;

    const pathStr = `M ${x} ${y} L ${x + radius * Math.cos(startRad)} ${y + radius * Math.sin(startRad)} A ${radius} ${radius} 0 ${largeArc} 1 ${x + radius * Math.cos(endRad)} ${y + radius * Math.sin(endRad)} Z`;
    const slice = new Path(pathStr, {
      fill: sec.color + '40', stroke: '#ffffff', strokeWidth: 2,
      name: `manipulative-test-strategy-slice-${i}`,
    } as any);
    objects.push(slice);

    // Label
    const midAngle = ((startAngle + sweepAngle / 2) * Math.PI) / 180;
    const labelR = radius * 0.6;
    const lbl = new IText(sec.label, {
      left: x + labelR * Math.cos(midAngle),
      top: y + labelR * Math.sin(midAngle),
      fontSize: 11, fontFamily: 'Inter', fill: '#374151',
      originX: 'center', originY: 'center', fontWeight: 'bold',
      name: `manipulative-test-strategy-label-${i}`,
    } as any);
    objects.push(lbl);

    startAngle = endAngle;
  });

  // Title
  const title = new IText('Time Management', {
    left: x, top: y + radius + 14,
    fontSize: 14, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-test-strategy-title',
  } as any);
  objects.push(title);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-test-strategy-clock-${Date.now()}`;
  return [group];
}

// ============================================================
// Elimination Board
// ============================================================

function createEliminationBoard(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];

  const choices = [
    { label: 'A', text: 'First option here', color: '#3b82f6' },
    { label: 'B', text: 'Second option here', color: '#22c55e' },
    { label: 'C', text: 'Third option here', color: '#f97316' },
    { label: 'D', text: 'Fourth option here', color: '#8b5cf6' },
  ];

  const cardW = 180;
  const cardH = 50;
  const gap = 12;
  const totalH = choices.length * cardH + (choices.length - 1) * gap;
  const startY = y - totalH / 2;

  choices.forEach((choice, i) => {
    const cy = startY + i * (cardH + gap);

    // Card background
    const card = new Rect({
      left: x - cardW / 2, top: cy, width: cardW, height: cardH,
      fill: '#ffffff', stroke: choice.color, strokeWidth: 2, rx: 8,
      name: `manipulative-elimination-card-${i}`,
    } as any);
    objects.push(card);

    // Letter badge
    const badge = new Circle({
      left: x - cardW / 2 + 20, top: cy + cardH / 2,
      radius: 14, fill: choice.color,
      originX: 'center', originY: 'center',
      name: `manipulative-elimination-badge-${i}`,
    } as any);
    objects.push(badge);

    const badgeText = new IText(choice.label, {
      left: x - cardW / 2 + 20, top: cy + cardH / 2,
      fontSize: 14, fontFamily: 'Inter', fill: '#ffffff',
      originX: 'center', originY: 'center', fontWeight: 'bold',
      name: `manipulative-elimination-badge-text-${i}`,
    } as any);
    objects.push(badgeText);

    // Choice text
    const text = new IText(choice.text, {
      left: x - cardW / 2 + 44, top: cy + cardH / 2,
      fontSize: 13, fontFamily: 'Inter', fill: '#374151',
      originY: 'center',
      name: `manipulative-elimination-text-${i}`,
    } as any);
    objects.push(text);

    // X mark (for crossing out)
    const xLine1 = new Line(
      [x + cardW / 2 - 20, cy + 10, x + cardW / 2 - 8, cy + cardH - 10],
      { stroke: '#ef4444', strokeWidth: 2, opacity: 0.4,
        name: `manipulative-elimination-x1-${i}`,
      } as any
    );
    const xLine2 = new Line(
      [x + cardW / 2 - 8, cy + 10, x + cardW / 2 - 20, cy + cardH - 10],
      { stroke: '#ef4444', strokeWidth: 2, opacity: 0.4,
        name: `manipulative-elimination-x2-${i}`,
      } as any
    );
    objects.push(xLine1, xLine2);
  });

  // Title
  const title = new IText('Process of Elimination', {
    left: x, top: startY - 22,
    fontSize: 14, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-elimination-title',
  } as any);
  objects.push(title);

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-elimination-board-${Date.now()}`;
  return [group];
}

// ---- MUSIC (2 new) ----

// ============================================================
// Treble Clef Staff
// ============================================================

function createTrebleClefStaff(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];
  const staffWidth = 300;
  const lineSpacing = 10;
  const staffHeight = lineSpacing * 4;
  const ox = x - staffWidth / 2;
  const oy = y - staffHeight / 2;

  // Five staff lines
  for (let i = 0; i < 5; i++) {
    const line = new Line([ox, oy + i * lineSpacing, ox + staffWidth, oy + i * lineSpacing], {
      stroke: '#374151', strokeWidth: 1.5,
      name: `manipulative-treble-clef-line-${i}`,
    } as any);
    objects.push(line);
  }

  // Treble clef symbol (using text as SVG path approximation)
  const clef = new IText('𝄞', {
    left: ox + 10, top: oy - 10,
    fontSize: 56, fontFamily: 'serif', fill: '#374151',
    name: 'manipulative-treble-clef-symbol',
  } as any);
  objects.push(clef);

  // Note labels on spaces and lines
  const noteLabels = [
    { name: 'E4', pos: 0, type: 'line' },
    { name: 'F4', pos: 1, type: 'space' },
    { name: 'G4', pos: 2, type: 'line' },
    { name: 'A4', pos: 3, type: 'space' },
    { name: 'B4', pos: 4, type: 'line' },
    { name: 'C5', pos: 5, type: 'space' },
    { name: 'D5', pos: 6, type: 'line' },
    { name: 'E5', pos: 7, type: 'space' },
    { name: 'F5', pos: 8, type: 'line' },
  ];

  noteLabels.forEach((note, i) => {
    const nx = ox + 70 + i * 24;
    const ny = oy + (8 - note.pos) * (lineSpacing / 2);

    // Note head (filled circle)
    const noteHead = new Ellipse({
      left: nx, top: ny, rx: 7, ry: 5,
      fill: '#374151', stroke: '#374151', strokeWidth: 1,
      originX: 'center', originY: 'center', angle: -15,
      name: `manipulative-treble-clef-note-${i}`,
    } as any);
    objects.push(noteHead);

    // Stem
    const stem = new Line([nx + 6, ny, nx + 6, ny - 30], {
      stroke: '#374151', strokeWidth: 1.5,
      name: `manipulative-treble-clef-stem-${i}`,
    } as any);
    objects.push(stem);

    // Label below
    const label = new IText(note.name, {
      left: nx, top: oy + staffHeight + 8,
      fontSize: 9, fontFamily: 'Inter', fill: '#6b7280',
      originX: 'center',
      name: `manipulative-treble-clef-note-label-${i}`,
    } as any);
    objects.push(label);
  });

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-treble-clef-staff-${Date.now()}`;
  return [group];
}

// ============================================================
// Rhythm Grid
// ============================================================

function createRhythmGrid(params: Record<string, any>): FabricObject[] {
  const { x = 0, y = 0 } = params;
  const objects: FabricObject[] = [];

  const rows = [
    { label: 'Whole', beats: 4, symbol: '𝅝', color: '#ef4444' },
    { label: 'Half', beats: 2, symbol: '𝅗𝅥', color: '#f97316' },
    { label: 'Quarter', beats: 1, symbol: '♩', color: '#22c55e' },
    { label: 'Eighth', beats: 0.5, symbol: '♪', color: '#3b82f6' },
  ];

  const cellW = 30;
  const cellH = 32;
  const labelW = 60;
  const gridW = 4 * cellW;
  const totalW = labelW + gridW;
  const totalH = rows.length * cellH + 40;
  const ox = x - totalW / 2;
  const oy = y - totalH / 2;

  // Background
  const bg = new Rect({
    left: ox - 8, top: oy - 8, width: totalW + 16, height: totalH + 16,
    fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1, rx: 6,
    name: 'manipulative-rhythm-grid-bg',
  } as any);
  objects.push(bg);

  // Title
  const title = new IText('Rhythm Values', {
    left: x, top: oy - 4,
    fontSize: 13, fontFamily: 'Inter', fill: '#374151',
    originX: 'center', fontWeight: 'bold',
    name: 'manipulative-rhythm-grid-title',
  } as any);
  objects.push(title);

  // Header: beat numbers
  for (let b = 1; b <= 4; b++) {
    const lbl = new IText(String(b), {
      left: ox + labelW + (b - 0.5) * cellW, top: oy + 18,
      fontSize: 11, fontFamily: 'Inter', fill: '#6b7280',
      originX: 'center',
      name: `manipulative-rhythm-grid-beat-${b}`,
    } as any);
    objects.push(lbl);
  }

  // Rows
  rows.forEach((row, i) => {
    const ry = oy + 30 + i * cellH;

    // Row label
    const lbl = new IText(row.label, {
      left: ox + labelW / 2, top: ry + cellH / 2,
      fontSize: 11, fontFamily: 'Inter', fill: row.color,
      originX: 'center', originY: 'center', fontWeight: 'bold',
      name: `manipulative-rhythm-grid-row-label-${i}`,
    } as any);
    objects.push(lbl);

    // Beat cells
    const cellsToFill = Math.round(4 / row.beats);
    for (let b = 0; b < 4; b++) {
      const cx = ox + labelW + b * cellW;
      const isFilled = b < cellsToFill;
      const cell = new Rect({
        left: cx, top: ry, width: cellW, height: cellH,
        fill: isFilled ? row.color + '25' : '#f9fafb',
        stroke: '#d1d5db', strokeWidth: 1,
        name: `manipulative-rhythm-grid-cell-${i}-${b}`,
      } as any);
      objects.push(cell);

      if (isFilled) {
        const note = new IText(row.symbol, {
          left: cx + cellW / 2, top: ry + cellH / 2,
          fontSize: 16, fontFamily: 'serif', fill: row.color,
          originX: 'center', originY: 'center',
          name: `manipulative-rhythm-grid-note-${i}-${b}`,
        } as any);
        objects.push(note);
      }
    }
  });

  const group = new Group(objects, { selectable: true, evented: true } as any);
  (group as any).name = `manipulative-rhythm-grid-${Date.now()}`;
  return [group];
}

// ============================================================
// Helper: Generate regular polygon points
// ============================================================

function generateRegularPolygonPoints(
  cx: number,
  cy: number,
  r: number,
  sides: number,
  startAngle: number
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + (2 * Math.PI * i) / sides;
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  return points;
}