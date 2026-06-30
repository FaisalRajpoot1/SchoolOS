import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { academicYearsApi } from './academicYears.api';
import type { CreateAcademicYearPayload } from './academicYears.types';

const KEY = ['academic-years'] as const;

export const useAcademicYears = () =>
  useQuery({ queryKey: KEY, queryFn: academicYearsApi.list });

export const useCreateAcademicYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAcademicYearPayload) => academicYearsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useSetCurrentAcademicYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicYearsApi.setCurrent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useDeleteAcademicYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicYearsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
