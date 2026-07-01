import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { announcementsApi } from './announcements.api';
import type { CreateAnnouncementPayload, ListAnnouncementsParams } from './announcements.types';

const keys = {
  feed: ['announcements', 'feed'] as const,
  list: (params: ListAnnouncementsParams) => ['announcements', 'list', params] as const,
};

export const useAnnouncementsFeed = () =>
  useQuery({ queryKey: keys.feed, queryFn: announcementsApi.feed });

export const useAnnouncementsList = (params: ListAnnouncementsParams) =>
  useQuery({ queryKey: keys.list(params), queryFn: () => announcementsApi.list(params) });

export const useCreateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) => announcementsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
};

export const useDeleteAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
};
