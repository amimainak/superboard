// ============================================================
// Superboard — Export Utilities
// Export whiteboard as PNG, SVG, JSON
// ============================================================

import type { WhiteboardElement, Camera } from '@/lib/whiteboard/types'
import { getElementBounds, diamondPath, trianglePath, arrowHeadPath, getFreehandPath } from './utils'
import type { Point } from './types'

/** Sanitize text for safe SVG embedding */
function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Export the whiteboard SVG content as a PNG image.
 */
export async function exportAsPng(
  elements: WhiteboardElement[],
  camera: Camera,
  containerWidth: number,
  containerHeight: number,
  isDark: boolean
): Promise<Blob> {
  const svgString = buildExportSvg(elements, containerWidth, containerHeight, isDark, camera, 2)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })

  const canvas = document.createElement('canvas')
  canvas.width = containerWidth * 2
  canvas.height = containerHeight * 2
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(url)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create PNG'))
    }, 'image/png')
  })
}

/**
 * Export the whiteboard SVG content as a JPEG image.
 */
export async function exportAsJpg(
  elements: WhiteboardElement[],
  camera: Camera,
  containerWidth: number,
  containerHeight: number,
  isDark: boolean
): Promise<Blob> {
  const svgString = buildExportSvg(elements, containerWidth, containerHeight, isDark, camera, 2)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })

  const canvas = document.createElement('canvas')
  canvas.width = containerWidth * 2
  canvas.height = containerHeight * 2
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = isDark ? '#0f172a' : '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(url)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create JPEG'))
    }, 'image/jpeg', 0.92)
  })
}

/**
 * Export the whiteboard as SVG string.
 */
export function exportAsSvg(
  elements: WhiteboardElement[],
  containerWidth: number,
  containerHeight: number,
  isDark: boolean,
  camera?: Camera
): string {
  return buildExportSvg(elements, containerWidth, containerHeight, isDark, camera || { x: 0, y: 0, zoom: 1 }, 1)
}

/**
 * Export the whiteboard elements as JSON.
 */
export function exportAsJson(elements: WhiteboardElement[]): string {
  return JSON.stringify({ version: '1.0', elements }, null, 2)
}

/**
 * Build SVG string for export — supports ALL element types.
 */
