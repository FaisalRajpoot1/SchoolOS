import { api } from '@/lib/axios';

export interface GradeBand {
  label: string;
  minPercentage: number;
}

export interface GradeScheme {
  bands: GradeBand[];
  isDefault: boolean;
}

export const gradingApi = {
  async getScheme(): Promise<GradeScheme> {
    const { data } = await api.get<{ data: GradeScheme }>('/exams/grade-scheme');
    return data.data;
  },
  async setScheme(bands: GradeBand[]): Promise<GradeScheme> {
    const { data } = await api.put<{ data: GradeScheme }>('/exams/grade-scheme', { bands });
    return data.data;
  },
  async resetScheme(): Promise<GradeScheme> {
    const { data } = await api.delete<{ data: GradeScheme }>('/exams/grade-scheme');
    return data.data;
  },
};
