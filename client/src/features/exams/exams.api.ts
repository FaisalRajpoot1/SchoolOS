import { api } from '@/lib/axios';
import type {
  BulkMarkRecord,
  CreateExamPayload,
  ExamDetail,
  ExamListItem,
  ExamResults,
  ExamSubject,
  ListExamsParams,
  MarksRoster,
  PaginationMeta,
  UpdateExamSubjectPayload,
} from './exams.types';

export const examsApi = {
  async list(params: ListExamsParams): Promise<{ items: ExamListItem[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: ExamListItem[]; meta: PaginationMeta }>('/exams', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async getById(id: string): Promise<ExamDetail> {
    const { data } = await api.get<{ data: { exam: ExamDetail } }>(`/exams/${id}`);
    return data.data.exam;
  },
  async create(payload: CreateExamPayload): Promise<ExamDetail> {
    const { data } = await api.post<{ data: { exam: ExamDetail } }>('/exams', payload);
    return data.data.exam;
  },
  async setPublished(id: string, published: boolean): Promise<ExamDetail> {
    const { data } = await api.post<{ data: { exam: ExamDetail } }>(
      `/exams/${id}/${published ? 'publish' : 'unpublish'}`,
    );
    return data.data.exam;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/exams/${id}`);
  },
  async updateExamSubject(
    examId: string,
    examSubjectId: string,
    payload: UpdateExamSubjectPayload,
  ): Promise<ExamSubject> {
    const { data } = await api.patch<{ data: { examSubject: ExamSubject } }>(
      `/exams/${examId}/subjects/${examSubjectId}`,
      payload,
    );
    return data.data.examSubject;
  },
  async marksRoster(examId: string, examSubjectId: string): Promise<MarksRoster> {
    const { data } = await api.get<{ data: MarksRoster }>(
      `/exams/${examId}/subjects/${examSubjectId}/marks`,
    );
    return data.data;
  },
  async bulkMarks(
    examId: string,
    examSubjectId: string,
    records: BulkMarkRecord[],
  ): Promise<MarksRoster> {
    const { data } = await api.post<{ data: MarksRoster }>(
      `/exams/${examId}/subjects/${examSubjectId}/marks`,
      { records },
    );
    return data.data;
  },
  async results(examId: string): Promise<ExamResults> {
    const { data } = await api.get<{ data: ExamResults }>(`/exams/${examId}/results`);
    return data.data;
  },
};
