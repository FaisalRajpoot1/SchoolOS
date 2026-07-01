import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignmentsApi } from './assignments.api';
import type {
  CreateAssignmentPayload,
  GradeSubmissionPayload,
  ListAssignmentsParams,
} from './assignments.types';

const keys = {
  all: ['assignments'] as const,
  list: (params: ListAssignmentsParams) => ['assignments', 'list', params] as const,
  detail: (id: string) => ['assignments', 'detail', id] as const,
  submissions: (id: string) => ['assignments', 'submissions', id] as const,
};

export const useAssignmentsList = (params: ListAssignmentsParams) =>
  useQuery({ queryKey: keys.list(params), queryFn: () => assignmentsApi.list(params) });

export const useAssignment = (id: string) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => assignmentsApi.getById(id), enabled: !!id });

export const useCreateAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload) => assignmentsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useDeleteAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useAssignmentSubmissions = (id: string) =>
  useQuery({
    queryKey: keys.submissions(id),
    queryFn: () => assignmentsApi.submissions(id),
    enabled: !!id,
  });

export const useRecordAssignmentSubmission = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => assignmentsApi.recordSubmission(id, studentId),
    onSuccess: (data) => qc.setQueryData(keys.submissions(id), data),
  });
};

export const useGradeAssignmentSubmission = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, payload }: { studentId: string; payload: GradeSubmissionPayload }) =>
      assignmentsApi.gradeSubmission(id, studentId, payload),
    onSuccess: (data) => qc.setQueryData(keys.submissions(id), data),
  });
};

export const useRemoveAssignmentSubmission = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => assignmentsApi.removeSubmission(id, studentId),
    onSuccess: (data) => qc.setQueryData(keys.submissions(id), data),
  });
};
