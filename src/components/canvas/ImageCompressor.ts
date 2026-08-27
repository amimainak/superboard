// ============================================================
// ImageCompressor — Vision Payload Compression (CRITICAL)
// ============================================================
// Before sending a canvas snapshot to Claude for Graphing/Shape
// Perfection, the frontend MUST use the browser's native Canvas
// API to crop ONLY the bounding box of the selected area,
// compress to 800px width, 50% JPEG quality.
// Reduces API latency from ~4s to <1s.
// ============================================================

'use client';

export interface CompressionOptions {
  maxWidth: number;
  quality: number; // 0 to 1
  format: 'image/jpeg';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 800,
  quality: 0.5,
  format: 'image/jpeg',
};

/**
 * Compress a selected area of a canvas to optimized JPEG for vision AI.
 *
 * Steps:
 * 1. Crop to bounding box of selected area
 * 2. Resize to maxWidth (800px)
 * 3. Compress to JPEG at 50% quality
 *
 * @param sourceCanvas - The Tldraw canvas element
 * @param bounds - Bounding box { x, y, width, height } of the selected area
 * @param options - Compression options (defaults: 800px, 50% JPEG)
 * @returns Base64 encoded JPEG string (without data URI prefix)
 */
export function compressCanvasArea(
  sourceCanvas: HTMLCanvasElement,
  bounds: { x: number; y: number; width: number; height: number },
  options: Partial<CompressionOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Step 1: Crop to bounding box
  const cropCanvas = document.createElement('canvas');
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) throw new Error('Could not get canvas 2D context');

  // Account for device pixel ratio
  const dpr = window.devicePixelRatio || 1;

  cropCanvas.width = bounds.width * dpr;
  cropCanvas.height = bounds.height * dpr;

  cropCtx.drawImage(
    sourceCanvas,
    bounds.x * dpr,
    bounds.y * dpr,
    bounds.width * dpr,
    bounds.height * dpr,
    0,
    0,
    bounds.width * dpr,
    bounds.height * dpr
  );

  // Step 2: Resize to maxWidth if necessary
  const resizeCanvas = document.createElement('canvas');
  const resizeCtx = resizeCanvas.getContext('2d');
  if (!resizeCtx) throw new Error('Could not get resize canvas context');

  let outputWidth = bounds.width;
  let outputHeight = bounds.height;

  if (outputWidth > opts.maxWidth) {
    const scaleFactor = opts.maxWidth / outputWidth;
    outputWidth = opts.maxWidth;
    outputHeight = bounds.height * scaleFactor;
  }

  resizeCanvas.width = outputWidth * dpr;
  resizeCanvas.height = outputHeight * dpr;
  resizeCtx.drawImage(cropCanvas, 0, 0, resizeCanvas.width, resizeCanvas.height);

  // Step 3: Compress to JPEG
  const dataUrl = resizeCanvas.toDataURL(opts.format, opts.quality);

  // Strip the data URI prefix to get raw base64
  const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

  return base64;
}

/**
 * Compress an entire canvas (no crop).
 * Used for full-board AI analysis.
 */
export function compressFullCanvas(
  sourceCanvas: HTMLCanvasElement,
  options: Partial<CompressionOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const resizeCanvas = document.createElement('canvas');
  const resizeCtx = resizeCanvas.getContext('2d');
  if (!resizeCtx) throw new Error('Could not get canvas context');

  const dpr = window.devicePixelRatio || 1;
  let width = sourceCanvas.width / dpr;
  let height = sourceCanvas.height / dpr;

  if (width > opts.maxWidth) {
    const scaleFactor = opts.maxWidth / width;
    width = opts.maxWidth;
    height = height * scaleFactor;
  }

  resizeCanvas.width = width * dpr;
  resizeCanvas.height = height * dpr;
  resizeCtx.drawImage(sourceCanvas, 0, 0, resizeCanvas.width, resizeCanvas.height);

  const dataUrl = resizeCanvas.toDataURL(opts.format, opts.quality);
  return dataUrl.replace(/^data:image\/jpeg;base64,/, '');
}

const ImageCompressor = { compressCanvasArea, compressFullCanvas };
export default ImageCompressor;
