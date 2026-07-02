import QRCode from 'qrcode';
import { renderPdf } from '@/utils/pdf';

export interface CertificatePdfData {
  schoolName: string;
  title: string;
  serialNo: string;
  body: string;
  issueDate: string;
  verificationCode: string;
  verifyUrl: string;
}

/** Renders a single-page certificate PDF with a QR code linking to the verify page. */
export const buildCertificatePdf = async (data: CertificatePdfData): Promise<Buffer> => {
  const qrPng = await QRCode.toBuffer(data.verifyUrl, { margin: 1, width: 120 });

  return renderPdf((doc) => {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    // Decorative border.
    doc
      .rect(left - 15, doc.page.margins.top - 15, width + 30, doc.page.height - doc.page.margins.top - doc.page.margins.bottom + 30)
      .lineWidth(2)
      .strokeColor('#94a3b8')
      .stroke();

    doc.fillColor('#0f172a');
    doc.fontSize(20).font('Helvetica-Bold').text(data.schoolName, { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(22).font('Helvetica-Bold').text(data.title.toUpperCase(), { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('#64748b')
      .text(`Serial No. ${data.serialNo}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).font('Helvetica').fillColor('#1e293b')
      .text(data.body, { align: 'left', lineGap: 4 });

    doc.moveDown(3);
    const rowY = doc.y;
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Issued on: ${data.issueDate}`, left, rowY);

    // QR + verification code, bottom-right.
    const qrSize = 90;
    const qrX = right - qrSize;
    const qrY = doc.page.height - doc.page.margins.bottom - qrSize - 30;
    doc.image(qrPng, qrX, qrY, { width: qrSize, height: qrSize });
    doc.fontSize(7).fillColor('#64748b')
      .text('Scan to verify', qrX, qrY + qrSize + 2, { width: qrSize, align: 'center' })
      .text(data.verificationCode, qrX - 20, qrY + qrSize + 12, { width: qrSize + 40, align: 'center' });
  });
};
