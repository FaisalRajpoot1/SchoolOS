import { api } from '@/lib/axios';
import type {
  ChildAssignment,
  ChildAttendance,
  ChildHomework,
  ChildInvoice,
  ChildResult,
} from '@/features/portal/portal.types';
import type { StudentProfile } from './studentPortal.types';

export const studentPortalApi = {
  async me(): Promise<StudentProfile> {
    const { data } = await api.get<{ data: { student: StudentProfile } }>('/student-portal/me');
    return data.data.student;
  },
  async attendance(): Promise<ChildAttendance> {
    const { data } = await api.get<{ data: ChildAttendance }>('/student-portal/attendance');
    return data.data;
  },
  async invoices(): Promise<ChildInvoice[]> {
    const { data } = await api.get<{ data: ChildInvoice[] }>('/student-portal/invoices');
    return data.data;
  },
  async homework(): Promise<ChildHomework[]> {
    const { data } = await api.get<{ data: ChildHomework[] }>('/student-portal/homework');
    return data.data;
  },
  async assignments(): Promise<ChildAssignment[]> {
    const { data } = await api.get<{ data: ChildAssignment[] }>('/student-portal/assignments');
    return data.data;
  },
  async results(): Promise<ChildResult[]> {
    const { data } = await api.get<{ data: ChildResult[] }>('/student-portal/results');
    return data.data;
  },
};
