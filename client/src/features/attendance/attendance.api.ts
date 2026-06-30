import { api } from '@/lib/axios';
import type { BulkMarkPayload, RosterEntry } from './attendance.types';

export const attendanceApi = {
  async roster(sectionId: string, date: string): Promise<RosterEntry[]> {
    const { data } = await api.get<{ data: RosterEntry[] }>('/attendance', {
      params: { sectionId, date },
    });
    return data.data;
  },

  async bulkMark(payload: BulkMarkPayload): Promise<RosterEntry[]> {
    const { data } = await api.post<{ data: RosterEntry[] }>('/attendance', payload);
    return data.data;
  },
};
