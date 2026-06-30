import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examsApi } from './exams.api';
import type {
  BulkMarkRecord,
  CreateExamPayload,
  ListExamsParams,
  UpdateExamSubjectPayload,
} from './exams.types';

const keys = {
  all: ['exams'] as const,
  list: (params: ListExamsParams) => ['exams', 'list', params] as const,
  detail: (id: string) => ['exams', 'detail', id] as const,
  results: (id: string) => ['exams', 'results', id] as const,
  marks: (examId: string, examSubjectId: string) =>
    ['exams', 'marks', examId, examSubjectId] as const,
};

export const useExams = (params: ListExamsParams) =>
  useQuery({ queryKey: keys.list(params), queryFn: () => examsApi.list(params) });

export const useExam = (id: string) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => examsApi.getById(id), enabled: !!id });

export const useCreateExam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExamPayload) => examsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useSetExamPublished = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (published: boolean) => examsApi.setPublished(id, published),
    onSuccess: (exam) => {
      qc.setQueryData(keys.detail(id), exam);
      void qc.invalidateQueries({ queryKey: keys.all });
    },
  });
};

export const useDeleteExam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useUpdateExamSubject = (examId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      examSubjectId,
      payload,
    }: {
      examSubjectId: string;
      payload: UpdateExamSubjectPayload;
    }) => examsApi.updateExamSubject(examId, examSubjectId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.detail(examId) }),
  });
};

export const useMarksRoster = (examId: string, examSubjectId: string) =>
  useQuery({
    queryKey: keys.marks(examId, examSubjectId),
    queryFn: () => examsApi.marksRoster(examId, examSubjectId),
    enabled: !!examId && !!examSubjectId,
  });

export const useSaveMarks = (examId: string, examSubjectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (records: BulkMarkRecord[]) => examsApi.bulkMarks(examId, examSubjectId, records),
    onSuccess: (data) => {
      qc.setQueryData(keys.marks(examId, examSubjectId), data);
      void qc.invalidateQueries({ queryKey: keys.detail(examId) });
      void qc.invalidateQueries({ queryKey: keys.results(examId) });
    },
  });
};

export const useExamResults = (examId: string) =>
  useQuery({
    queryKey: keys.results(examId),
    queryFn: () => examsApi.results(examId),
    enabled: !!examId,
  });
