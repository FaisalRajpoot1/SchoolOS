import { type BehaviorRecord, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import { notificationsService } from '@/features/notifications/notifications.service';
import { summarizeBehavior, type BehaviorSummary } from './behavior.summary';
import type {
  CreateBehaviorInput,
  ListBehaviorQuery,
  UpdateBehaviorInput,
} from './behavior.validation';

const recordInclude = {
  student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
  recordedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.BehaviorRecordInclude;

const assertStudent = async (schoolId: string, studentId: string): Promise<void> => {
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) throw ApiError.notFound('Student not found');
};

const assertRecord = async (schoolId: string, id: string): Promise<BehaviorRecord> => {
  const record = await prisma.behaviorRecord.findFirst({ where: { id, schoolId } });
  if (!record) throw ApiError.notFound('Behavior record not found');
  return record;
};

/** Rejects a merit with negative points or a demerit with positive points. */
const assertPointsAgree = (type: BehaviorRecord['type'], points: number): void => {
  if (type === 'MERIT' && points < 0) {
    throw ApiError.badRequest('A merit cannot have negative points');
  }
  if (type === 'DEMERIT' && points > 0) {
    throw ApiError.badRequest('A demerit cannot have positive points');
  }
};

/** Coerces points to agree with a type: merits positive, demerits negative, incidents 0. */
const normalizePoints = (type: BehaviorRecord['type'], points: number): number => {
  if (type === 'MERIT') return Math.abs(points);
  if (type === 'DEMERIT') return -Math.abs(points);
  return 0;
};

/** Title-case label for a behaviour type (e.g. MERIT → "Merit"). */
const labelForType = (type: BehaviorRecord['type']): string =>
  type.charAt(0) + type.slice(1).toLowerCase();

export const behaviorService = {
  async create(schoolId: string, recordedById: string, input: CreateBehaviorInput) {
    await assertStudent(schoolId, input.studentId);
    const record = await prisma.behaviorRecord.create({
      data: {
        schoolId,
        studentId: input.studentId,
        recordedById,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        points: input.points,
        occurredOn: input.occurredOn ?? new Date(),
      },
      include: recordInclude,
    });

    await notificationsService.notifyGuardiansSafe(schoolId, [input.studentId], {
      type: 'BEHAVIOR',
      title: `${labelForType(record.type)}: ${record.title}`,
      body: `${record.student.firstName} ${record.student.lastName} — ${labelForType(record.type).toLowerCase()} recorded.`,
    });

    return record;
  },

  async list(
    schoolId: string,
    query: ListBehaviorQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    if (query.studentId) await assertStudent(schoolId, query.studentId);
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.BehaviorRecordWhereInput = {
      schoolId,
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.behaviorRecord.findMany({
        where,
        skip,
        take,
        orderBy: { occurredOn: 'desc' },
        include: recordInclude,
      }),
      prisma.behaviorRecord.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getById(schoolId: string, id: string) {
    const record = await prisma.behaviorRecord.findFirst({
      where: { id, schoolId },
      include: recordInclude,
    });
    if (!record) throw ApiError.notFound('Behavior record not found');
    return record;
  },

  async update(schoolId: string, id: string, input: UpdateBehaviorInput) {
    const existing = await assertRecord(schoolId, id);
    const type = input.type ?? existing.type;
    let points = input.points ?? existing.points;
    // When the type changes but points aren't supplied, re-normalize the sign so
    // a merit↔demerit switch doesn't fail with a confusing "points disagree" error.
    if (input.type && input.type !== existing.type && input.points === undefined) {
      points = normalizePoints(type, existing.points);
    }
    assertPointsAgree(type, points);
    const pointsChanged = points !== existing.points;

    return prisma.behaviorRecord.update({
      where: { id },
      data: {
        ...(input.type ? { type: input.type } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...('description' in input ? { description: input.description ?? null } : {}),
        ...(pointsChanged ? { points } : {}),
        ...(input.occurredOn ? { occurredOn: input.occurredOn } : {}),
      },
      include: recordInclude,
    });
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await assertRecord(schoolId, id);
    await prisma.behaviorRecord.delete({ where: { id } });
  },

  /** A student's behaviour tally plus their most recent records. */
  async studentSummary(
    schoolId: string,
    studentId: string,
  ): Promise<{ summary: BehaviorSummary; recent: unknown[] }> {
    await assertStudent(schoolId, studentId);
    const [rows, recent] = await Promise.all([
      prisma.behaviorRecord.findMany({
        where: { schoolId, studentId },
        select: { type: true, points: true },
      }),
      prisma.behaviorRecord.findMany({
        where: { schoolId, studentId },
        orderBy: { occurredOn: 'desc' },
        take: 10,
        include: recordInclude,
      }),
    ]);
    return { summary: summarizeBehavior(rows), recent };
  },
};
