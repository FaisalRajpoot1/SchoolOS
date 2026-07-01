import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from './events.api';
import type { CreateEventPayload, ListEventsParams } from './events.types';

const keys = {
  calendar: ['events', 'calendar'] as const,
  list: (params: ListEventsParams) => ['events', 'list', params] as const,
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
