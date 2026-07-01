import type { PaginationMeta } from '@/features/schools/schools.types';

export type CertificateType = 'BONAFIDE' | 'CHARACTER' | 'TRANSFER' | 'LEAVING';

export const CERTIFICATE_TYPES: CertificateType[] = ['BONAFIDE', 'CHARACTER', 'TRANSFER', 'LEAVING'];

interface StudentRef {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

export interface Certificate {
  id: string;
  type: CertificateType;
  serialNo: string;
  verificationCode: string;
  title: string;
  body: string;
  issueDate: string;
  student: StudentRef;
}

export interface CreateCertificatePayload {
  studentId: string;
  type: CertificateType;
  title?: string;
  body?: string;
}

export interface ListCertificatesParams {
  page?: number;
  limit?: number;
  search?: string;
  studentId?: string;
  type?: CertificateType;
}

export interface VerifyResult {
  valid: boolean;
  certificate?: {
    serialNo: string;
    type: CertificateType;
    title: string;
    issueDate: string;
    studentName: string;
    schoolName: string;
  };
}

export type { PaginationMeta };
