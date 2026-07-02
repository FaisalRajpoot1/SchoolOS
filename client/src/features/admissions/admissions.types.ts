import type { PaginationMeta } from '@/features/schools/schools.types';

export type AdmissionStatus = 'SUBMITTED' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';

export const ADMISSION_STATUSES: AdmissionStatus[] = [
  'SUBMITTED',
  'REVIEWING',
  'ACCEPTED',
  'REJECTED',
  'CONVERTED',
];

export interface Application {
  id: string;
  applicantFirstName: string;
  applicantLastName: string;
  gender: string | null;
  dateOfBirth: string | null;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string | null;
  desiredClass: string | null;
  message: string | null;
  status: AdmissionStatus;
  createdAt: string;
  student: { id: string; firstName: string; lastName: string; admissionNo: string } | null;
}

export interface ApplyPayload {
  schoolId: string;
  applicantFirstName: string;
  applicantLastName: string;
  gender?: string;
  dateOfBirth?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  desiredClass?: string;
  message?: string;
}

export interface ListAdmissionsParams {
  page?: number;
  limit?: number;
  status?: AdmissionStatus;
}

export type { PaginationMeta };
