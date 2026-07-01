import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrApi } from './hr.api';
import type {
  ApplyLeavePayload,
  CreateEmployeePayload,
  LeaveStatus,
  ListEmployeesParams,
  ListLeaveParams,
  StaffStatus,
} from './hr.types';

const keys = {
  employees: ['hr', 'employees'] as const,
  employee: (id: string) => ['hr', 'employee', id] as const,
  leave: ['hr', 'leave'] as const,
};

export const useEmployees = (params: ListEmployeesParams) =>
  useQuery({ queryKey: [...keys.employees, params], queryFn: () => hrApi.listEmployees(params) });

export const useEmployee = (id: string) =>
  useQuery({ queryKey: keys.employee(id), queryFn: () => hrApi.getEmployee(id), enabled: !!id });

export const useCreateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => hrApi.createEmployee(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.employees }),
  });
};

export const useSetEmployeeStatus = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: StaffStatus) => hrApi.setStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.employee(id) });
      void qc.invalidateQueries({ queryKey: keys.employees });
    },
  });
};

export const useDeleteEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrApi.removeEmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.employees }),
  });
};

export const useApplyLeave = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyLeavePayload) => hrApi.applyLeave(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.employee(id) });
      void qc.invalidateQueries({ queryKey: keys.leave });
    },
  });
};

export const useLeaveList = (params: ListLeaveParams) =>
  useQuery({ queryKey: [...keys.leave, params], queryFn: () => hrApi.listLeave(params) });

export const useReviewLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, status }: { leaveId: string; status: LeaveStatus }) =>
      hrApi.reviewLeave(leaveId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr'] }),
  });
};
