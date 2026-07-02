import { describe, expect, it } from 'vitest';
import { bulkImportSchema, importRowSchema } from './students.validation';

describe('importRowSchema', () => {
  it('accepts a minimal valid row', () => {
    expect(importRowSchema.safeParse({ firstName: 'Ayesha', lastName: 'Khan' }).success).toBe(true);
  });

  it('accepts optional placement + demographics', () => {
    const parsed = importRowSchema.parse({
      firstName: 'A',
      lastName: 'B',
      admissionNo: 'ADM-9',
      gender: 'FEMALE',
      email: 'a@b.com',
      phone: '03001234567',
      className: 'Grade 1',
      sectionName: 'A',
    });
    expect(parsed.className).toBe('Grade 1');
  });

  it('rejects a missing name', () => {
    expect(importRowSchema.safeParse({ lastName: 'B' }).success).toBe(false);
  });

  it('rejects an invalid gender and unknown keys', () => {
    expect(importRowSchema.safeParse({ firstName: 'A', lastName: 'B', gender: 'X' }).success).toBe(false);
    expect(importRowSchema.safeParse({ firstName: 'A', lastName: 'B', extra: 1 }).success).toBe(false);
  });
});

describe('bulkImportSchema', () => {
  it('defaults dryRun to false and requires at least one row', () => {
    const parsed = bulkImportSchema.parse({ rows: [{ firstName: 'A', lastName: 'B' }] });
    expect(parsed.dryRun).toBe(false);
    expect(bulkImportSchema.safeParse({ rows: [] }).success).toBe(false);
  });

  it('rejects more than 500 rows', () => {
    const rows = Array.from({ length: 501 }, () => ({ firstName: 'A', lastName: 'B' }));
    expect(bulkImportSchema.safeParse({ rows }).success).toBe(false);
  });
});
