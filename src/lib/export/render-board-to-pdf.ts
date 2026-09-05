// ============================================================
// render-board-to-pdf.ts — Server-side board → PDF conversion
// ============================================================
// Takes a board (Room + its BoardPage snapshots) and produces a
// multi-page PDF buffer. Each BoardPage becomes one PDF page.
//
// Pipeline:
//   BoardPage.snapshot (JSON) → extract elements + camera
//   → buildExportSvg (pure string concatenation, server-safe)
//   → sharp: SVG string → PNG buffer (rasterized at 2x for quality)
//   → pdf-lib: each PNG embedded as a page
//   → return PDF buffer
//
// Notes:
//   • We render at 2x scale (1240×1754 for A4-ish at 72dpi) so text
//     stays crisp. Could go higher but file size grows fast.
//   • We compute per-page bounds from the actual elements (not a
//     fixed viewport) so the PDF fits the content, not the screen.
//   • Sharp handles SVG → PNG. pdf-lib handles PNG → PDF page.
// ============================================================

import sharp from 'sharp'
import { PDFDocument, rgb } from 'pdf-lib'
import { buildExportSvg } from '@/lib/whiteboard/export'
import { getElementBounds } from '@/lib/whiteboard/utils'
import type { WhiteboardElement } from '@/lib/whiteboard/types'

interface PageSnapshot {
  elements?: WhiteboardElement[]
  camera?: { x: number; y: number; zoom: number }
}

interface BoardPageRow {
  pageIndex: number
  snapshot: unknown
}

interface RenderResult {
  pdfBuffer: Buffer
  pageCount: number
}

// Page dimensions — A4 landscape at 72dpi (good for whiteboards)
const PAGE_WIDTH = 1240
const PAGE_HEIGHT = 877  // A4 landscape aspect ratio
const SCALE = 2  // render at 2x for crisp text

/**
 * Render a single page's snapshot to a PNG buffer.
 * Computes the bounding box of all elements so the SVG fits the
 * content (not a fixed viewport). Falls back to a default viewport
 * if the page is empty.
 */
async function renderPageToPng(snapshot: unknown): Promise<Buffer> {
  const snap = snapshot as PageSnapshot
  const elements = (snap?.elements && Array.isArray(snap.elements) ? snap.elements : []) as WhiteboardElement[]

  // Compute content bounds — fall back to a default viewport
  let width = PAGE_WIDTH
  let height = PAGE_HEIGHT
  let offsetX = 0
  let offsetY = 0

  if (elements.length > 0) {
    const bounds = getCombinedBounds(elements)
    if (bounds) {
      // Add padding around the content
      const padding = 40
      width = Math.max(PAGE_WIDTH, Math.ceil(bounds.width + padding * 2))
      height = Math.max(PAGE_HEIGHT, Math.ceil(bounds.height + padding * 2))
      offsetX = -bounds.x + padding
      offsetY = -bounds.y + padding
    }
  }

  // Build SVG — we synthesize a camera that frames the content
  const camera = { x: offsetX, y: offsetY, zoom: 1 }
  const svgString = buildExportSvg(elements, width, height, false, camera, SCALE)

  // Add white background to the SVG (sharp rasterizes transparent as black otherwise)
  const svgWithBg = svgString.replace(
    '<svg ',
    `<svg style="background:#ffffff" `
  )

  // Rasterize: SVG → PNG via sharp
  const pngBuffer = await sharp(Buffer.from(svgWithBg))
    .resize(width * SCALE, height * SCALE, { fit: 'fill' })
    .png()
    .toBuffer()

  return pngBuffer
}

/**
 * Get the combined bounding box of all elements.
 * Returns null if no elements have meaningful bounds.
 */
function getCombinedBounds(elements: WhiteboardElement[]): { x: number; y: number; width: number; height: number } | null {
  if (elements.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const el of elements) {
    try {
      const b = getElementBounds(el)
      if (b && isFinite(b.x) && isFinite(b.y) && isFinite(b.width) && isFinite(b.height)) {
        minX = Math.min(minX, b.x)
        minY = Math.min(minY, b.y)
        maxX = Math.max(maxX, b.x + b.width)
        maxY = Math.max(maxY, b.y + b.height)
      }
    } catch {
      // Some element types might not have bounds — skip them
    }
  }

  if (minX === Infinity || minY === Infinity) return null

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Render all pages of a board into a single multi-page PDF.
 */
export async function renderBoardToPdf(pages: BoardPageRow[]): Promise<RenderResult> {
  if (pages.length === 0) {
    // No pages — return a minimal valid PDF with one blank page
    const pdfDoc = await PDFDocument.create()
    pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    const pdfBytes = await pdfDoc.save()
    return { pdfBuffer: Buffer.from(pdfBytes), pageCount: 1 }
  }

  const pdfDoc = await PDFDocument.create()

  for (const page of pages) {
    try {
      const pngBuffer = await renderPageToPng(page.snapshot)
      const pngImage = await pdfDoc.embedPng(pngBuffer)

      // PDF page sized to match the PNG aspect ratio
      const pdfPage = pdfDoc.addPage([pngImage.width, pngImage.height])
      pdfPage.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pngImage.width,
        height: pngImage.height,
      })
    } catch (e) {
      // If a single page fails, add a blank page so the PDF still works
      console.error(`[renderBoardToPdf] Page ${page.pageIndex} failed:`, e instanceof Error ? e.message : e)
      const blankPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      blankPage.drawRectangle({
        x: 0, y: 0,
        width: PAGE_WIDTH, height: PAGE_HEIGHT,
        color: rgb(0.97, 0.98, 0.99),
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  return { pdfBuffer: Buffer.from(pdfBytes), pageCount: pages.length }
}
