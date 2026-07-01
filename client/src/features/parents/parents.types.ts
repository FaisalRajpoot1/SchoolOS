import type { PaginationMeta } from '@/features/schools/schools.types';

interface NamedRef {
  id: string;
  name: string;
}

export interface ChildStudent {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  class: NamedRef | null;
  section: NamedRef | null;
}

export interface ParentChildLink {
  id: string;
  relation: string | null;
  student: ChildStudent;
}

export interface ParentListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  _count: { children: number };
}

export interface ParentDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  occupation: string | null;
  address: string | null;
  user: { id: string; email: string; isActive: boolean } | null;
  children: ParentChildLink[];
}

export interface CreateParentPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  occupation?: string;
  studentIds?: string[];
}

export interface ListParentsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export type { PaginationMeta };
