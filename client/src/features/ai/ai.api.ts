import { api } from '@/lib/axios';
import type { AiResult, GeneratePayload, Insights } from './ai.types';

export const aiApi = {
  async status(): Promise<{ aiEnabled: boolean }> {
    const { data } = await api.get<{ data: { aiEnabled: boolean } }>('/ai/status');
    return data.data;
  },
  async insights(): Promise<Insights> {
    const { data } = await api.get<{ data: Insights }>('/ai/insights');
    return data.data;
  },
  async generate(payload: GeneratePayload): Promise<AiResult> {
    const { data } = await api.post<{ data: AiResult }>('/ai/generate', payload);
    return data.data;
  },
  async reportComment(studentId: string): Promise<AiResult> {
    const { data } = await api.post<{ data: AiResult }>('/ai/report-comment', { studentId });
    return data.data;
  },
};
