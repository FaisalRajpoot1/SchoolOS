import type { PaginationMeta } from '@/features/schools/schools.types';

export type AnnouncementAudience = 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | 'STAFF';

export const AUDIENCES: AnnouncementAudience[] = ['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS', 'STAFF'];

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  pinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
  author: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  pinned?: boolean;
  expiresAt?: string;
}

export interface ListAnnouncementsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export type { PaginationMeta };
