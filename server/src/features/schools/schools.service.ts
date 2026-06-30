import { Prisma, type School, UserRole } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { hashPassword } from '@/utils/password';
import { slugify } from '@/utils/slug';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type { CreateSchoolInput, ListSchoolsQuery, UpdateSchoolInput } from './schools.validation';

const SORTABLE_FIELDS = new Set<keyof Prisma.SchoolOrderByWithRelationInput>([
  'name',
  'createdAt',
  'updatedAt',
]);

/** Ensures a unique slug by appending a numeric suffix on collision. */
const ensureUniqueSlug = async (base: string): Promise<string> => {
  const root = slugify(base) || 'school';
  let candidate = root;
  let suffix = 1;
  // Bounded loop — collisions are rare; cap to avoid pathological cases.
  while (suffix < 1000) {
    const existing = await prisma.school.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  throw ApiError.conflict('Unable to generate a unique slug');
};

export const schoolsService = {
  /** Creates a school and its first SCHOOL_ADMIN atomically. */
  async create(input: CreateSchoolInput): Promise<{ school: School }> {
    const slug = await ensureUniqueSlug(input.slug ?? input.name);
    const passwordHash = await hashPassword(input.admin.password);

    try {
      const school = await prisma.$transaction(async (tx) => {
        const created = await tx.school.create({
          data: { name: input.name, slug, email: input.email, phone: input.phone },
        });

        await tx.user.create({
          data: {
            email: input.admin.email,
            passwordHash,
            firstName: input.admin.firstName,
            lastName: input.admin.lastName,
            role: UserRole.SCHOOL_ADMIN,
            schoolId: created.id,
          },
        });

        return created;
      });

      return { school };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('A school or admin with these details already exists');
      }
      throw err;
    }
  },

  /** Paginated, searchable listing of schools (platform-wide). */
  async list(query: ListSchoolsQuery): Promise<{ items: School[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);

    const where: Prisma.SchoolWhereInput = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const sortField =
      query.sortBy && SORTABLE_FIELDS.has(query.sortBy as keyof Prisma.SchoolOrderByWithRelationInput)
        ? (query.sortBy as keyof Prisma.SchoolOrderByWithRelationInput)
        : 'createdAt';

    const [items, total] = await prisma.$transaction([
      prisma.school.findMany({ where, skip, take, orderBy: { [sortField]: query.sortOrder } }),
      prisma.school.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  /** Fetches a single school or throws 404. */
  async getById(id: string): Promise<School> {
    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) throw ApiError.notFound('School not found');
    return school;
  },

  /** Updates a school's profile. */
  async update(id: string, data: UpdateSchoolInput): Promise<School> {
    await this.getById(id);
    return prisma.school.update({ where: { id }, data });
  },

  /** Activates or deactivates a school (suspends all access on deactivate). */
  async setStatus(id: string, isActive: boolean): Promise<School> {
    await this.getById(id);
    return prisma.school.update({ where: { id }, data: { isActive } });
  },
};
