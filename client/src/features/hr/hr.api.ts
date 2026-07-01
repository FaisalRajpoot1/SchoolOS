import { api } from '@/lib/axios';
import type {
  ApplyLeavePayload,
  CreateEmployeePayload,
  Employee,
  EmployeeDetail,
  LeaveRequest,
  LeaveStatus,
  ListEmployeesParams,
  ListLeaveParams,
  PaginationMeta,
  StaffStatus,
} from './hr.types';

export const hrApi = {
  // Employees
  async listEmployees(params: ListEmployeesParams): Promise<{ items: Employee[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: Employee[]; meta: PaginationMeta }>('/hr/employees', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async getEmployee(id: string): Promise<EmployeeDetail> {
    const { data } = await api.get<{ data: { employee: EmployeeDetail } }>(`/hr/employees/${id}`);
    return data.data.employee;
  },
  async createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
    const { data } = await api.post<{ data: { employee: Employee } }>('/hr/employees', payload);
    return data.data.employee;
  },
  async setStatus(id: string, status: StaffStatus): Promise<void> {
    await api.patch(`/hr/employees/${id}/status`, { status });
  },
  async removeEmployee(id: string): Promise<void> {
    await api.delete(`/hr/employees/${id}`);
  },
  async applyLeave(id: string, payload: ApplyLeavePayload): Promise<void> {
    await api.post(`/hr/employees/${id}/leave`, payload);
  },

  // Leave
  async listLeave(params: ListLeaveParams): Promise<{ items: LeaveRequest[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: LeaveRequest[]; meta: PaginationMeta }>('/hr/leave', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async reviewLeave(leaveId: string, status: LeaveStatus): Promise<void> {
    await api.patch(`/hr/leave/${leaveId}/status`, { status });
  },
};
