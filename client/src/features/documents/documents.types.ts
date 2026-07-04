import type { PaginationMeta } from '@/features/schools/schools.types';

export type DocumentCategory =
  | 'GENERAL'
  | 'ID_PROOF'
  | 'CERTIFICATE'
  | 'REPORT'
  | 'MEDICAL'
  | 'CONTRACT'
  | 'OTHER';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'GENERAL',
  'ID_PROOF',
  'CERTIFICATE',
  'REPORT',
  'MEDICAL',
  'CONTRACT',
  'OTHER',
];

export interface DocumentItem {
  id: string;
  title: string;
  category: DocumentCategory;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  student: { id: string; firstName: string; lastName: string; admissionNo: string } | null;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
  teacher: { id: string; firstName: string; lastName: string; employeeNo: string } | null;
  uploadedBy: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateDocumentPayload {
  file: File;
  title: string;
  category: DocumentCategory;
  studentId?: string;
  employeeId?: string;
  teacherId?: string;
}

export interface ListDocumentsParams {
  page?: number;
  limit?: number;
  studentId?: string;
  employeeId?: string;
  teacherId?: string;
  category?: DocumentCategory;
}

export type { PaginationMeta };
