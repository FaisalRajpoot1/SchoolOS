import { describe, expect, it } from 'vitest';
import { generateBody, titleForType, type CertificateContext } from './template';

const ctx: CertificateContext = {
  studentName: 'Jane Doe',
  admissionNo: 'ADM-00001',
  className: 'Grade 6',
  schoolName: 'Demo School',
  date: '2026-07-01',
};

describe('titleForType', () => {
  it('returns human titles for every certificate type', () => {
    expect(titleForType('BONAFIDE')).toBe('Bonafide Certificate');
    expect(titleForType('CHARACTER')).toBe('Character Certificate');
    expect(titleForType('TRANSFER')).toBe('Transfer Certificate');
    expect(titleForType('LEAVING')).toBe('School Leaving Certificate');
  });
});

describe('generateBody', () => {
  it('includes the student, school, and date in a bonafide body', () => {
    const body = generateBody('BONAFIDE', ctx);
    expect(body).toContain('Jane Doe');
    expect(body).toContain('ADM-00001');
    expect(body).toContain('Demo School');
    expect(body).toContain('Grade 6');
    expect(body).toContain('2026-07-01');
  });

  it('omits the class phrase when className is null', () => {
    const body = generateBody('BONAFIDE', { ...ctx, className: null });
    expect(body).not.toContain('studying in');
  });

  it('produces distinct text per certificate type', () => {
    const bonafide = generateBody('BONAFIDE', ctx);
    const transfer = generateBody('TRANSFER', ctx);
    expect(bonafide).not.toBe(transfer);
    expect(transfer).toContain('Transfer Certificate');
  });
});
