import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from './notifications.api';
import type { ListNotificationsParams } from './notifications.types';

const KEY = ['notifications'] as const;
const UNREAD_KEY = ['notifications', 'unread-count'] as const;

export const useNotifications = (params: ListNotificationsParams) =>
  useQuery({ queryKey: [...KEY, 'list', params], queryFn: () => notificationsApi.list(params) });

/** Unread badge count; polls periodically so it stays roughly live. */
export const useUnreadCount = (enabled = true) =>
  useQuery({
    queryKey: UNREAD_KEY,
    queryFn: () => notificationsApi.unreadCount(),
    enabled,
    refetchInterval: 60_000,
  });

const invalidateAll = (qc: ReturnType<typeof useQueryClient>): void => {
  void qc.invalidateQueries({ queryKey: KEY });
};

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => invalidateAll(qc),
  });
};
