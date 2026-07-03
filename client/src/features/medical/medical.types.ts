import type { PaginationMeta } from '@/features/schools/schools.types';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export type VisitOutcome = 'RESOLVED' | 'SENT_HOME' | 'REFERRED' | 'MONITORING';
export const VISIT_OUTCOMES: VisitOutcome[] = ['RESOLVED', 'SENT_HOME', 'REFERRED', 'MONITORING'];

export interface MedicalProfile {
  id: string;
  bloodGroup: string | null;
  heightCm: number | null;
  weightKg: number | null;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  notes: string | null;
  bmi: number | null;
}

export interface UpsertProfilePayload {
  bloodGroup?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  allergies?: string | null;
  conditions?: string | null;
  medications?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
}

export interface InfirmaryVisit {
  id: string;
  reason: string;
  treatment: string | null;
  temperatureC: number | null;
  outcome: VisitOutcome;
  visitedOn: string;
  student: { id: string; firstName: string; lastName: string; admissionNo: string };
  recordedBy: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateVisitPayload {
  studentId: string;
  reason: string;
  treatment?: string;
  temperatureC?: number;
  outcome: VisitOutcome;
  visitedOn?: string;
}

export interface ListVisitsParams {
  page?: number;
  limit?: number;
  studentId?: string;
  outcome?: VisitOutcome;
}

export type { PaginationMeta };
