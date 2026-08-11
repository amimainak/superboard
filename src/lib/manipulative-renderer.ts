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
    const square = new Line(
      [x + squareSize, y, x + squareSize, y - squareSize, x, y - squareSize],
      {
        stroke: '#059669',
        strokeWidth: 1.5,
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