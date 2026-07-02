import { api } from '@/lib/axios';
import type {
  CreateStudentPayload,
  Guardian,
  GuardianPayload,
  ListStudentsParams,
  PaginationMeta,
  StudentDetail,
  StudentListItem,
  StudentStatus,
  UpdateStudentPayload,
} from './students.types';

export const studentsApi = {
  async list(
    params: ListStudentsParams,
  ): Promise<{ items: StudentListItem[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: StudentListItem[]; meta: PaginationMeta }>('/students', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<StudentDetail> {
    const { data } = await api.get<{ data: { student: StudentDetail } }>(`/students/${id}`);
    return data.data.student;
  },

  async create(payload: CreateStudentPayload): Promise<StudentDetail> {
    const { data } = await api.post<{ data: { student: StudentDetail } }>('/students', payload);
    return data.data.student;
  },

  async update(id: string, payload: UpdateStudentPayload): Promise<StudentDetail> {
    const { data } = await api.patch<{ data: { student: StudentDetail } }>(
      `/students/${id}`,
      payload,
    );
    return data.data.student;
  },

  async setStatus(id: string, status: StudentStatus): Promise<void> {
    await api.patch(`/students/${id}/status`, { status });
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  },

  async addGuardian(studentId: string, payload: GuardianPayload): Promise<Guardian> {
    const { data } = await api.post<{ data: { guardian: Guardian } }>(
      `/students/${studentId}/guardians`,
      payload,
    );
    return data.data.guardian;
  },

  async removeGuardian(studentId: string, guardianId: string): Promise<void> {
    await api.delete(`/students/${studentId}/guardians/${guardianId}`);
  },

  async setPortalAccess(
    studentId: string,
    payload: { email: string; password: string },
  ): Promise<{ email: string }> {
    const { data } = await api.post<{ data: { email: string } }>(
      `/students/${studentId}/portal-access`,
      payload,
    );
    return data.data;
  },

  async bulkImport(rows: ImportRow[], dryRun: boolean): Promise<BulkImportResult> {
    const { data } = await api.post<{ data: BulkImportResult }>('/students/bulk-import', {
      rows,
      dryRun,
    });
    return data.data;
  },

  async promote(payload: {
    fromClassId: string;
    toClassId?: string;
    toSectionId?: string;
    graduate?: boolean;
  }): Promise<{ moved: number; graduated: boolean }> {
    const { data } = await api.post<{ data: { moved: number; graduated: boolean } }>(
      '/students/promote',
      payload,
    );
    return data.data;
  },
};

export interface ImportRow {
  firstName: string;
  lastName: string;
  admissionNo?: string;
  gender?: string;
  email?: string;
  phone?: string;
  className?: string;
  sectionName?: string;
}

export interface BulkImportResult {
  dryRun: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results: { index: number; admissionNo: string | null; ok: boolean; error: string | null }[];
}
