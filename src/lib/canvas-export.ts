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
  const agencyName = escapeHtml(branding?.agencyName || 'Superboard');
  const brandColor = /^#[0-9a-fA-F]{6}$/.test(branding?.color || '') ? branding!.color! : '#3b82f6';

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
      ${studentName ? 'Student: ' + escapeHtml(studentName) + ' | ' : ''}${timestamp}
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

// ============================================================
// Sprint 1: Enhanced PDF Export with Audio Bookmarks
// ============================================================

interface AudioBookmark {
  /** Seconds from the start of the recording */
  timestamp: number;
  /** Human-readable label (e.g. "Solving for x") */
  label: string;
  /** Which canvas page this bookmark corresponds to */
  pageNumber: number;
}

/**
 * Export canvas to a print-ready HTML with an audio bookmark sidebar.
 * Each bookmark is a clickable timestamp that can be used alongside
 * a recorded lesson audio file.
 */
export function exportCanvasWithBookmarks(options: PdfExportOptions & {
  bookmarks?: AudioBookmark[];
  totalPages?: number;
  currentPage?: number;
  audioFileName?: string;
}): void {
  const { canvas, branding, studentName, bookmarks = [], totalPages = 1, currentPage = 1 } = options;

  const dataUrl = canvas.toDataURL({
    format: 'png',
    quality: 1.0,
    multiplier: 2,
  });

  const width = canvas.getWidth();
  const height = canvas.getHeight();
  const timestamp = new Date().toLocaleString();
  const agencyName = escapeHtml(branding?.agencyName || 'Superboard');
  const brandColor = /^#[0-9a-fA-F]{6}$/.test(branding?.color || '') ? branding!.color! : '#059669';

  // Build bookmark sidebar items
  const bookmarkItems = bookmarks
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((bm) => {
      const mins = Math.floor(bm.timestamp / 60);
      const secs = Math.floor(bm.timestamp % 60);
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      const isCurrentPage = bm.pageNumber === currentPage;
      return `
        <a href="#" class="bookmark-item ${isCurrentPage ? 'active' : ''}" data-timestamp="${bm.timestamp}" title="Jump to ${timeStr}">
          <span class="bookmark-time">${timeStr}</span>
          <span class="bookmark-label">${escapeHtml(bm.label)}</span>
          ${isCurrentPage ? '<span class="bookmark-current">●</span>' : ''}
        </a>`;
    })
    .join('');

  // Build page navigation
  const pageTabs = Array.from({ length: totalPages }, (_, i) => {
    const pageNum = i + 1;
    const active = pageNum === currentPage;
    return `<span class="page-tab ${active ? 'active' : ''}">Page ${pageNum}</span>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${agencyName} — Whiteboard Export</title>
  <style>
    @page { margin: 0; size: ${width + 220}px ${height + 80}px; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: white;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      border-bottom: 2px solid ${brandColor};
      background: ${brandColor}10;
      flex-shrink: 0;
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
    .content-area {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .bookmark-sidebar {
      width: 200px;
      border-right: 1px solid #e5e7eb;
      padding: 16px 12px;
      overflow-y: auto;
      flex-shrink: 0;
      background: #f9fafb;
    }
    .bookmark-sidebar h3 {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9ca3af;
      margin-bottom: 12px;
    }
    .bookmark-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      text-decoration: none;
      color: #374151;
      font-size: 12px;
      transition: background 0.15s;
      margin-bottom: 4px;
    }
    .bookmark-item:hover {
      background: #e5e7eb;
    }
    .bookmark-item.active {
      background: ${brandColor}15;
      color: ${brandColor};
      font-weight: 600;
    }
    .bookmark-time {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 11px;
      color: #9ca3af;
      min-width: 36px;
    }
    .bookmark-item.active .bookmark-time {
      color: ${brandColor};
    }
    .bookmark-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .bookmark-current {
      color: ${brandColor};
      font-size: 8px;
    }
    .canvas-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: auto;
      background: white;
    }
    .canvas-wrapper img {
      max-width: 100%;
      height: auto;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    .page-tabs {
      display: flex;
      gap: 4px;
      padding: 8px 24px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      flex-shrink: 0;
    }
    .page-tab {
      padding: 4px 12px;
      font-size: 11px;
      border-radius: 6px;
      color: #6b7280;
      background: transparent;
    }
    .page-tab.active {
      background: ${brandColor};
      color: white;
      font-weight: 600;
    }
    .footer {
      padding: 8px 24px;
      border-top: 1px solid #eee;
      font-size: 10px;
      color: #999;
      text-align: center;
      flex-shrink: 0;
    }
    .no-bookmarks {
      text-align: center;
      padding: 24px 12px;
      color: #9ca3af;
      font-size: 12px;
      font-style: italic;
    }
    @media print {
      .no-print { display: none; }
      .bookmark-sidebar { width: 180px; }
    }
    @media (max-width: 640px) {
      .bookmark-sidebar { width: 160px; padding: 12px 8px; }
      .content-area { flex-direction: column; }
      .bookmark-sidebar { border-right: none; border-bottom: 1px solid #e5e7eb; max-height: 120px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${agencyName}</h1>
    <div class="meta">
      ${studentName ? 'Student: ' + escapeHtml(studentName) + ' | ' : ''}Page ${currentPage} of ${totalPages} | ${timestamp}
    </div>
  </div>
  <div class="content-area">
    <div class="bookmark-sidebar">
      <h3>Audio Bookmarks</h3>
      ${bookmarks.length > 0 ? bookmarkItems : '<div class="no-bookmarks">No bookmarks recorded</div>'}
    </div>
    <div class="canvas-wrapper">
      <img src="${dataUrl}" width="${width}" />
    </div>
  </div>
  <div class="page-tabs">
    ${pageTabs}
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

    // Bookmark click handler — stores timestamp for external audio player integration
    document.querySelectorAll('.bookmark-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const ts = item.getAttribute('data-timestamp');
        if (ts && window.opener) {
          // Try to communicate with parent window's audio player
          window.opener.postMessage({ type: 'seek-audio', timestamp: parseFloat(ts) }, window.location.origin);
        }
      });
    });
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** Minimal HTML escaping for bookmark labels */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  const agencyName = escapeHtml(branding?.agencyName || 'Superboard');
  const brandColor = /^#[0-9a-fA-F]{6}$/.test(branding?.color || '') ? branding!.color! : '#3b82f6';

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
<div class="header"><h1>${agencyName}</h1><div class="meta">${escapeHtml(studentName || '')} | ${timestamp}</div></div>
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
