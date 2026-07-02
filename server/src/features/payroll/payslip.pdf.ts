import { renderPdf } from '@/utils/pdf';

export interface PayslipPdfData {
  schoolName: string;
  employeeName: string;
  employeeCode: string;
  period: string;
  amounts: {
    basicSalary: number;
    allowances: number;
    bonus: number;
    deductions: number;
    tax: number;
    netPay: number;
  };
  status: string;
  paidAt: string | null;
}

const money = (n: number): string => n.toLocaleString('en-US');

/** Renders a single-page payslip PDF. */
export const buildPayslipPdf = (data: PayslipPdfData): Promise<Buffer> =>
  renderPdf((doc) => {
    doc.fontSize(18).font('Helvetica-Bold').text(data.schoolName, { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(13).font('Helvetica').text('Payslip', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Employee: ${data.employeeName} (${data.employeeCode})`);
    doc.text(`Period: ${data.period}`);
    doc.text(`Status: ${data.status}${data.paidAt ? ` on ${data.paidAt}` : ''}`);
    doc.moveDown(1);

    const rows: [string, number][] = [
      ['Basic salary', data.amounts.basicSalary],
      ['Allowances', data.amounts.allowances],
      ['Bonus', data.amounts.bonus],
      ['Deductions', -data.amounts.deductions],
      ['Tax', -data.amounts.tax],
    ];

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const drawRow = (label: string, value: string, bold = false): void => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
      const y = doc.y;
      doc.text(label, left, y);
      doc.text(value, left, y, { width: right - left, align: 'right' });
      doc.moveDown(0.4);
    };

    doc.fontSize(11);
    for (const [label, value] of rows) {
      drawRow(label, `${value < 0 ? '-' : ''}${money(Math.abs(value))}`);
    }
    doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();
    doc.moveDown(0.4);
    drawRow('Net pay', money(data.amounts.netPay), true);

    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica').fillColor('#888')
      .text('This is a system-generated payslip.', { align: 'center' });
  });
