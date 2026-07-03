import { api } from '@/lib/axios';

/** Uploads a multipart image, unsetting the instance's default JSON content-type. */
const postImage = async (url: string, file: File): Promise<void> => {
  const form = new FormData();
  form.append('file', file);
  await api.post(url, form, { headers: { 'Content-Type': undefined } });
};

export const photosApi = {
  studentPhotoUrl: (studentId: string): string => `/students/${studentId}/photo`,
  teacherPhotoUrl: (teacherId: string): string => `/teachers/${teacherId}/photo`,
  logoUrl: (): string => '/settings/logo',

  uploadStudentPhoto: (studentId: string, file: File): Promise<void> =>
    postImage(`/students/${studentId}/photo`, file),
  deleteStudentPhoto: async (studentId: string): Promise<void> => {
    await api.delete(`/students/${studentId}/photo`);
  },

  uploadTeacherPhoto: (teacherId: string, file: File): Promise<void> =>
    postImage(`/teachers/${teacherId}/photo`, file),
  deleteTeacherPhoto: async (teacherId: string): Promise<void> => {
    await api.delete(`/teachers/${teacherId}/photo`);
  },

  uploadLogo: (file: File): Promise<void> => postImage('/settings/logo', file),
  deleteLogo: async (): Promise<void> => {
    await api.delete('/settings/logo');
  },
};
