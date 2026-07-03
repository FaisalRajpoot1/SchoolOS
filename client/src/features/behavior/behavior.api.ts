import { api } from '@/lib/axios';
import type {
  BehaviorRecord,
  BehaviorSummary,
  CreateBehaviorPayload,
  ListBehaviorParams,
  PaginationMeta,
} from './behavior.types';

export const behaviorApi = {
  async list(params: ListBehaviorParams): Promise<{ items: BehaviorRecord[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: BehaviorRecord[]; meta: PaginationMeta }>('/behavior', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async create(payload: CreateBehaviorPayload): Promise<BehaviorRecord> {
    const { data } = await api.post<{ data: { record: BehaviorRecord } }>('/behavior', payload);
    return data.data.record;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/behavior/${id}`);
  },
  async studentSummary(
    studentId: string,
  ): Promise<{ summary: BehaviorSummary; recent: BehaviorRecord[] }> {
    const { data } = await api.get<{ data: { summary: BehaviorSummary; recent: BehaviorRecord[] } }>(
      `/behavior/students/${studentId}/summary`,
    );
    return data.data;
  },
};
