import type { PaginationMeta } from '@/features/schools/schools.types';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type LeaveType = 'CASUAL' | 'SICK' | 'ANNUAL' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT'];
export const STAFF_STATUSES: StaffStatus[] = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'];
export const LEAVE_TYPES: LeaveType[] = ['CASUAL', 'SICK', 'ANNUAL', 'UNPAID'];

export interface LeaveRequest {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  reviewedAt: string | null;
  employee?: { id: string; firstName: string; lastName: string; employeeCode: string };
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  department: string | null;
  employmentType: EmploymentType;
  joiningDate: string;
  salary: number | null;
  status: StaffStatus;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNo: string | null;
  bankRoutingNo: string | null;
}

export interface EmployeeDetail extends Employee {
  leaveRequests: LeaveRequest[];
}

export interface BankDetailsPayload {
  bankName?: string;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankRoutingNo?: string;
}

export interface CreateEmployeePayload extends BankDetailsPayload {
  employeeCode?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  employmentType: EmploymentType;
  salary?: number;
}

export interface ApplyLeavePayload {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface ListEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: StaffStatus;
}

export interface ListLeaveParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  employeeId?: string;
}

export type { PaginationMeta };
