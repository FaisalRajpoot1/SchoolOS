import { api } from '@/lib/axios';
import type {
  ChildAttendance,
  ChildHomework,
  ChildInvoice,
  ChildResult,
  PortalMe,
} from './portal.types';

export const portalApi = {
  async me(): Promise<PortalMe> {
    const { data } = await api.get<{ data: PortalMe }>('/portal/me');
    return data.data;
  },
  async attendance(studentId: string): Promise<ChildAttendance> {
    const { data } = await api.get<{ data: ChildAttendance }>(
      `/portal/children/${studentId}/attendance`,
    );
    return data.data;
  },
  async invoices(studentId: string): Promise<ChildInvoice[]> {
    const { data } = await api.get<{ data: ChildInvoice[] }>(
      `/portal/children/${studentId}/invoices`,
    );
    return data.data;
  },
  async homework(studentId: string): Promise<ChildHomework[]> {
    const { data } = await api.get<{ data: ChildHomework[] }>(
      `/portal/children/${studentId}/homework`,
    );
    return data.data;
  },
  async results(studentId: string): Promise<ChildResult[]> {
    const { data } = await api.get<{ data: ChildResult[] }>(
      `/portal/children/${studentId}/results`,
    );
    return data.data;
  },
};
