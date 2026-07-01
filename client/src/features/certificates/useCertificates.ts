import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { certificatesApi } from './certificates.api';
import type { CreateCertificatePayload, ListCertificatesParams } from './certificates.types';

const keys = {
  all: ['certificates'] as const,
  list: (params: ListCertificatesParams) => ['certificates', 'list', params] as const,
  detail: (id: string) => ['certificates', 'detail', id] as const,
};

export const useCertificates = (params: ListCertificatesParams) =>
  useQuery({ queryKey: keys.list(params), queryFn: () => certificatesApi.list(params) });

export const useCertificate = (id: string) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => certificatesApi.getById(id), enabled: !!id });

export const useIssueCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCertificatePayload) => certificatesApi.issue(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useDeleteCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => certificatesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useVerifyCertificate = (code: string) =>
  useQuery({
    queryKey: ['certificates', 'verify', code],
    queryFn: () => certificatesApi.verify(code),
    enabled: !!code,
    retry: false,
  });
