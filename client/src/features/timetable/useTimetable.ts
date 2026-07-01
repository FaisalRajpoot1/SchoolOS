import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timetableApi, type TimetableQuery } from './timetable.api';
import type { CreateSlotPayload } from './timetable.types';

export const useTimetable = (params: TimetableQuery, enabled: boolean) =>
  useQuery({
    queryKey: ['timetable', params],
    queryFn: () => timetableApi.list(params),
    enabled,
  });

export const useCreateSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSlotPayload) => timetableApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }),
  });
};

export const useDeleteSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timetableApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }),
  });
};
