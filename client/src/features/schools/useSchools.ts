import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { schoolsApi } from './schools.api';
import type { ListSchoolsParams, UpdateSchoolPayload } from './schools.types';

const keys = {
  all: ['schools'] as const,
  list: (params: ListSchoolsParams) => [...keys.all, 'list', params] as const,
  detail: (id: string) => [...keys.all, 'detail', id] as const,
  mine: [...['schools'], 'mine'] as const,
};

// ---- Platform (SUPER_ADMIN) ----
export const useSchoolsList = (params: ListSchoolsParams) =>
  useQuery({ queryKey: keys.list(params), queryFn: () => schoolsApi.list(params) });

export const useCreateSchool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: schoolsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useSetSchoolStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      schoolsApi.setStatus(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

// ---- Tenant self-service (SCHOOL_ADMIN) ----
export const useMySchool = () =>
  useQuery({ queryKey: keys.mine, queryFn: schoolsApi.getMine });

export const useUpdateMySchool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSchoolPayload) => schoolsApi.updateMine(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.mine }),
  });
};
