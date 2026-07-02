import { api } from '@/lib/axios';
import type { AttendanceSummary, BulkMarkPayload, RosterEntry } from './attendance.types';

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

  async summary(sectionId: string, month: number, year: number): Promise<AttendanceSummary> {
    const { data } = await api.get<{ data: AttendanceSummary }>('/attendance/summary', {
      params: { sectionId, month, year },
    });
    return data.data;
  },
};
