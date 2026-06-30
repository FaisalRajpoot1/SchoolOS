import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { homeworkApi } from './homework.api';
import type {
  CreateHomeworkPayload,
  GradeSubmissionPayload,
  ListHomeworkParams,
  RecordSubmissionPayload,
} from './homework.types';

const keys = {
  all: ['homework'] as const,
  list: (params: ListHomeworkParams) => ['homework', 'list', params] as const,
  detail: (id: string) => ['homework', 'detail', id] as const,
  submissions: (id: string) => ['homework', 'submissions', id] as const,
};

export const useHomeworkList = (params: ListHomeworkParams) =>
  useQuery({ queryKey: keys.list(params), queryFn: () => homeworkApi.list(params) });

export const useHomework = (id: string) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => homeworkApi.getById(id), enabled: !!id });

export const useCreateHomework = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHomeworkPayload) => homeworkApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useDeleteHomework = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homeworkApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useSubmissions = (id: string) =>
  useQuery({ queryKey: keys.submissions(id), queryFn: () => homeworkApi.submissions(id), enabled: !!id });

export const useRecordSubmission = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, payload }: { studentId: string; payload: RecordSubmissionPayload }) =>
      homeworkApi.recordSubmission(id, studentId, payload),
    onSuccess: (data) => qc.setQueryData(keys.submissions(id), data),
  });
};

export const useGradeSubmission = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, payload }: { studentId: string; payload: GradeSubmissionPayload }) =>
      homeworkApi.gradeSubmission(id, studentId, payload),
    onSuccess: (data) => qc.setQueryData(keys.submissions(id), data),
  });
};

export const useRemoveSubmission = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => homeworkApi.removeSubmission(id, studentId),
    onSuccess: (data) => qc.setQueryData(keys.submissions(id), data),
  });
};
