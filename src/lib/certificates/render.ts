// ============================================================
// Certificate PDF Renderer — SVG → PNG → PDF
// ============================================================
// Reuses the same sharp + pdf-lib pipeline as data export.
// Single-page PDF per certificate (landscape orientation).
// ============================================================

import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import { renderCertificateSvg, type CertificateData } from './templates'

export async function renderCertificateToPdf(data: CertificateData): Promise<Buffer> {
  // 1. Generate SVG
  const svg = renderCertificateSvg('milestone', data) // templateId passed in data in real use

  // 2. SVG → PNG via sharp (2x scale for quality)
  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(2246, 1588, { fit: 'fill' })  // 2x the SVG dimensions
    .png()
    .toBuffer()

  // 3. PNG → PDF
  const pdfDoc = await PDFDocument.create()
  const pngImage = await pdfDoc.embedPng(pngBuffer)
  // Landscape: width > height
  const page = pdfDoc.addPage([pngImage.width, pngImage.height])
  page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

// Overload to accept templateId
export async function renderCertificateToPdfWithTemplate(templateId: string, data: CertificateData): Promise<Buffer> {
  const svg = renderCertificateSvg(templateId, data)
  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(2246, 1588, { fit: 'fill' })
    .png()
    .toBuffer()

  const pdfDoc = await PDFDocument.create()
  const pngImage = await pdfDoc.embedPng(pngBuffer)
  const page = pdfDoc.addPage([pngImage.width, pngImage.height])
  page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
