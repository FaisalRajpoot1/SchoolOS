import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teachersApi } from './teachers.api';
import type {
  CreateTeacherPayload,
  ListTeachersParams,
  StaffStatus,
  UpdateTeacherPayload,
} from './teachers.types';

const keys = {
  all: ['teachers'] as const,
  list: (params: ListTeachersParams) => ['teachers', 'list', params] as const,
  detail: (id: string) => ['teachers', 'detail', id] as const,
};

export const useTeachers = (params: ListTeachersParams) =>
  useQuery({ queryKey: keys.list(params), queryFn: () => teachersApi.list(params) });

/** Lightweight options list (active teachers) for assignment selects. */
export const useTeacherOptions = () =>
  useQuery({
    queryKey: keys.list({ limit: 100, status: 'ACTIVE' }),
    queryFn: () => teachersApi.list({ limit: 100, status: 'ACTIVE' }),
    select: (data) => data.items,
  });

export const useTeacher = (id: string) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => teachersApi.getById(id), enabled: !!id });

export const useCreateTeacher = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeacherPayload) => teachersApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useUpdateTeacher = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTeacherPayload) => teachersApi.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.detail(id) });
      void qc.invalidateQueries({ queryKey: keys.all });
    },
  });
};

export const useSetTeacherStatus = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: StaffStatus) => teachersApi.setStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.detail(id) });
      void qc.invalidateQueries({ queryKey: keys.all });
    },
  });
};

export const useDeleteTeacher = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teachersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};
