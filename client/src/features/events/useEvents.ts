import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from './events.api';
import type { CreateEventPayload, ListEventsParams, RsvpStatus } from './events.types';

const keys = {
  calendar: ['events', 'calendar'] as const,
  list: (params: ListEventsParams) => ['events', 'list', params] as const,
  rsvp: (id: string) => ['events', 'rsvp', id] as const,
};

export const useCalendar = () =>
  useQuery({ queryKey: keys.calendar, queryFn: eventsApi.calendar });

export const useEventsList = (params: ListEventsParams) =>
  useQuery({ queryKey: keys.list(params), queryFn: () => eventsApi.list(params) });

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => eventsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
};

export const useEventRsvp = (id: string, enabled = true) =>
  useQuery({ queryKey: keys.rsvp(id), queryFn: () => eventsApi.getRsvp(id), enabled });

export const useSetRsvp = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: RsvpStatus | null) =>
      status === null ? eventsApi.removeRsvp(id) : eventsApi.setRsvp(id, status),
    // The endpoints return the fresh summary; seed the cache to avoid a refetch.
    onSuccess: (summary) => qc.setQueryData(keys.rsvp(id), summary),
  });
};
