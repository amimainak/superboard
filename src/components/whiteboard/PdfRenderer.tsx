// ============================================================
// Superboard — PDF Renderer
// Renders a PDF page (already converted to image) as background
// ============================================================

'use client'

import React from 'react'
import type { PdfBackgroundElement } from '@/lib/whiteboard/types'

interface PdfRendererProps {
  element: PdfBackgroundElement
  cameraZoom: number
}

/**
 * Renders a PDF background element. The PDF page has already been
 * rasterized to a data URL image during upload, so we just display
 * that image — identical to how ImageElement works but tagged as 'pdf'
 * so the whiteboard knows it's a PDF background.
 */
export function PdfRenderer({ element }: PdfRendererProps) {
  return (
    <foreignObject
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      opacity={element.opacity}
      style={{ pointerEvents: element.locked ? 'none' : 'auto' }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        <img
          src={element.pdfDataUrl}
          alt={`PDF page ${element.pageNumber}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            userSelect: 'none',
            display: 'block',
          }}
          draggable={false}
        />
      </div>
    </foreignObject>
  )
}
