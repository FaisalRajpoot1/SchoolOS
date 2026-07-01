import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiKeysApi } from './apiKeys.api';

const KEY = ['settings', 'api-keys'] as const;

export const useApiKeys = () => useQuery({ queryKey: KEY, queryFn: apiKeysApi.list });

export const useCreateApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiKeysApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useDeleteApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
