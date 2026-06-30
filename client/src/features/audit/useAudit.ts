import { useQuery } from '@tanstack/react-query';
import { auditApi, type ListAuditLogsParams } from './audit.api';

export const useAuditLogs = (params: ListAuditLogsParams) =>
  useQuery({ queryKey: ['audit-logs', params], queryFn: () => auditApi.list(params) });
