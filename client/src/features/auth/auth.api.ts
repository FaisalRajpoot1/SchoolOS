import { api } from '@/lib/axios';
import type { AuthResponseData, AuthUser, LoginPayload, RegisterPayload } from './auth.types';

interface Envelope<T> {
  success: boolean;
  data: T;
}

/** Thin API layer for the auth endpoints. */
export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponseData> {
    const { data } = await api.post<Envelope<AuthResponseData>>('/auth/login', payload);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    const { data } = await api.post<Envelope<AuthResponseData>>('/auth/register', payload);
    return data.data;
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<Envelope<{ user: AuthUser }>>('/auth/me');
    return data.data.user;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
