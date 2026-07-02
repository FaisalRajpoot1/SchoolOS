import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { admissionsApi } from './admissions.api';
import type { ListAdmissionsParams } from './admissions.types';

const KEY = ['admissions'] as const;

export const useAdmissions = (params: ListAdmissionsParams) =>
  useQuery({ queryKey: [...KEY, params], queryFn: () => admissionsApi.list(params) });

export const useSetAdmissionStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => admissionsApi.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useConvertAdmission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => admissionsApi.convert(id, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useDeleteAdmission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => admissionsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
