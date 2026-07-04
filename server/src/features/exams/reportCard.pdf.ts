import { renderPdf } from '@/utils/pdf';

export interface ReportCardPdfData {
  schoolName: string;
  examName: string;
  studentName: string;
  admissionNo: string;
  className: string | null;
  subjects: {
    name: string;
    maxMarks: number;
    marksObtained: number | null;
    isAbsent: boolean;
    passed: boolean;
  }[];
  obtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  passed: boolean;
  /** Class position (dense rank) among the exam's class, when available. */
  position: { rank: number; classSize: number } | null;
}

/** Renders a per-student exam report card PDF. */
export const buildReportCardPdf = (data: ReportCardPdfData): Promise<Buffer> =>
  renderPdf((doc) => {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    doc.fontSize(18).font('Helvetica-Bold').text(data.schoolName, { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(13).font('Helvetica').text('Report Card', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Student: ${data.studentName} (${data.admissionNo})`);
    doc.text(`Class: ${data.className ?? '—'}`);
    doc.text(`Examination: ${data.examName}`);
    doc.moveDown(1);

    const col = { subject: 0.5, max: 0.2, obtained: 0.2, result: 0.1 };
    const cell = (text: string, x: number, y: number, w: number, align: 'left' | 'right' | 'center'): void => {
      doc.text(text, left + x, y, { width: w, align });
    };
    const rowHeights = 18;
    let y = doc.y;

    const header = (): void => {
      doc.font('Helvetica-Bold').fontSize(11);
      cell('Subject', 0, y, width * col.subject, 'left');
      cell('Max', width * col.subject, y, width * col.max, 'right');
      cell('Obtained', width * (col.subject + col.max), y, width * col.obtained, 'right');
      cell('', width * (col.subject + col.max + col.obtained), y, width * col.result, 'center');
      y += rowHeights;
      doc.moveTo(left, y - 4).lineTo(right, y - 4).stroke();
    };
    header();

    doc.font('Helvetica').fontSize(10);
    for (const s of data.subjects) {
      const obtained = s.isAbsent ? 'ABS' : s.marksObtained != null ? String(s.marksObtained) : '—';
      cell(s.name, 0, y, width * col.subject, 'left');
      cell(String(s.maxMarks), width * col.subject, y, width * col.max, 'right');
      cell(obtained, width * (col.subject + col.max), y, width * col.obtained, 'right');
      doc.fillColor(s.passed ? '#16a34a' : '#dc2626');
      cell(s.passed ? 'P' : 'F', width * (col.subject + col.max + col.obtained), y, width * col.result, 'center');
      doc.fillColor('#000');
      y += rowHeights;
    }

    doc.moveTo(left, y).lineTo(right, y).stroke();
    y += 12;
    doc.y = y;

    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(
      `Total: ${data.obtained} / ${data.totalMax}   ·   ${data.percentage}%   ·   Grade ${data.grade}`,
      { align: 'left' },
    );
    doc.moveDown(0.3);
    doc.fillColor(data.passed ? '#16a34a' : '#dc2626')
      .text(`Result: ${data.passed ? 'PASS' : 'FAIL'}`);
    doc.fillColor('#000');
    if (data.position) {
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(11).text(
        `Class position: ${data.position.rank} of ${data.position.classSize}`,
      );
    }

    doc.moveDown(4);
    doc.fontSize(9).font('Helvetica').text('_______________________', { align: 'right' });
    doc.fontSize(8).fillColor('#888').text('Authorized signature', { align: 'right' });
  });
