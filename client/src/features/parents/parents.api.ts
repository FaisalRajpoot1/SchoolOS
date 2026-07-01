import { api } from '@/lib/axios';
import type {
  CreateParentPayload,
  ListParentsParams,
  PaginationMeta,
  ParentDetail,
  ParentListItem,
} from './parents.types';

export const parentsApi = {
  async list(params: ListParentsParams): Promise<{ items: ParentListItem[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: ParentListItem[]; meta: PaginationMeta }>('/parents', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async getById(id: string): Promise<ParentDetail> {
    const { data } = await api.get<{ data: { parent: ParentDetail } }>(`/parents/${id}`);
    return data.data.parent;
  },
  async create(payload: CreateParentPayload): Promise<ParentDetail> {
    const { data } = await api.post<{ data: { parent: ParentDetail } }>('/parents', payload);
    return data.data.parent;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/parents/${id}`);
  },
  async linkChild(id: string, studentId: string, relation?: string): Promise<ParentDetail> {
    const { data } = await api.post<{ data: { parent: ParentDetail } }>(`/parents/${id}/children`, {
      studentId,
      relation,
    });
    return data.data.parent;
  },
  async unlinkChild(id: string, studentId: string): Promise<ParentDetail> {
    const { data } = await api.delete<{ data: { parent: ParentDetail } }>(
      `/parents/${id}/children/${studentId}`,
    );
    return data.data.parent;
  },
};
