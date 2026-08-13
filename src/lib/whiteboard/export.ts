// ============================================================
// Superboard — Export Utilities
// Export whiteboard as PNG, SVG, JSON
// ============================================================

import type { WhiteboardElement, Camera } from '@/lib/whiteboard/types'
import { getElementBounds } from './utils'

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
  const svgString = buildExportSvg(elements, containerWidth, containerHeight, isDark, 2)
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

  if (isDark) {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

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
  const svgString = buildExportSvg(elements, containerWidth, containerHeight, isDark, 2)
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
  isDark: boolean
): string {
  return buildExportSvg(elements, containerWidth, containerHeight, isDark, 1)
}

/**
 * Export the whiteboard elements as JSON.
 */
export function exportAsJson(elements: WhiteboardElement[]): string {
  return JSON.stringify({ version: '1.0', elements }, null, 2)
}

/**
 * Build SVG string for export.
 */
function buildExportSvg(
  elements: WhiteboardElement[],
  width: number,
  height: number,
  isDark: boolean,
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
      case 'line':
        shapesSvg += `<line x1="${el.x}" y1="${el.y}" x2="${(el as { x2: number }).x2}" y2="${(el as { y2: number }).y2}" stroke-linecap="round" ${common} />\n`
        break
      case 'text':
        shapesSvg += `<foreignObject x="${el.x}" y="${el.y}" width="${el.width || 300}" height="${el.height || 100}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${(el as { fontSize: number }).fontSize}px;color:${el.strokeColor};font-family:inherit;line-height:1.4;white-space:pre-wrap">${(el as { text: string }).text}</div>
        </foreignObject>\n`
        break
      case 'image':
        shapesSvg += `<foreignObject x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}">
          <img xmlns="http://www.w3.org/1999/xhtml" src="${(el as { src: string }).src}" style="width:100%;height:100%;object-fit:contain" />
        </foreignObject>\n`
        break
      case 'sticky':
        shapesSvg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="4" fill="${(el as { noteColor: string }).noteColor}" stroke="#00000020" stroke-width="1" />\n`
        shapesSvg += `<foreignObject x="${el.x + 12}" y="${el.y + 12}" width="${el.width - 24}" height="${el.height - 24}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${(el as { fontSize: number }).fontSize}px;color:#1e293b;font-family:inherit;line-height:1.4;white-space:pre-wrap">${(el as { text: string }).text}</div>
        </foreignObject>\n`
        break
      // Skip complex elements (freehand, arrow, diamond, triangle, frame, laser) in basic export
      default:
        // Try basic rect representation
        if (el.width > 0 && el.height > 0) {
          shapesSvg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" ${common} />\n`
        }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}" />
  <g transform="scale(${scale})">
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
