// ============================================================
// Canvas-to-Notes — Extract lesson notes from Fabric.js canvas
// ============================================================
// Iterates canvas objects and extracts structured lesson notes:
// - Text objects (IText) → notes with text content
// - Group objects with text → labeled diagrams
// - All objects with position/timestamp metadata
// ============================================================

import type { FabricObject } from 'fabric';
import type { Canvas as FabricCanvasType } from 'fabric';

export interface LessonNote {
  id: string;
  type: 'text' | 'diagram' | 'calculation';
  content: string;
  timestamp: Date;
  pageNumber: number;
}

/**
 * Generate lesson notes by iterating all canvas objects.
 * Groups containing text objects are classified as 'diagram'.
 * IText with numeric-heavy content is classified as 'calculation'.
 */
export function generateLessonNotes(
  canvas: FabricCanvasType,
  pageNumber: number = 0
): LessonNote[] {
  const objects = canvas.getObjects();
  const notes: LessonNote[] = [];

  for (const obj of objects) {
    // Skip internal temp objects
    const name = (obj as Record<string, unknown>).name as string | undefined;
    if (name?.startsWith('__')) continue;

    // IText / Textbox — direct text content
    if (isTextObject(obj)) {
      const text = (obj as any).text?.trim();
      if (!text || text === 'Type here') continue;

      const noteType = isCalculation(text) ? 'calculation' : 'text';
      const now = new Date();
      notes.push({
        id: `note-${notes.length + 1}-${Date.now()}`,
        type: noteType,
        content: text,
        timestamp: now,
        pageNumber,
      });
      continue;
    }

    // Group — check for text children (labeled diagrams)
    if (isGroupObject(obj)) {
      const group = obj as any;
      const textContents: string[] = [];
      for (const child of group.getObjects()) {
        if (isTextObject(child as FabricObject)) {
          const t = (child as any).text?.trim();
          if (t && t !== 'Type here') textContents.push(t);
        }
      }
      if (textContents.length > 0) {
        notes.push({
          id: `note-${notes.length + 1}-${Date.now()}`,
          type: 'diagram',
          content: `Diagram: ${textContents.join('; ')}`,
          timestamp: new Date(),
          pageNumber,
        });
      }
    }
  }

  return notes;
}

// ---- Helpers ----

function isTextObject(obj: FabricObject): boolean {
  return (obj as any).type === 'i-text' || (obj as any).type === 'textbox' || (obj as any).type === 'text';
}

function isGroupObject(obj: FabricObject): boolean {
  return (obj as any).type === 'group' && typeof (obj as any).getObjects === 'function';
}

/** Heuristic: content with >50% numeric/operation chars → calculation */
function isCalculation(text: string): boolean {
  const opChars = text.replace(/[^0-9+\-*/=().^,\s]/g, '');
  return opChars.length / Math.max(text.length, 1) > 0.5;
}
