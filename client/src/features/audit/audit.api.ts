import { api } from '@/lib/axios';
import type { PaginationMeta } from '@/features/schools/schools.types';

export interface AuditLog {
  id: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
}

export const auditApi = {
  async list(params: ListAuditLogsParams): Promise<{ items: AuditLog[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: AuditLog[]; meta: PaginationMeta }>('/audit-logs', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
};
