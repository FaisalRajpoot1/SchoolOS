import { api } from '@/lib/axios';
import type {
  Application,
  ApplyPayload,
  ListAdmissionsParams,
  PaginationMeta,
} from './admissions.types';

export const admissionsApi = {
  // Public
  async publicSchool(schoolId: string): Promise<{ id: string; name: string }> {
    const { data } = await api.get<{ data: { school: { id: string; name: string } } }>(
      `/admissions/schools/${schoolId}`,
    );
    return data.data.school;
  },
  async apply(payload: ApplyPayload): Promise<{ id: string }> {
    const { data } = await api.post<{ data: { id: string } }>('/admissions/apply', payload);
    return data.data;
  },

  // Admin
  async list(params: ListAdmissionsParams): Promise<{ items: Application[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: Application[]; meta: PaginationMeta }>('/admissions', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async setStatus(id: string, status: string): Promise<Application> {
    const { data } = await api.patch<{ data: { application: Application } }>(
      `/admissions/${id}/status`,
      { status },
    );
    return data.data.application;
  },
  async convert(id: string, payload: { classId?: string; sectionId?: string }): Promise<void> {
    await api.post(`/admissions/${id}/convert`, payload);
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/admissions/${id}`);
  },
};
