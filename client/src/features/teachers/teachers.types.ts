import type { PaginationMeta } from '@/features/schools/schools.types';
import type { Gender } from '@/features/students/students.types';

export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';

export const STAFF_STATUSES: StaffStatus[] = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'];

interface NamedRef {
  id: string;
  name: string;
}

export interface TeacherListItem {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  status: StaffStatus;
  _count: { classSections: number; subjectAssignments: number };
}

export interface TeacherDetail {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  qualification: string | null;
  experienceYears: number | null;
  salary: number | null;
  joiningDate: string;
  status: StaffStatus;
  user: { id: string; email: string; isActive: boolean } | null;
  classSections: { id: string; name: string; class: NamedRef }[];
  subjectAssignments: {
    id: string;
    class: NamedRef;
    subject: { id: string; name: string; code: string };
  }[];
}

export interface CreateTeacherPayload {
  employeeNo?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  qualification?: string;
  experienceYears?: number;
  salary?: number;
  joiningDate?: string;
}

export interface UpdateTeacherPayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  qualification?: string | null;
  experienceYears?: number | null;
  salary?: number | null;
  joiningDate?: string;
}

export interface ListTeachersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: StaffStatus;
}

export type { PaginationMeta };
