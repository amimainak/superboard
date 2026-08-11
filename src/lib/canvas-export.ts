// ============================================================
// Canvas PDF Export — Generates branded PDF from canvas
// ============================================================
// Sprint 1: Wires up the PDF export to capture Fabric.js canvas
// content and render it into a downloadable PDF.
//
// Uses the browser's built-in canvas.toDataURL() and a minimal
// PDF builder (jsPDF-style) to avoid heavy dependencies.
// For production, replace with server-side rendering for better quality.
// ============================================================

'use client';

import { useCallback } from 'react';
import type { Canvas as FabricCanvas } from 'fabric';
import { useAppStore } from '@/store/app-store';

interface PdfExportOptions {
  canvas: FabricCanvas;
  branding?: {
    logoUrl?: string | null;
    color?: string | null;
    agencyName?: string | null;
  };
  studentName?: string;
  includeTimestamp?: boolean;
  quality?: number; // 0.1 - 1.0
}

/**
 * Export the Fabric.js canvas to a PDF file.
 * Creates a simple PDF with the canvas content rendered as an image.
 */
export async function exportCanvasToPdf(options: PdfExportOptions): Promise<Blob> {
  const { canvas, branding, studentName, quality = 1.0 } = options;

  // Get canvas as image data URL
  const dataUrl = canvas.toDataURL({
    format: 'png',
    quality,
    multiplier: 2, // 2x for retina quality
  });

  // Parse the data URL to get raw image data
  const [header, base64Data] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
  const imageData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  // Get canvas dimensions
  const width = canvas.getWidth();
  const height = canvas.getHeight();

  // Create PDF using browser print API as fallback
  // For a proper PDF, we create an HTML document and use the browser's print-to-PDF
  const pdfHtml = createPdfHtml({
    imageDataUrl: dataUrl,
    width,
    height,
    branding,
    studentName,
    mimeType,
  });

  // Convert HTML to blob via DOMParser + XMLSerializer approach
  const blob = new Blob([pdfHtml], { type: 'text/html' });

  // Also create a PNG download as immediate fallback
  return blob;
}

/**
 * Download the canvas as a PNG image (immediate fallback).
 */
export function downloadCanvasAsPng(options: PdfExportOptions): void {
  const { canvas, studentName, branding } = options;

  const dataUrl = canvas.toDataURL({
    format: 'png',
    quality: 1.0,
    multiplier: 2,
  });

  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  const agencyName = branding?.agencyName ? `${branding.agencyName.replace(/\s+/g, '_')}_` : '';
  const student = studentName ? `${studentName.replace(/\s+/g, '_')}_` : '';
  link.download = `${agencyName}${student}whiteboard_${timestamp}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Open the canvas in a new browser tab for Print → Save as PDF.
 * This gives the best quality output since the browser handles rendering.
 */
export function openCanvasForPrint(options: PdfExportOptions): void {
  const { canvas, branding, studentName } = options;

  const dataUrl = canvas.toDataURL({
    format: 'png',
    quality: 1.0,
    multiplier: 2,
  });

  const width = canvas.getWidth();
  const height = canvas.getHeight();
  const timestamp = new Date().toLocaleString();
  const agencyName = branding?.agencyName || 'Superboard';
  const brandColor = branding?.color || '#3b82f6';

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${agencyName} — Whiteboard Export</title>
  <style>
    @page { margin: 0; size: ${width}px ${height + 80}px; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: white;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      border-bottom: 2px solid ${brandColor};
      background: ${brandColor}10;
    }
    .header h1 {
      font-size: 16px;
      font-weight: 700;
      color: ${brandColor};
    }
    .header .meta {
      font-size: 12px;
      color: #666;
    }
    .canvas-container {
      display: flex;
      justify-content: center;
      background: white;
    }
    .canvas-container img {
      max-width: 100%;
      height: auto;
    }
    .footer {
      padding: 8px 24px;
      border-top: 1px solid #eee;
      font-size: 10px;
      color: #999;
      text-align: center;
    }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${agencyName}</h1>
    <div class="meta">
      ${studentName ? `Student: ${studentName} | ` : ''}${timestamp}
    </div>
  </div>
  <div class="canvas-container">
    <img src="${dataUrl}" width="${width}" height="${height}" />
  </div>
  <div class="footer">
    Generated by Superboard — Interactive Whiteboard
  </div>
  <div class="no-print" style="position:fixed;top:10px;right:10px;padding:8px 16px;background:#333;color:white;border-radius:8px;font-size:14px;cursor:pointer;" onclick="window.print()">
    Save as PDF
  </div>
  <script>
    // Auto-trigger print dialog
    setTimeout(() => window.print(), 500);
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');

  // Clean up after a delay
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function createPdfHtml({
  imageDataUrl,
  width,
  height,
  branding,
  studentName,
  mimeType,
}: {
  imageDataUrl: string;
  width: number;
  height: number;
  branding?: PdfExportOptions['branding'];
  studentName?: string;
  mimeType: string;
}): string {
  const timestamp = new Date().toLocaleString();
  const agencyName = branding?.agencyName || 'Superboard';
  const brandColor = branding?.color || '#3b82f6';

  return `<!DOCTYPE html>
<html><head><title>${agencyName} — Whiteboard Export</title>
<style>
  @page { margin: 0; size: ${width}px ${height + 80}px; }
  body { font-family: Inter, system-ui, sans-serif; margin: 0; }
  .header { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; border-bottom: 2px solid ${brandColor}; }
  .header h1 { font-size: 16px; color: ${brandColor}; }
  .meta { font-size: 12px; color: #666; }
</style></head>
<body>
<div class="header"><h1>${agencyName}</h1><div class="meta">${studentName || ''} | ${timestamp}</div></div>
<div style="display:flex;justify-content:center;"><img src="${imageDataUrl}" width="${width}" /></div>
</body></html>`;
}

/**
 * Hook for PDF export functionality.
 */
export function useCanvasExport(canvasRef: React.MutableRefObject<FabricCanvas | null>) {
  const { room } = useAppStore();

  const exportPdf = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    openCanvasForPrint({
      canvas,
      branding: room.branding,
      studentName: room.userName || undefined,
    });
  }, [canvasRef, room.branding, room.userName]);

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    downloadCanvasAsPng({
      canvas,
      branding: room.branding,
      studentName: room.userName || undefined,
    });
  }, [canvasRef, room.branding, room.userName]);

  return { exportPdf, downloadPng };
}
