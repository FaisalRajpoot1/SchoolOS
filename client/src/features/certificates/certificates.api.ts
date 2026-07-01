import { api } from '@/lib/axios';
import type {
  Certificate,
  CreateCertificatePayload,
  ListCertificatesParams,
  PaginationMeta,
  VerifyResult,
} from './certificates.types';

export const certificatesApi = {
  async list(params: ListCertificatesParams): Promise<{ items: Certificate[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: Certificate[]; meta: PaginationMeta }>('/certificates', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async getById(id: string): Promise<Certificate> {
    const { data } = await api.get<{ data: { certificate: Certificate } }>(`/certificates/${id}`);
    return data.data.certificate;
  },
  async issue(payload: CreateCertificatePayload): Promise<Certificate> {
    const { data } = await api.post<{ data: { certificate: Certificate } }>('/certificates', payload);
    return data.data.certificate;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/certificates/${id}`);
  },
  async verify(code: string): Promise<VerifyResult> {
    const { data } = await api.get<{ data: VerifyResult }>(`/certificates/verify/${code}`);
    return data.data;
  },
};
