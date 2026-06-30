import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { classesApi, subjectsApi } from './academics.api';
import type {
  CreateClassPayload,
  CreateSectionPayload,
  CreateSubjectPayload,
} from './academics.types';

const subjectKeys = { all: ['subjects'] as const };
const classKeys = {
  all: ['classes'] as const,
  detail: (id: string) => ['classes', 'detail', id] as const,
};

// ---- Subjects ----
export const useSubjects = () =>
  useQuery({ queryKey: subjectKeys.all, queryFn: subjectsApi.list });

export const useCreateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubjectPayload) => subjectsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: subjectKeys.all }),
  });
};

export const useDeleteSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: subjectKeys.all }),
  });
};

// ---- Classes ----
export const useClasses = () => useQuery({ queryKey: classKeys.all, queryFn: classesApi.list });

export const useClass = (classId: string) =>
  useQuery({ queryKey: classKeys.detail(classId), queryFn: () => classesApi.getById(classId) });

export const useCreateClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassPayload) => classesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.all }),
  });
};

export const useDeleteClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.all }),
  });
};

export const useCreateSection = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSectionPayload) => classesApi.createSection(classId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.detail(classId) }),
  });
};

export const useDeleteSection = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: string) => classesApi.removeSection(classId, sectionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.detail(classId) }),
  });
};

export const useSetClassSubjects = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subjectIds: string[]) => classesApi.setSubjects(classId, subjectIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: classKeys.detail(classId) });
      void qc.invalidateQueries({ queryKey: classKeys.all });
    },
  });
};

export const useSetClassTeacher = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, teacherId }: { sectionId: string; teacherId: string | null }) =>
      classesApi.setClassTeacher(classId, sectionId, teacherId),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.detail(classId) }),
  });
};

export const useSetSubjectTeacher = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, teacherId }: { subjectId: string; teacherId: string | null }) =>
      classesApi.setSubjectTeacher(classId, subjectId, teacherId),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.detail(classId) }),
  });
};
