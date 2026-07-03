import { api } from '@/lib/axios';
import type { AppNotification, ListNotificationsParams, PaginationMeta } from './notifications.types';

export const notificationsApi = {
  async list(
    params: ListNotificationsParams,
  ): Promise<{ items: AppNotification[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: AppNotification[]; meta: PaginationMeta }>(
      '/notifications',
      { params },
    );
    return { items: data.data, meta: data.meta };
  },
  async unreadCount(): Promise<number> {
    const { data } = await api.get<{ data: { count: number } }>('/notifications/unread-count');
    return data.data.count;
  },
  async markRead(id: string): Promise<void> {
    await api.post(`/notifications/${id}/read`);
  },
  async markAllRead(): Promise<number> {
    const { data } = await api.post<{ data: { updated: number } }>('/notifications/read-all');
    return data.data.updated;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};
