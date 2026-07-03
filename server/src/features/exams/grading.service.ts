import { prisma } from '@/db/prisma';
import { DEFAULT_GRADE_BANDS, type GradeBand } from './grade';
import type { SetGradeSchemeInput } from './grading.validation';

export const gradingService = {
  /**
   * The school's grade bands (highest floor first). Falls back to the built-in
   * default scale when the school hasn't configured its own.
   */
  async getBands(schoolId: string): Promise<GradeBand[]> {
    const rows = await prisma.gradeBand.findMany({
      where: { schoolId },
      orderBy: { minPercentage: 'desc' },
      select: { label: true, minPercentage: true },
    });
    return rows.length > 0 ? rows : DEFAULT_GRADE_BANDS;
  },

  /** Whether the school has customized its scheme (vs. using the default). */
  async getScheme(schoolId: string): Promise<{ bands: GradeBand[]; isDefault: boolean }> {
    const rows = await prisma.gradeBand.findMany({
      where: { schoolId },
      orderBy: { minPercentage: 'desc' },
      select: { label: true, minPercentage: true },
    });
    return rows.length > 0
      ? { bands: rows, isDefault: false }
      : { bands: DEFAULT_GRADE_BANDS, isDefault: true };
  },

  /** Replaces the school's scheme with the supplied bands. */
  async setScheme(schoolId: string, input: SetGradeSchemeInput): Promise<GradeBand[]> {
    await prisma.$transaction([
      prisma.gradeBand.deleteMany({ where: { schoolId } }),
      prisma.gradeBand.createMany({
        data: input.bands.map((b) => ({
          schoolId,
          label: b.label,
          minPercentage: b.minPercentage,
        })),
      }),
    ]);
    return this.getBands(schoolId);
  },

  /** Resets the school back to the default scale by clearing its bands. */
  async resetScheme(schoolId: string): Promise<GradeBand[]> {
    await prisma.gradeBand.deleteMany({ where: { schoolId } });
    return DEFAULT_GRADE_BANDS;
  },
};
