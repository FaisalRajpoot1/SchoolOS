import { type Payslip, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type {
  CreatePayslipInput,
  GeneratePayslipsInput,
  ListPayslipsQuery,
  RegisterQuery,
  UpdatePayslipInput,
} from './payroll.validation';
import { buildPayslipPdf } from './payslip.pdf';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Amounts {
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  tax: number;
}

const computeNet = (a: Amounts): number =>
  a.basicSalary + a.allowances + a.bonus - a.deductions - a.tax;

const employeeSelect = {
  employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
} satisfies Prisma.PayslipInclude;

const assertPayslip = async (schoolId: string, id: string): Promise<Payslip> => {
  const payslip = await prisma.payslip.findFirst({ where: { id, schoolId } });
  if (!payslip) throw ApiError.notFound('Payslip not found');
  return payslip;
};

export const payrollService = {
  async create(schoolId: string, input: CreatePayslipInput) {
    const employee = await prisma.employee.findFirst({
      where: { id: input.employeeId, schoolId },
      select: { id: true, salary: true },
    });
    if (!employee) throw ApiError.badRequest('Invalid employee for this school');

    const basicSalary = input.basicSalary ?? employee.salary ?? 0;
    const amounts: Amounts = {
      basicSalary,
      allowances: input.allowances,
      bonus: input.bonus,
      deductions: input.deductions,
      tax: input.tax,
    };
    if (computeNet(amounts) < 0) {
      throw ApiError.badRequest('Net pay cannot be negative; check deductions and tax');
    }

    try {
      return await prisma.payslip.create({
        data: {
          schoolId,
          employeeId: input.employeeId,
          periodMonth: input.periodMonth,
          periodYear: input.periodYear,
          ...amounts,
          netPay: computeNet(amounts),
          note: input.note ?? null,
        },
        include: employeeSelect,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('A payslip for this employee and period already exists');
      }
      throw err;
    }
  },

  /** Creates DRAFT payslips for all active, salaried employees missing one for the period. */
  async generate(schoolId: string, input: GeneratePayslipsInput): Promise<{ created: number }> {
    const [employees, existing] = await Promise.all([
      prisma.employee.findMany({
        where: { schoolId, status: 'ACTIVE', salary: { not: null } },
        select: { id: true, salary: true },
      }),
      prisma.payslip.findMany({
        where: { schoolId, periodYear: input.periodYear, periodMonth: input.periodMonth },
        select: { employeeId: true },
      }),
    ]);

    const alreadyPaid = new Set(existing.map((p) => p.employeeId));
    const toCreate = employees.filter((e) => !alreadyPaid.has(e.id));

    const result = await prisma.payslip.createMany({
      data: toCreate.map((e) => ({
        schoolId,
        employeeId: e.id,
        periodMonth: input.periodMonth,
        periodYear: input.periodYear,
        basicSalary: e.salary ?? 0,
        netPay: e.salary ?? 0,
      })),
      skipDuplicates: true,
    });

    return { created: result.count };
  },

  async list(
    schoolId: string,
    query: ListPayslipsQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.PayslipWhereInput = {
      schoolId,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.periodYear ? { periodYear: query.periodYear } : {}),
      ...(query.periodMonth ? { periodMonth: query.periodMonth } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.payslip.findMany({
        where,
        skip,
        take,
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { createdAt: 'desc' }],
        include: employeeSelect,
      }),
      prisma.payslip.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  /** Full payroll register for a period (no pagination) — feeds CSV export. */
  async register(schoolId: string, query: RegisterQuery) {
    const payslips = await prisma.payslip.findMany({
      where: { schoolId, periodYear: query.periodYear, periodMonth: query.periodMonth },
      orderBy: [{ employee: { lastName: 'asc' } }, { employee: { firstName: 'asc' } }],
      include: employeeSelect,
    });

    const rows = payslips.map((p) => ({
      employeeCode: p.employee.employeeCode,
      name: `${p.employee.firstName} ${p.employee.lastName}`,
      basicSalary: p.basicSalary,
      allowances: p.allowances,
      bonus: p.bonus,
      deductions: p.deductions,
      tax: p.tax,
      netPay: p.netPay,
      status: p.status,
    }));

    const totals = rows.reduce(
      (acc, r) => ({
        basicSalary: acc.basicSalary + r.basicSalary,
        allowances: acc.allowances + r.allowances,
        bonus: acc.bonus + r.bonus,
        deductions: acc.deductions + r.deductions,
        tax: acc.tax + r.tax,
        netPay: acc.netPay + r.netPay,
      }),
      { basicSalary: 0, allowances: 0, bonus: 0, deductions: 0, tax: 0, netPay: 0 },
    );

    return { periodMonth: query.periodMonth, periodYear: query.periodYear, rows, totals };
  },

  async getById(schoolId: string, id: string) {
    const payslip = await prisma.payslip.findFirst({ where: { id, schoolId }, include: employeeSelect });
    if (!payslip) throw ApiError.notFound('Payslip not found');
    return payslip;
  },

  async update(schoolId: string, id: string, input: UpdatePayslipInput) {
    const existing = await assertPayslip(schoolId, id);
    if (existing.status === 'PAID') throw ApiError.badRequest('A paid payslip cannot be edited');

    const amounts: Amounts = {
      basicSalary: input.basicSalary ?? existing.basicSalary,
      allowances: input.allowances ?? existing.allowances,
      bonus: input.bonus ?? existing.bonus,
      deductions: input.deductions ?? existing.deductions,
      tax: input.tax ?? existing.tax,
    };
    if (computeNet(amounts) < 0) {
      throw ApiError.badRequest('Net pay cannot be negative; check deductions and tax');
    }

    await prisma.payslip.update({
      where: { id },
      data: { ...amounts, netPay: computeNet(amounts), note: input.note ?? existing.note },
    });
    return this.getById(schoolId, id);
  },

  async pay(schoolId: string, id: string) {
    const existing = await assertPayslip(schoolId, id);
    if (existing.status === 'PAID') throw ApiError.badRequest('This payslip is already paid');
    await prisma.payslip.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } });
    return this.getById(schoolId, id);
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await assertPayslip(schoolId, id);
    await prisma.payslip.delete({ where: { id } });
  },

  /** Renders a payslip as a PDF buffer with a suggested filename. */
  async renderPdf(schoolId: string, id: string): Promise<{ buffer: Buffer; filename: string }> {
    const [payslip, school] = await Promise.all([
      this.getById(schoolId, id),
      prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
    ]);

    const buffer = await buildPayslipPdf({
      schoolName: school?.name ?? 'School',
      employeeName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
      employeeCode: payslip.employee.employeeCode,
      period: `${MONTHS[payslip.periodMonth - 1] ?? payslip.periodMonth} ${payslip.periodYear}`,
      amounts: {
        basicSalary: payslip.basicSalary,
        allowances: payslip.allowances,
        bonus: payslip.bonus,
        deductions: payslip.deductions,
        tax: payslip.tax,
        netPay: payslip.netPay,
      },
      status: payslip.status,
      paidAt: payslip.paidAt ? payslip.paidAt.toISOString().slice(0, 10) : null,
    });

    const filename = `payslip-${payslip.employee.employeeCode}-${payslip.periodYear}-${String(
      payslip.periodMonth,
    ).padStart(2, '0')}.pdf`;
    return { buffer, filename };
  },
};
