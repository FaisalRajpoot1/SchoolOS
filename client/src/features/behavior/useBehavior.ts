import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { behaviorApi } from './behavior.api';
import type { CreateBehaviorPayload, ListBehaviorParams } from './behavior.types';

const KEY = ['behavior'] as const;

export const useBehaviorList = (params: ListBehaviorParams) =>
  useQuery({ queryKey: [...KEY, params], queryFn: () => behaviorApi.list(params) });

export const useCreateBehavior = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBehaviorPayload) => behaviorApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useDeleteBehavior = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => behaviorApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
