import { api } from '@/lib/axios';
import type {
  Announcement,
  CreateAnnouncementPayload,
  ListAnnouncementsParams,
  PaginationMeta,
} from './announcements.types';

export const announcementsApi = {
  async feed(): Promise<Announcement[]> {
    const { data } = await api.get<{ data: Announcement[] }>('/announcements/feed');
    return data.data;
  },
  async list(params: ListAnnouncementsParams): Promise<{ items: Announcement[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: Announcement[]; meta: PaginationMeta }>('/announcements', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async create(payload: CreateAnnouncementPayload): Promise<Announcement> {
    const { data } = await api.post<{ data: { announcement: Announcement } }>('/announcements', payload);
    return data.data.announcement;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/announcements/${id}`);
  },
};
