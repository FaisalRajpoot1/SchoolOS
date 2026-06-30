import { api } from '@/lib/axios';
import type {
  ClassDetail,
  ClassListItem,
  CreateClassPayload,
  CreateSectionPayload,
  CreateSubjectPayload,
  Section,
  Subject,
} from './academics.types';

const unwrap = <T>(data: { data: T }): T => data.data;

export const subjectsApi = {
  async list(): Promise<Subject[]> {
    const { data } = await api.get<{ data: Subject[] }>('/subjects');
    return data.data;
  },
  async create(payload: CreateSubjectPayload): Promise<Subject> {
    const { data } = await api.post<{ data: { subject: Subject } }>('/subjects', payload);
    return data.data.subject;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/subjects/${id}`);
  },
};

export const classesApi = {
  async list(): Promise<ClassListItem[]> {
    const { data } = await api.get<{ data: ClassListItem[] }>('/classes');
    return unwrap(data);
  },
  async getById(classId: string): Promise<ClassDetail> {
    const { data } = await api.get<{ data: { class: ClassDetail } }>(`/classes/${classId}`);
    return data.data.class;
  },
  async create(payload: CreateClassPayload): Promise<void> {
    await api.post('/classes', payload);
  },
  async remove(classId: string): Promise<void> {
    await api.delete(`/classes/${classId}`);
  },

  async createSection(classId: string, payload: CreateSectionPayload): Promise<Section> {
    const { data } = await api.post<{ data: { section: Section } }>(
      `/classes/${classId}/sections`,
      payload,
    );
    return data.data.section;
  },
  async removeSection(classId: string, sectionId: string): Promise<void> {
    await api.delete(`/classes/${classId}/sections/${sectionId}`);
  },

  async setClassTeacher(
    classId: string,
    sectionId: string,
    classTeacherId: string | null,
  ): Promise<void> {
    await api.patch(`/classes/${classId}/sections/${sectionId}`, { classTeacherId });
  },

  async setSubjectTeacher(
    classId: string,
    subjectId: string,
    teacherId: string | null,
  ): Promise<void> {
    await api.put(`/classes/${classId}/subjects/${subjectId}/teacher`, { teacherId });
  },

  async setSubjects(classId: string, subjectIds: string[]): Promise<Subject[]> {
    const { data } = await api.put<{ data: Subject[] }>(`/classes/${classId}/subjects`, {
      subjectIds,
    });
    return unwrap(data);
  },
};
