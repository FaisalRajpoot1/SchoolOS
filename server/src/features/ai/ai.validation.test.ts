import { describe, expect, it } from 'vitest';
import { generateSchema, reportCommentSchema } from './ai.validation';

describe('generateSchema', () => {
  it('accepts a valid payload and defaults count to 5', () => {
    const parsed = generateSchema.parse({
      kind: 'homework',
      subject: 'Science',
      topic: 'Photosynthesis',
      grade: 'Grade 6',
    });
    expect(parsed.count).toBe(5);
    expect(parsed.kind).toBe('homework');
  });

  it('coerces and bounds count', () => {
    expect(generateSchema.parse({ kind: 'questions', subject: 'M', topic: 'T', grade: 'G', count: '12' }).count).toBe(12);
    expect(generateSchema.safeParse({ kind: 'questions', subject: 'M', topic: 'T', grade: 'G', count: 21 }).success).toBe(false);
  });

  it('rejects an unknown kind', () => {
    expect(generateSchema.safeParse({ kind: 'essay', subject: 'M', topic: 'T', grade: 'G' }).success).toBe(false);
  });

  it('rejects unknown keys (strict)', () => {
    expect(
      generateSchema.safeParse({ kind: 'homework', subject: 'M', topic: 'T', grade: 'G', extra: 1 }).success,
    ).toBe(false);
  });
});

describe('reportCommentSchema', () => {
  it('requires a uuid studentId', () => {
    expect(reportCommentSchema.safeParse({ studentId: 'not-a-uuid' }).success).toBe(false);
    expect(reportCommentSchema.safeParse({ studentId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301' }).success).toBe(true);
  });
});
