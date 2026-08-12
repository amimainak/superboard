// ============================================================
// API Route: Generate Manipulative Spec from Description
// ============================================================
// POST /api/manipulative/generate
// Takes a natural-language description + subject,
// uses Claude to produce a ManipulativeSpec JSON.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { callTextAI } from '@/lib/ai';
import type { AIAction } from '@/types';

const MANIPULATIVE_SYSTEM_PROMPT = `You are a K-12 math manipulative specification generator. Given a description and subject, output ONLY a valid JSON object with this shape:

{
  "type": "<one of: fraction-bar, number-line, base-ten-blocks, coordinate-grid, angle-protractor, geometry-shape, place-value-chart, clock, bar-chart, fraction-decimal-grid, geometry-compass, protractor-tool, quadratic-graph, unit-circle, slope-triangle, box-plot, stem-leaf-plot, solar-system, rock-cycle, water-cycle, food-chain, human-heart>",
  "params": { <type-specific parameters> }
}

Supported types and their params:
- fraction-bar: { numerator, denominator, width?, height? }
- number-line: { min, max, step, labelInterval?, showTicks? }
- base-ten-blocks: { number, showLabels? }
- coordinate-grid: { xMin, xMax, yMin, yMax, step? }
- angle-protractor: { angle, showArc?, label? }
- geometry-shape: { shape: "triangle"|"square"|"pentagon"|"hexagon"|"parallelogram"|"trapezoid", sideLength?, showLabels?, showAngles? }
- place-value-chart: { columns: ["ones","tens","hundreds"], value? }
- clock: { hour, minute, showLabels? }
- bar-chart: { labels: [], values: [], title? }
- quadratic-graph: { a, b, c, xMin?, xMax? }
- unit-circle: { showAngles?, showCoordinates?, highlightedAngles? }
- slope-triangle: { x1, y1, x2, y2, showRiseRun? }
- box-plot: { min, q1, median, q3, max, label? }
- stem-leaf-plot: { data: [], label? }
- solar-system: { showLabels? }
- rock-cycle: { showLabels? }
- water-cycle: { showLabels? }
- food-chain: { organisms: ["plant","rabbit","fox"], label? }
- human-heart: { showLabels? }

IMPORTANT: Return ONLY the JSON object, no markdown fences, no explanation.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, subject } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (description.length > 500) {
      return NextResponse.json({ error: 'Description too long (max 500 chars)' }, { status: 400 });
    }

    const prompt = `Subject: ${subject || 'MATH'}\n\nDescription: ${description}`;

    const result = await callTextAI({
      action: 'QUIZ' as AIAction,
      prompt,
      systemPrompt: MANIPULATIVE_SYSTEM_PROMPT,
      maxTokens: 1024,
      temperature: 0.1,
    });

    // Parse the JSON from Claude's response (may have whitespace)
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const spec = JSON.parse(cleaned);

    return NextResponse.json({ success: true, spec });
  } catch (error) {
    console.error('[Manipulative Generate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate manipulative' },
      { status: 500 }
    );
  }
}
