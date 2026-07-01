import { api } from '@/lib/axios';
import type {
  CreateEventPayload,
  ListEventsParams,
  PaginationMeta,
  SchoolEvent,
} from './events.types';

export const eventsApi = {
  async calendar(): Promise<SchoolEvent[]> {
    const { data } = await api.get<{ data: SchoolEvent[] }>('/events/calendar');
    return data.data;
  },
  async list(params: ListEventsParams): Promise<{ items: SchoolEvent[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: SchoolEvent[]; meta: PaginationMeta }>('/events', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async create(payload: CreateEventPayload): Promise<SchoolEvent> {
    const { data } = await api.post<{ data: { event: SchoolEvent } }>('/events', payload);
    return data.data.event;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },
};
