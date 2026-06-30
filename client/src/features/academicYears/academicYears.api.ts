import { api } from '@/lib/axios';
import type { AcademicYear, CreateAcademicYearPayload } from './academicYears.types';

interface ListEnvelope {
  success: boolean;
  data: AcademicYear[];
}

interface ItemEnvelope {
  success: boolean;
  data: { academicYear: AcademicYear };
}

export const academicYearsApi = {
  async list(): Promise<AcademicYear[]> {
    const { data } = await api.get<ListEnvelope>('/academic-years');
    return data.data;
  },

  async create(payload: CreateAcademicYearPayload): Promise<AcademicYear> {
    const { data } = await api.post<ItemEnvelope>('/academic-years', payload);
    return data.data.academicYear;
  },

  async setCurrent(id: string): Promise<AcademicYear> {
    const { data } = await api.patch<ItemEnvelope>(`/academic-years/${id}/current`, {});
    return data.data.academicYear;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/academic-years/${id}`);
  },
};
