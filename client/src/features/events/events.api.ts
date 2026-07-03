import { api } from '@/lib/axios';
import { downloadFile } from '@/lib/download';
import type {
  CreateEventPayload,
  ListEventsParams,
  PaginationMeta,
  RsvpStatus,
  RsvpSummary,
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
  async downloadIcs(id: string): Promise<void> {
    await downloadFile(`/events/${id}/ics`, `event-${id}.ics`);
  },
  async getRsvp(id: string): Promise<RsvpSummary> {
    const { data } = await api.get<{ data: RsvpSummary }>(`/events/${id}/rsvp`);
    return data.data;
  },
  async setRsvp(id: string, status: RsvpStatus): Promise<RsvpSummary> {
    const { data } = await api.put<{ data: RsvpSummary }>(`/events/${id}/rsvp`, { status });
    return data.data;
  },
  async removeRsvp(id: string): Promise<RsvpSummary> {
    const { data } = await api.delete<{ data: RsvpSummary }>(`/events/${id}/rsvp`);
    return data.data;
  },
};
