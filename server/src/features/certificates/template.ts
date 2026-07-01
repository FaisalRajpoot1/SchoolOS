import type { CertificateType } from '@prisma/client';

export interface CertificateContext {
  studentName: string;
  admissionNo: string;
  className: string | null;
  schoolName: string;
  date: string;
}

const TITLES: Record<CertificateType, string> = {
  BONAFIDE: 'Bonafide Certificate',
  CHARACTER: 'Character Certificate',
  TRANSFER: 'Transfer Certificate',
  LEAVING: 'School Leaving Certificate',
};

export const titleForType = (type: CertificateType): string => TITLES[type];

/** Produces default certificate body text from a template + student context. */
export const generateBody = (type: CertificateType, ctx: CertificateContext): string => {
  const cls = ctx.className ? `, currently studying in ${ctx.className}` : '';
  const clsPast = ctx.className ? ` from ${ctx.className}` : '';
  switch (type) {
    case 'BONAFIDE':
      return `This is to certify that ${ctx.studentName}, bearing Admission No. ${ctx.admissionNo}, is a bona fide student of ${ctx.schoolName}${cls}. This certificate is issued on ${ctx.date} on request for official purposes.`;
    case 'CHARACTER':
      return `This is to certify that ${ctx.studentName} (Admission No. ${ctx.admissionNo}) has been a student of ${ctx.schoolName}. To the best of our knowledge, their conduct and character during this period have been found to be good. Issued on ${ctx.date}.`;
    case 'TRANSFER':
      return `This is to certify that ${ctx.studentName} (Admission No. ${ctx.admissionNo}) was a student of ${ctx.schoolName}${clsPast}. This Transfer Certificate is issued on ${ctx.date} at the request of the student/guardian. No dues are pending against the student.`;
    case 'LEAVING':
      return `This is to certify that ${ctx.studentName} (Admission No. ${ctx.admissionNo}) has left ${ctx.schoolName}${clsPast}. This School Leaving Certificate is issued on ${ctx.date}. We wish them success in their future endeavours.`;
    default:
      return `Issued to ${ctx.studentName} on ${ctx.date}.`;
  }
};
