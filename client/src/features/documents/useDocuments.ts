import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from './documents.api';
import type { CreateDocumentPayload, ListDocumentsParams } from './documents.types';

const KEY = ['documents'] as const;

export const useDocuments = (params: ListDocumentsParams) =>
  useQuery({ queryKey: [...KEY, params], queryFn: () => documentsApi.list(params) });

export const useUploadDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDocumentPayload) => documentsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useDeleteDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
