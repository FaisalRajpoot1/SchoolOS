import { renderPdf } from '@/utils/pdf';

export interface InvoicePdfData {
  schoolName: string;
  invoiceNo: string;
  title: string;
  status: string;
  dueDate: string | null;
  studentName: string;
  admissionNo: string;
  items: { description: string; quantity: number; amount: number }[];
  payments: { paidAt: string; method: string; amount: number; reference: string | null }[];
  totals: {
    subtotal: number;
    discount: number;
    lateFee: number;
    total: number;
    paid: number;
    balance: number;
  };
}

const money = (n: number): string => n.toLocaleString('en-US');

/** Renders an invoice / fee statement PDF. */
export const buildInvoicePdf = (data: InvoicePdfData): Promise<Buffer> =>
  renderPdf((doc) => {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;

    doc.fontSize(18).font('Helvetica-Bold').text(data.schoolName, { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(13).font('Helvetica').text('Invoice', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice No: ${data.invoiceNo}`);
    doc.text(`Student: ${data.studentName} (${data.admissionNo})`);
    doc.text(`Title: ${data.title}`);
    doc.text(`Status: ${data.status}${data.dueDate ? ` · due ${data.dueDate}` : ''}`);
    doc.moveDown(1);

    const row = (a: string, b: string, c: string, bold = false): void => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
      const y = doc.y;
      doc.text(a, left, y, { width: (right - left) * 0.6 });
      doc.text(b, left + (right - left) * 0.6, y, { width: (right - left) * 0.15, align: 'right' });
      doc.text(c, left + (right - left) * 0.75, y, { width: (right - left) * 0.25, align: 'right' });
      doc.moveDown(0.4);
    };

    doc.fontSize(11);
    row('Item', 'Qty', 'Amount', true);
    doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();
    doc.moveDown(0.3);
    for (const it of data.items) {
      row(it.description, String(it.quantity), money(it.amount * it.quantity));
    }
    doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();
    doc.moveDown(0.3);

    const totalRow = (label: string, value: string, bold = false): void => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
      const y = doc.y;
      doc.text(label, left, y, { width: right - left - 120, align: 'right' });
      doc.text(value, right - 120, y, { width: 120, align: 'right' });
      doc.moveDown(0.4);
    };
    if (data.totals.discount > 0 || data.totals.lateFee > 0) {
      totalRow('Subtotal', money(data.totals.subtotal));
      if (data.totals.discount > 0) totalRow('Discount', `- ${money(data.totals.discount)}`);
      if (data.totals.lateFee > 0) totalRow('Late fee', `+ ${money(data.totals.lateFee)}`);
    }
    totalRow('Total', money(data.totals.total), true);
    totalRow('Paid', money(data.totals.paid));
    totalRow('Balance', money(data.totals.balance), true);

    if (data.payments.length > 0) {
      doc.moveDown(1);
      doc.fontSize(11).font('Helvetica-Bold').text('Payments');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      for (const p of data.payments) {
        row(`${p.paidAt} · ${p.method}${p.reference ? ` · ${p.reference}` : ''}`, '', money(p.amount));
      }
    }

    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica').fillColor('#888')
      .text('This is a system-generated invoice.', { align: 'center' });
  });
