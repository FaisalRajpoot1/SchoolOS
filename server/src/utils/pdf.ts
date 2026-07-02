import type { Response } from 'express';
import PDFDocument from 'pdfkit';

/**
 * Renders a PDF by running `build` against a PDFKit document and resolving
 * with the complete buffer. Buffering (vs streaming) keeps callers simple;
 * the documents here are small single-page files.
 */
export const renderPdf = (build: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    // Guard the synchronous build so a bad value rejects instead of hanging.
    try {
      build(doc);
      doc.end();
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });

/** Reduces a filename to a header-safe ASCII subset (blocks CR/LF/quote injection). */
const safeFilename = (name: string): string =>
  name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 100) || 'download.pdf';

/** Sends a PDF buffer as a download with a sanitized Content-Disposition filename. */
export const sendPdf = (res: Response, buffer: Buffer, filename: string): void => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(filename)}"`);
  res.status(200).send(buffer);
};
