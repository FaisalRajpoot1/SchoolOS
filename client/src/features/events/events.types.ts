import type { PaginationMeta } from '@/features/schools/schools.types';

export type EventType = 'GENERAL' | 'HOLIDAY' | 'EXAM' | 'PTM' | 'COMPETITION' | 'SPORTS';
export type EventAudience = 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | 'STAFF';

export const EVENT_TYPES: EventType[] = ['GENERAL', 'HOLIDAY', 'EXAM', 'PTM', 'COMPETITION', 'SPORTS'];
export const EVENT_AUDIENCES: EventAudience[] = ['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS', 'STAFF'];

export interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  audience: EventAudience;
  location: string | null;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  type: EventType;
  audience: EventAudience;
  location?: string;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
}

export interface ListEventsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: EventType;
}

export type { PaginationMeta };
