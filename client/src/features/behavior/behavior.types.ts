import type { PaginationMeta } from '@/features/schools/schools.types';

export type BehaviorType = 'MERIT' | 'DEMERIT' | 'INCIDENT';

export const BEHAVIOR_TYPES: BehaviorType[] = ['MERIT', 'DEMERIT', 'INCIDENT'];

export interface BehaviorRecord {
  id: string;
  type: BehaviorType;
  title: string;
  description: string | null;
  points: number;
  occurredOn: string;
  createdAt: string;
  student: { id: string; firstName: string; lastName: string; admissionNo: string };
  recordedBy: { id: string; firstName: string; lastName: string } | null;
}

export interface BehaviorSummary {
  merits: number;
  demerits: number;
  incidents: number;
  total: number;
  netPoints: number;
}

export interface CreateBehaviorPayload {
  studentId: string;
  type: BehaviorType;
  title: string;
  description?: string;
  points?: number;
  occurredOn?: string;
}

export interface ListBehaviorParams {
  page?: number;
  limit?: number;
  studentId?: string;
  type?: BehaviorType;
}

export type { PaginationMeta };
