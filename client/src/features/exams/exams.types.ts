import type { PaginationMeta } from '@/features/schools/schools.types';

export type ExamStatus = 'DRAFT' | 'PUBLISHED';

interface NamedRef {
  id: string;
  name: string;
}

interface StudentRef {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

export interface ExamListItem {
  id: string;
  name: string;
  status: ExamStatus;
  startDate: string | null;
  endDate: string | null;
  class: NamedRef;
  _count: { examSubjects: number };
}

export interface ExamSubject {
  id: string;
  maxMarks: number;
  passMarks: number;
  examDate: string | null;
  subject: { id: string; name: string; code: string };
  _count: { marks: number };
}

export interface ExamDetail {
  id: string;
  name: string;
  status: ExamStatus;
  startDate: string | null;
  endDate: string | null;
  class: NamedRef;
  academicYear: NamedRef | null;
  examSubjects: ExamSubject[];
}

export interface CreateExamPayload {
  name: string;
  classId: string;
  academicYearId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateExamSubjectPayload {
  maxMarks?: number;
  passMarks?: number;
  examDate?: string | null;
}

export interface MarkEntry {
  student: StudentRef;
  marksObtained: number | null;
  isAbsent: boolean;
  remark: string | null;
}

export interface MarksRoster {
  maxMarks: number;
  passMarks: number;
  entries: MarkEntry[];
}

export interface BulkMarkRecord {
  studentId: string;
  marksObtained?: number | null;
  isAbsent?: boolean;
  remark?: string | null;
}

export interface ExamResultRow {
  student: StudentRef;
  obtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  passed: boolean;
  rank: number;
}

export interface ExamResults {
  exam: { id: string; name: string; status: ExamStatus };
  totalMax: number;
  subjectCount: number;
  results: ExamResultRow[];
}

export interface ListExamsParams {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  status?: ExamStatus;
}

export type { PaginationMeta };
