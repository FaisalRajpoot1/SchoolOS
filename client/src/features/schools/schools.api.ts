import { api } from '@/lib/axios';
import type {
  CreateSchoolPayload,
  ListSchoolsParams,
  PaginationMeta,
  School,
  UpdateSchoolPayload,
} from './schools.types';

interface ListEnvelope {
  success: boolean;
  data: School[];
  meta: PaginationMeta;
}

interface ItemEnvelope {
  success: boolean;
  data: { school: School };
}

export const schoolsApi = {
  // ---- Platform (SUPER_ADMIN) ----
  async list(params: ListSchoolsParams): Promise<{ items: School[]; meta: PaginationMeta }> {
    const { data } = await api.get<ListEnvelope>('/schools', { params });
    return { items: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<School> {
    const { data } = await api.get<ItemEnvelope>(`/schools/${id}`);
    return data.data.school;
  },

  async create(payload: CreateSchoolPayload): Promise<School> {
    const { data } = await api.post<ItemEnvelope>('/schools', payload);
    return data.data.school;
  },

  async update(id: string, payload: UpdateSchoolPayload): Promise<School> {
    const { data } = await api.patch<ItemEnvelope>(`/schools/${id}`, payload);
    return data.data.school;
  },

  async setStatus(id: string, isActive: boolean): Promise<School> {
    const { data } = await api.patch<ItemEnvelope>(`/schools/${id}/status`, { isActive });
    return data.data.school;
  },

  // ---- Tenant self-service (SCHOOL_ADMIN) ----
  async getMine(): Promise<School> {
    const { data } = await api.get<ItemEnvelope>('/schools/me');
    return data.data.school;
  },

  async updateMine(payload: UpdateSchoolPayload): Promise<School> {
    const { data } = await api.patch<ItemEnvelope>('/schools/me', payload);
    return data.data.school;
  },
};
