import { type Employee, type LeaveStatus, Prisma, type StaffStatus } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type {
  ApplyLeaveInput,
  CreateEmployeeInput,
  ListEmployeesQuery,
  ListLeaveQuery,
  UpdateEmployeeInput,
} from './hr.validation';

const assertEmployee = async (schoolId: string, id: string): Promise<Employee> => {
  const employee = await prisma.employee.findFirst({ where: { id, schoolId } });
  if (!employee) throw ApiError.notFound('Employee not found');
  return employee;
};

const nextEmployeeCode = async (schoolId: string): Promise<string> => {
  const count = await prisma.employee.count({ where: { schoolId } });
  return `STF-${String(count + 1).padStart(5, '0')}`;
};

const leaveInclude = {
  employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
} satisfies Prisma.LeaveRequestInclude;

export const hrService = {
  // ---- Employees ----
  async createEmployee(schoolId: string, input: CreateEmployeeInput): Promise<Employee> {
    const employeeCode = input.employeeCode ?? (await nextEmployeeCode(schoolId));
    try {
      return await prisma.employee.create({
        data: {
          schoolId,
          employeeCode,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email ?? null,
          phone: input.phone ?? null,
          designation: input.designation ?? null,
          department: input.department ?? null,
          employmentType: input.employmentType,
          joiningDate: input.joiningDate,
          salary: input.salary ?? null,
          bankName: input.bankName ?? null,
          bankAccountName: input.bankAccountName ?? null,
          bankAccountNo: input.bankAccountNo ?? null,
          bankRoutingNo: input.bankRoutingNo ?? null,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('An employee with this code already exists');
      }
      throw err;
    }
  },

  async listEmployees(
    schoolId: string,
    query: ListEmployeesQuery,
  ): Promise<{ items: Employee[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.EmployeeWhereInput = {
      schoolId,
      ...(query.department ? { department: query.department } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { employeeCode: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.employee.findMany({ where, skip, take, orderBy: { createdAt: query.sortOrder } }),
      prisma.employee.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getEmployee(schoolId: string, id: string) {
    const employee = await prisma.employee.findFirst({
      where: { id, schoolId },
      include: { leaveRequests: { orderBy: { createdAt: 'desc' } } },
    });
    if (!employee) throw ApiError.notFound('Employee not found');
    return employee;
  },

  async updateEmployee(schoolId: string, id: string, input: UpdateEmployeeInput): Promise<Employee> {
    await assertEmployee(schoolId, id);
    return prisma.employee.update({ where: { id }, data: input });
  },

  async setStatus(schoolId: string, id: string, status: StaffStatus): Promise<Employee> {
    await assertEmployee(schoolId, id);
    return prisma.employee.update({ where: { id }, data: { status } });
  },

  async removeEmployee(schoolId: string, id: string): Promise<void> {
    await assertEmployee(schoolId, id);
    await prisma.employee.delete({ where: { id } });
  },

  // ---- Leave ----
  async applyLeave(schoolId: string, employeeId: string, input: ApplyLeaveInput) {
    await assertEmployee(schoolId, employeeId);
    return prisma.leaveRequest.create({
      data: {
        schoolId,
        employeeId,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason ?? null,
      },
      include: leaveInclude,
    });
  },

  async listLeave(
    schoolId: string,
    query: ListLeaveQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.LeaveRequestWhereInput = {
      schoolId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder },
        include: leaveInclude,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async reviewLeave(schoolId: string, leaveId: string, status: LeaveStatus) {
    const leave = await prisma.leaveRequest.findFirst({ where: { id: leaveId, schoolId } });
    if (!leave) throw ApiError.notFound('Leave request not found');
    if (leave.status !== 'PENDING') throw ApiError.badRequest('This request has already been reviewed');
    return prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status, reviewedAt: new Date() },
      include: leaveInclude,
    });
  },
};
