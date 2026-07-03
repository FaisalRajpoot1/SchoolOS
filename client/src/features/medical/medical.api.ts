import { api } from '@/lib/axios';
import type {
  CreateVisitPayload,
  InfirmaryVisit,
  ListVisitsParams,
  MedicalProfile,
  PaginationMeta,
  UpsertProfilePayload,
} from './medical.types';

export const medicalApi = {
  async getProfile(studentId: string): Promise<MedicalProfile | null> {
    const { data } = await api.get<{ data: { profile: MedicalProfile | null } }>(
      `/medical/students/${studentId}/profile`,
    );
    return data.data.profile;
  },
  async upsertProfile(studentId: string, payload: UpsertProfilePayload): Promise<MedicalProfile> {
    const { data } = await api.put<{ data: { profile: MedicalProfile } }>(
      `/medical/students/${studentId}/profile`,
      payload,
    );
    return data.data.profile;
  },
  async listVisits(
    params: ListVisitsParams,
  ): Promise<{ items: InfirmaryVisit[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: InfirmaryVisit[]; meta: PaginationMeta }>(
      '/medical/visits',
      { params },
    );
    return { items: data.data, meta: data.meta };
  },
  async createVisit(payload: CreateVisitPayload): Promise<InfirmaryVisit> {
    const { data } = await api.post<{ data: { visit: InfirmaryVisit } }>('/medical/visits', payload);
    return data.data.visit;
  },
  async removeVisit(id: string): Promise<void> {
    await api.delete(`/medical/visits/${id}`);
  },
};
