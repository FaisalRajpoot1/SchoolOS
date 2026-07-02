import { describe, expect, it } from 'vitest';
import { bulkImportSchema, importRowSchema, promoteStudentsSchema } from './students.validation';

const uuid = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

describe('promoteStudentsSchema', () => {
  it('accepts a move to a target class', () => {
    expect(promoteStudentsSchema.safeParse({ fromClassId: uuid, toClassId: uuid }).success).toBe(true);
  });

  it('accepts graduation without a target class', () => {
    expect(promoteStudentsSchema.safeParse({ fromClassId: uuid, graduate: true }).success).toBe(true);
  });

  it('rejects neither target nor graduate', () => {
    expect(promoteStudentsSchema.safeParse({ fromClassId: uuid }).success).toBe(false);
  });
});

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
