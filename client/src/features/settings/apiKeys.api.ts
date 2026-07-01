import { api } from '@/lib/axios';

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export const apiKeysApi = {
  async list(): Promise<ApiKey[]> {
    const { data } = await api.get<{ data: ApiKey[] }>('/settings/api-keys');
    return data.data;
  },
  async create(name: string): Promise<{ apiKey: ApiKey; key: string }> {
    const { data } = await api.post<{ data: { apiKey: ApiKey; key: string } }>('/settings/api-keys', {
      name,
    });
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/settings/api-keys/${id}`);
  },
};
