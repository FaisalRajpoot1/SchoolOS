import { api } from '@/lib/axios';
import { downloadFile } from '@/lib/download';
import type { CreateSlotPayload, TeacherWorkload, TimetableSlot } from './timetable.types';

export interface TimetableQuery {
  sectionId?: string;
  teacherId?: string;
}

export const timetableApi = {
  async list(params: TimetableQuery): Promise<TimetableSlot[]> {
    const { data } = await api.get<{ data: TimetableSlot[] }>('/timetable/slots', { params });
    return data.data;
  },
  async create(payload: CreateSlotPayload): Promise<TimetableSlot> {
    const { data } = await api.post<{ data: { slot: TimetableSlot } }>('/timetable/slots', payload);
    return data.data.slot;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/timetable/slots/${id}`);
  },
  async workload(): Promise<TeacherWorkload[]> {
    const { data } = await api.get<{ data: TeacherWorkload[] }>('/timetable/workload');
    return data.data;
  },
  async exportPdf(params: TimetableQuery): Promise<void> {
    const key = params.sectionId ? `section-${params.sectionId}` : `teacher-${params.teacherId}`;
    await downloadFile(buildQueryUrl('/timetable/slots/export', params), `timetable-${key}.pdf`);
  },
};

const buildQueryUrl = (path: string, params: TimetableQuery): string => {
  const search = new URLSearchParams();
  if (params.sectionId) search.set('sectionId', params.sectionId);
  if (params.teacherId) search.set('teacherId', params.teacherId);
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
};
