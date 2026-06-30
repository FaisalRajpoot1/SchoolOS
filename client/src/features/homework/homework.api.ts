import { api } from '@/lib/axios';
import type {
  CreateHomeworkPayload,
  GradeSubmissionPayload,
  Homework,
  ListHomeworkParams,
  PaginationMeta,
  RecordSubmissionPayload,
  SubmissionsRoster,
} from './homework.types';

export const homeworkApi = {
  async list(params: ListHomeworkParams): Promise<{ items: Homework[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: Homework[]; meta: PaginationMeta }>('/homework', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async getById(id: string): Promise<Homework> {
    const { data } = await api.get<{ data: { homework: Homework } }>(`/homework/${id}`);
    return data.data.homework;
  },
  async create(payload: CreateHomeworkPayload): Promise<Homework> {
    const { data } = await api.post<{ data: { homework: Homework } }>('/homework', payload);
    return data.data.homework;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/homework/${id}`);
  },
  async submissions(id: string): Promise<SubmissionsRoster> {
    const { data } = await api.get<{ data: SubmissionsRoster }>(`/homework/${id}/submissions`);
    return data.data;
  },
  async recordSubmission(
    id: string,
    studentId: string,
    payload: RecordSubmissionPayload,
  ): Promise<SubmissionsRoster> {
    const { data } = await api.put<{ data: SubmissionsRoster }>(
      `/homework/${id}/submissions/${studentId}`,
      payload,
    );
    return data.data;
  },
  async gradeSubmission(
    id: string,
    studentId: string,
    payload: GradeSubmissionPayload,
  ): Promise<SubmissionsRoster> {
    const { data } = await api.patch<{ data: SubmissionsRoster }>(
      `/homework/${id}/submissions/${studentId}/grade`,
      payload,
    );
    return data.data;
  },
  async removeSubmission(id: string, studentId: string): Promise<SubmissionsRoster> {
    const { data } = await api.delete<{ data: SubmissionsRoster }>(
      `/homework/${id}/submissions/${studentId}`,
    );
    return data.data;
  },
};
