import type { PaginationMeta } from '@/features/schools/schools.types';

export type NotificationType =
  | 'GENERAL'
  | 'ANNOUNCEMENT'
  | 'EVENT'
  | 'BEHAVIOR'
  | 'ATTENDANCE'
  | 'FEE';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unread?: boolean;
}

export type { PaginationMeta };
