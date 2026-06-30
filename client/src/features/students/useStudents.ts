import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from './students.api';
import type {
  CreateStudentPayload,
  GuardianPayload,
  ListStudentsParams,
  StudentStatus,
  UpdateStudentPayload,
} from './students.types';

const keys = {
  all: ['students'] as const,
  list: (params: ListStudentsParams) => ['students', 'list', params] as const,
  detail: (id: string) => ['students', 'detail', id] as const,
};

export const useStudents = (params: ListStudentsParams) =>
  useQuery({ queryKey: keys.list(params), queryFn: () => studentsApi.list(params) });

export const useStudent = (id: string) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => studentsApi.getById(id), enabled: !!id });

export const useCreateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentPayload) => studentsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useUpdateStudent = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStudentPayload) => studentsApi.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.detail(id) });
      void qc.invalidateQueries({ queryKey: keys.all });
    },
  });
};

export const useSetStudentStatus = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: StudentStatus) => studentsApi.setStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.detail(id) });
      void qc.invalidateQueries({ queryKey: keys.all });
    },
  });
};

export const useDeleteStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useAddGuardian = (studentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GuardianPayload) => studentsApi.addGuardian(studentId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.detail(studentId) }),
  });
};

export const useRemoveGuardian = (studentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guardianId: string) => studentsApi.removeGuardian(studentId, guardianId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.detail(studentId) }),
  });
};
