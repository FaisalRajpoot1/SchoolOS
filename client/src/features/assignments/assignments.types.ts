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

export interface AssignmentCriterion {
  id: string;
  label: string;
  maxPoints: number;
  sortOrder: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  attachmentUrl: string | null;
  maxMarks: number;
  dueDate: string;
  class: NamedRef;
  section: NamedRef;
  subject: { id: string; name: string; code: string } | null;
  teacher: { id: string; firstName: string; lastName: string } | null;
  criteria: AssignmentCriterion[];
  _count: { submissions: number };
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string | null;
  attachmentUrl: string | null;
  submittedAt: string;
  isLate: boolean;
  marks: number | null;
  feedback: string | null;
  gradedAt: string | null;
}

export interface SubmissionsRoster {
  maxMarks: number;
  dueDate: string;
  entries: { student: StudentRef; submission: AssignmentSubmission | null }[];
}

export interface CreateAssignmentCriterion {
  label: string;
  maxPoints: number;
}

export interface CreateAssignmentPayload {
  classId: string;
  sectionId: string;
  subjectId?: string;
  title: string;
  description?: string;
  instructions?: string;
  attachmentUrl?: string;
  maxMarks: number;
  dueDate: string;
  criteria?: CreateAssignmentCriterion[];
}

export interface GradeSubmissionPayload {
  marks?: number | null;
  feedback?: string;
}

export interface ListAssignmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
}

export type { PaginationMeta };
