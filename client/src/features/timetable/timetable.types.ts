export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface NamedRef {
  id: string;
  name: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  room: string | null;
  subject: { id: string; name: string; code: string } | null;
  teacher: { id: string; firstName: string; lastName: string } | null;
  section: { id: string; name: string; class: NamedRef };
}

export interface TeacherWorkload {
  teacherId: string;
  name: string;
  employeeNo: string;
  periods: number;
  minutes: number;
  subjects: number;
  sections: number;
}

export interface CreateSlotPayload {
  sectionId: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  subjectId?: string;
  teacherId?: string;
  room?: string;
}
