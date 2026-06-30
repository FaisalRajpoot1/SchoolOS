export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  classId: string;
  name: string;
  capacity: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassListItem {
  id: string;
  name: string;
  level: number | null;
  _count: { sections: number; classSubjects: number };
}

export interface ClassSubjectLink {
  id: string;
  subject: Subject;
}

export interface ClassDetail {
  id: string;
  name: string;
  level: number | null;
  sections: Section[];
  classSubjects: ClassSubjectLink[];
}

export interface CreateSubjectPayload {
  name: string;
  code: string;
}

export interface CreateClassPayload {
  name: string;
  level?: number;
}

export interface CreateSectionPayload {
  name: string;
  capacity?: number;
}
