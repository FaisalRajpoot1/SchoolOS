import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from './attendance.api';
import type { BulkMarkPayload } from './attendance.types';

const keys = {
  roster: (sectionId: string, date: string) => ['attendance', 'roster', sectionId, date] as const,
};

export const useRoster = (sectionId: string, date: string) =>
  useQuery({
    queryKey: keys.roster(sectionId, date),
    queryFn: () => attendanceApi.roster(sectionId, date),
    enabled: !!sectionId && !!date,
  });

export const useBulkMarkAttendance = (sectionId: string, date: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkMarkPayload) => attendanceApi.bulkMark(payload),
    onSuccess: (data) => qc.setQueryData(keys.roster(sectionId, date), data),
  });
};