function buildExportSvg(
  elements: WhiteboardElement[],
  width: number,
  height: number,
  isDark: boolean,
  camera: Camera,
  scale: number
): string {
  const bgColor = isDark ? '#0f172a' : '#f8fafc'

  let shapesSvg = ''
  for (const el of elements) {
    const common = `
      opacity="${el.opacity}"
      stroke="${el.strokeColor}"
      fill="${el.fillColor || 'none'}"
      stroke-width="${el.strokeWidth}"
      ${el.dash?.length ? `stroke-dasharray="${el.dash.join(' ')}"` : ''}
    `

    switch (el.type) {
      case 'rectangle':
        shapesSvg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="2" ${common} />\n`
        break

      case 'ellipse':
        shapesSvg += `<ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" ${common} />\n`
        break

      case 'diamond': {
        const d = diamondPath(el.x, el.y, el.width, el.height)
        shapesSvg += `<path d="${d}" ${common} />\n`
        break
      }

      case 'triangle': {
        const d = trianglePath(el.x, el.y, el.width, el.height)
        shapesSvg += `<path d="${d}" ${common} />\n`
        break
      }

      case 'line': {
        const lineEl = el as { x2: number; y2: number }
        shapesSvg += `<line x1="${el.x}" y1="${el.y}" x2="${lineEl.x2}" y2="${lineEl.y2}" stroke-linecap="round" ${common} />\n`
        break
      }

      case 'arrow': {
        const arrowEl = el as { x2: number; y2: number }
        const headD = arrowHeadPath(
          { x: el.x, y: el.y },
          { x: arrowEl.x2, y: arrowEl.y2 },
          10 + el.strokeWidth
        )
        shapesSvg += `<line x1="${el.x}" y1="${el.y}" x2="${arrowEl.x2}" y2="${arrowEl.y2}" stroke-linecap="round" ${common} />\n`
        shapesSvg += `<path d="${headD}" fill="${el.strokeColor}" opacity="${el.opacity}" />\n`
        break
      }

      case 'freehand': {
        const fhEl = el as { points: Point[]; isHighlighter?: boolean }
        if (fhEl.points.length >= 2) {
          const pts = fhEl.points.map(p => ({ ...p, pressure: 0.5 }))
          const pathD = fhEl.isHighlighter
            ? getFreehandPath(pts, { size: 16, thinning: 0, smoothing: 0.5, streamline: 0.5, start: { cap: true } as const, end: { cap: true } as const })
            : getFreehandPath(pts, { size: el.strokeWidth * 2, thinning: 0, smoothing: 0.5, streamline: 0.5, start: { cap: true } as const, end: { cap: true } as const })
          if (pathD) {
            if (fhEl.isHighlighter) {
              const r = parseInt(el.strokeColor.slice(1, 3), 16)
              const g = parseInt(el.strokeColor.slice(3, 5), 16)
              const b = parseInt(el.strokeColor.slice(5, 7), 16)
              shapesSvg += `<path d="${pathD}" fill="rgba(${r},${g},${b},0.4)" stroke="none" opacity="1" />\n`
            } else {
              shapesSvg += `<path d="${pathD}" fill="${el.strokeColor}" stroke="none" ${common} />\n`
            }
          }
        }
        break
      }

      case 'text': {
        const tEl = el as { text: string; fontSize: number; textAlign: string }
        shapesSvg += `<foreignObject x="${el.x}" y="${el.y}" width="${el.width || 300}" height="${el.height || 100}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${tEl.fontSize}px;color:${el.strokeColor};font-family:inherit;line-height:1.4;white-space:pre-wrap;text-align:${tEl.textAlign || 'left'}">${sanitizeText(tEl.text).replace(/\n/g, '<br />')}</div>
        </foreignObject>\n`
        break
      }

      case 'image': {
        const imgEl = el as { src: string }
        shapesSvg += `<foreignObject x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}">
          <img xmlns="http://www.w3.org/1999/xhtml" src="${imgEl.src}" style="width:100%;height:100%;object-fit:contain" />
        </foreignObject>\n`
        break
      }

      case 'sticky': {
        const sEl = el as { text: string; fontSize: number; noteColor: string }
        shapesSvg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="4" fill="${sEl.noteColor}" stroke="rgba(0,0,0,0.12)" stroke-width="1" />\n`
        shapesSvg += `<foreignObject x="${el.x + 12}" y="${el.y + 12}" width="${el.width - 24}" height="${el.height - 24}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${sEl.fontSize}px;color:#1e293b;font-family:inherit;line-height:1.4;white-space:pre-wrap">${sanitizeText(sEl.text).replace(/\n/g, '<br />')}</div>
        </foreignObject>\n`
        break
      }

      case 'frame': {
        const fEl = el as { name: string }
        shapesSvg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="8" fill="none" ${common} />\n`
        shapesSvg += `<text x="${el.x + 8}" y="${el.y - 6}" font-size="12" fill="${el.strokeColor}" opacity="0.6">${fEl.name || 'Frame'}</text>\n`
        break
      }

      case 'laser':
        // Lasers are ephemeral — skip in export
        break

      default: {
        // Fallback for math elements and any other types: render as labeled bounding box
        const bounds = getElementBounds(el)
        if (bounds.width > 0 && bounds.height > 0) {
          shapesSvg += `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" rx="4" fill="${el.fillColor || 'none'}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" opacity="${el.opacity}" stroke-dasharray="4,4" />\n`
          const typeLabel = el.type.replace('math-', '').replace(/-/g, ' ')
          shapesSvg += `<text x="${bounds.x + bounds.width / 2}" y="${bounds.y + bounds.height / 2}" font-size="11" fill="${el.strokeColor}" opacity="0.5" text-anchor="middle" dominant-baseline="middle">[${typeLabel}]</text>\n`
        }
        break
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}" />
  <g transform="translate(${camera.x * scale}, ${camera.y * scale}) scale(${camera.zoom * scale})">
    ${shapesSvg}
  </g>
</svg>`
}

/**
 * Trigger a file download from a Blob.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Trigger a file download from a string.
 */
export function downloadString(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  downloadBlob(blob, filename)
}

/**
 * Export the whiteboard as PDF via the browser's built-in print dialog.
 * The user can select "Save as PDF" as the destination.
 * This is the most reliable cross-browser approach without adding heavy dependencies.
 */
export function exportAsPdfViaPrint() {
  window.print()
}
