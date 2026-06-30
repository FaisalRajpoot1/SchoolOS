import { api } from '@/lib/axios';
import type {
  CreateTeacherPayload,
  ListTeachersParams,
  PaginationMeta,
  StaffStatus,
  TeacherDetail,
  TeacherListItem,
  UpdateTeacherPayload,
} from './teachers.types';

export const teachersApi = {
  async list(
    params: ListTeachersParams,
  ): Promise<{ items: TeacherListItem[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: TeacherListItem[]; meta: PaginationMeta }>('/teachers', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<TeacherDetail> {
    const { data } = await api.get<{ data: { teacher: TeacherDetail } }>(`/teachers/${id}`);
    return data.data.teacher;
  },

  async create(payload: CreateTeacherPayload): Promise<TeacherDetail> {
    const { data } = await api.post<{ data: { teacher: TeacherDetail } }>('/teachers', payload);
    return data.data.teacher;
  },

  async update(id: string, payload: UpdateTeacherPayload): Promise<TeacherDetail> {
    const { data } = await api.patch<{ data: { teacher: TeacherDetail } }>(
      `/teachers/${id}`,
      payload,
    );
    return data.data.teacher;
  },

  async setStatus(id: string, status: StaffStatus): Promise<void> {
    await api.patch(`/teachers/${id}/status`, { status });
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/teachers/${id}`);
  },
};
