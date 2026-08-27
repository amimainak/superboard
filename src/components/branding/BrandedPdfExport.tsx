'use client';

import { forwardRef, useImperativeHandle, useCallback } from 'react';
import type { BrandingConfig } from '@/types';

// ---------- Header image preloader ----------
function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// ---------- Types ----------
type Props = {
  canvasElement: HTMLElement | null;
  studentName: string;
  branding?: BrandingConfig;
  tier?: string;
};

export interface BrandedPdfExportRef {
  generatePdf: () => Promise<void>;
}

// ---------- Export function ----------
/**
 * Generates a branded (or plain) PDF from the whiteboard canvas.
 *
 * Branded flow:
 *   1. html2canvas captures the whiteboard DOM element.
 *   2. An offscreen header canvas is drawn with the agency logo + name.
 *   3. An offscreen footer canvas is drawn with student name + date.
 *   4. jsPDF composites all three into a single landscape PDF and triggers download.
 *
 * Plain flow:
 *   1. html2canvas captures the whiteboard.
 *   2. jsPDF saves it directly.
 *
 * TODO: Install html2canvas and jsPDF, then replace the console stubs.
 */
export async function exportToPdf({ canvasElement, studentName, branding, tier }: Props) {
  if (!canvasElement) {
    console.warn('[BrandedPdfExport] No canvas element provided.');
    return;
  }

  // Tier gate: PDF download requires PRO or AGENCY
  const { hasFeature } = await import('@/lib/usage');
  if (!hasFeature((tier || 'FREE') as any, 'downloadPdf')) {
    const { useAppStore } = await import('@/store/app-store');
    useAppStore.getState().openPaywall('downloadPdf');
    return;
  }

  const hasBranding = !!(branding?.logoUrl || branding?.agencyName);

  // --- Step 1: Capture the main whiteboard canvas ---
  // TODO: const boardCanvas = await html2canvas(canvasElement, { scale: 2, useCORS: true });

  // --- Step 2: If branding, create a header with logo + agency name ---
  if (hasBranding) {
    // TODO: Create an offscreen canvas for the header
    //   - Draw agency logo (preloaded) on the left
    //   - Draw agency name next to it
    //   - Add a thin coloured rule underneath (using branding.color)

    if (branding?.logoUrl) {
      // TODO: const logoImg = await preloadImage(branding.logoUrl);
    }
  }

  // --- Step 3: If branding, create footer with student name + date ---
  if (hasBranding) {
    // TODO: Create an offscreen canvas for the footer
    //   - Left: studentName
    //   - Right: new Date().toLocaleDateString()
    //   - Thin rule on top
  }

  // --- Step 4: Compose PDF ---
  // TODO: Create a new jsPDF instance
  //   - If branded: add header, board, footer images stacked vertically
  //   - If plain: add board image only
  //   const totalHeight = (headerHeight ?? 0) + boardCanvas.height + (footerHeight ?? 0);
  //   const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [boardCanvas.width, totalHeight] });
  //   if (hasBranding) {
  //     pdf.addImage(headerCanvas, 'PNG', 0, 0);
  //     pdf.addImage(boardCanvas, 'PNG', 0, headerHeight);
  //     pdf.addImage(footerCanvas, 'PNG', 0, headerHeight + boardCanvas.height);
  //   } else {
  //     pdf.addImage(boardCanvas, 'PNG', 0, 0, boardCanvas.width, boardCanvas.height);
  //   }

  // --- Step 5: Trigger download ---
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = hasBranding && branding?.agencyName
    ? `${branding.agencyName.replace(/\s+/g, '_')}_${studentName}_${timestamp}.pdf`
    : `superboard_${studentName}_${timestamp}.pdf`;

  // TODO: pdf.save(filename);
}

// ---------- Component ----------
/**
 * Utility component that exposes `generatePdf` via a ref.
 *
 * Usage:
 * ```tsx
 * const ref = useRef<BrandedPdfExportRef>(null);
 * <BrandedPdfExport
 *   ref={ref}
 *   canvasElement={boardRef.current}
 *   studentName="Alex"
 *   branding={branding}
 * />
 * <Button onClick={() => ref.current?.generatePdf()}>Download PDF</Button>
 * ```
 */
const BrandedPdfExport = forwardRef<BrandedPdfExportRef, Props>(
  function BrandedPdfExport({ canvasElement, studentName, branding, tier }, ref) {
    useImperativeHandle(ref, () => ({
      generatePdf: () => exportToPdf({ canvasElement, studentName, branding, tier }),
    }));

    return null;
  },
);

export default BrandedPdfExport;
