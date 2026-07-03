import type { PaginationMeta } from '@/features/schools/schools.types';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'ALUMNI';

export const STUDENT_STATUSES: StudentStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'GRADUATED',
  'TRANSFERRED',
  'ALUMNI',
];

interface NamedRef {
  id: string;
  name: string;
}

export interface Guardian {
  id: string;
  studentId: string;
  relation: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  occupation: string | null;
  address: string | null;
  isPrimary: boolean;
}

export interface StudentListItem {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  status: StudentStatus;
  class: NamedRef | null;
  section: NamedRef | null;
  photoKey: string | null;
  _count: { guardians: number };
}

export interface StudentDetail {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: Gender | null;
  dateOfBirth: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: StudentStatus;
  admissionDate: string;
  photoKey: string | null;
  class: NamedRef | null;
  section: NamedRef | null;
  guardians: Guardian[];
}

export interface GuardianPayload {
  relation: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  occupation?: string;
  address?: string;
  isPrimary?: boolean;
}

export interface CreateStudentPayload {
  admissionNo?: string;
  firstName: string;
  lastName: string;
  gender?: Gender;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  classId?: string;
  sectionId?: string;
  guardians?: GuardianPayload[];
}

export interface UpdateStudentPayload {
  firstName?: string;
  lastName?: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  classId?: string | null;
  sectionId?: string | null;
}

export interface ListStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  sectionId?: string;
  status?: StudentStatus;
}

export type { PaginationMeta };
