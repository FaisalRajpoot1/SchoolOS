import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const employmentType = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT']);
const staffStatus = z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']);
const leaveType = z.enum(['CASUAL', 'SICK', 'ANNUAL', 'UNPAID']);

// ---- Employees ----
export const createEmployeeSchema = z
  .object({
    employeeCode: z.string().trim().min(1).max(40).optional(),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().email().nullish(),
    phone: z.string().trim().max(30).nullish(),
    designation: z.string().trim().max(80).nullish(),
    department: z.string().trim().max(80).nullish(),
    employmentType: employmentType.default('FULL_TIME'),
    joiningDate: z.coerce.date().optional(),
    salary: z.coerce.number().int().min(0).max(100_000_000).nullish(),
    bankName: z.string().trim().max(120).nullish(),
    bankAccountName: z.string().trim().max(120).nullish(),
    bankAccountNo: z.string().trim().max(40).nullish(),
    bankRoutingNo: z.string().trim().max(40).nullish(),
  })
  .strict();

export const updateEmployeeSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    email: z.string().email().nullish(),
    phone: z.string().trim().max(30).nullish(),
    designation: z.string().trim().max(80).nullish(),
    department: z.string().trim().max(80).nullish(),
    employmentType: employmentType.optional(),
    joiningDate: z.coerce.date().optional(),
    salary: z.coerce.number().int().min(0).max(100_000_000).nullish(),
    bankName: z.string().trim().max(120).nullish(),
    bankAccountName: z.string().trim().max(120).nullish(),
    bankAccountNo: z.string().trim().max(40).nullish(),
    bankRoutingNo: z.string().trim().max(40).nullish(),
  })
  .strict();

export const setEmployeeStatusSchema = z.object({ status: staffStatus }).strict();

export const listEmployeesSchema = paginationSchema.extend({
  department: z.string().trim().min(1).max(80).optional(),
  status: staffStatus.optional(),
});

export const employeeIdParamSchema = z.object({ id: z.string().uuid() });

// ---- Leave ----
export const applyLeaveSchema = z
  .object({
    type: leaveType.default('CASUAL'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().trim().max(300).nullish(),
  })
  .strict()
  .refine((d) => d.startDate <= d.endDate, {
    message: 'startDate must be on or before endDate',
    path: ['endDate'],
  });

export const reviewLeaveSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']) }).strict();

export const listLeaveSchema = paginationSchema.extend({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  employeeId: z.string().uuid().optional(),
});

export const leaveIdParamSchema = z.object({ leaveId: z.string().uuid() });

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesSchema>;
export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;
export type ListLeaveQuery = z.infer<typeof listLeaveSchema>;
