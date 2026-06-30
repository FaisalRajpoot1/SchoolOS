import type { PaginationMeta } from '@/features/schools/schools.types';

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

export interface Homework {
  id: string;
  title: string;
  description: string | null;
  attachmentUrl: string | null;
  dueDate: string;
  class: NamedRef;
  section: NamedRef;
  subject: { id: string; name: string; code: string } | null;
  teacher: { id: string; firstName: string; lastName: string } | null;
  _count: { submissions: number };
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  content: string | null;
  attachmentUrl: string | null;
  submittedAt: string;
  isLate: boolean;
  feedback: string | null;
  marks: number | null;
  gradedAt: string | null;
}

export interface SubmissionsRoster {
  dueDate: string;
  entries: { student: StudentRef; submission: HomeworkSubmission | null }[];
}

export interface CreateHomeworkPayload {
  classId: string;
  sectionId: string;
  subjectId?: string;
  title: string;
  description?: string;
  attachmentUrl?: string;
  dueDate: string;
}

export interface RecordSubmissionPayload {
  content?: string;
  attachmentUrl?: string;
  submittedAt?: string;
}

export interface GradeSubmissionPayload {
  feedback?: string;
  marks?: number | null;
}

export interface ListHomeworkParams {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
}

export type { PaginationMeta };
