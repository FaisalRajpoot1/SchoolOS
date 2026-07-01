import { api } from '@/lib/axios';
import type {
  Assignment,
  CreateAssignmentPayload,
  GradeSubmissionPayload,
  ListAssignmentsParams,
  PaginationMeta,
  SubmissionsRoster,
} from './assignments.types';

export const assignmentsApi = {
  async list(params: ListAssignmentsParams): Promise<{ items: Assignment[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: Assignment[]; meta: PaginationMeta }>('/assignments', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async getById(id: string): Promise<Assignment> {
    const { data } = await api.get<{ data: { assignment: Assignment } }>(`/assignments/${id}`);
    return data.data.assignment;
  },
  async create(payload: CreateAssignmentPayload): Promise<Assignment> {
    const { data } = await api.post<{ data: { assignment: Assignment } }>('/assignments', payload);
    return data.data.assignment;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/assignments/${id}`);
  },
  async submissions(id: string): Promise<SubmissionsRoster> {
    const { data } = await api.get<{ data: SubmissionsRoster }>(`/assignments/${id}/submissions`);
    return data.data;
  },
  async recordSubmission(id: string, studentId: string): Promise<SubmissionsRoster> {
    const { data } = await api.put<{ data: SubmissionsRoster }>(
      `/assignments/${id}/submissions/${studentId}`,
      {},
    );
    return data.data;
  },
  async gradeSubmission(
    id: string,
    studentId: string,
    payload: GradeSubmissionPayload,
  ): Promise<SubmissionsRoster> {
    const { data } = await api.patch<{ data: SubmissionsRoster }>(
      `/assignments/${id}/submissions/${studentId}/grade`,
      payload,
    );
    return data.data;
  },
  async removeSubmission(id: string, studentId: string): Promise<SubmissionsRoster> {
    const { data } = await api.delete<{ data: SubmissionsRoster }>(
      `/assignments/${id}/submissions/${studentId}`,
    );
    return data.data;
  },
};
