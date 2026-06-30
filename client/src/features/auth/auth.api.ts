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

  async forgotPassword(payload: { email: string; schoolId: string }): Promise<{ resetToken?: string }> {
    const { data } = await api.post<{ data?: { resetToken?: string } }>(
      '/auth/forgot-password',
      payload,
    );
    return { resetToken: data.data?.resetToken };
  },

  async resetPassword(payload: { token: string; password: string }): Promise<void> {
    await api.post('/auth/reset-password', payload);
  },

  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.post('/auth/change-password', payload);
  },

  async listSessions(): Promise<SessionInfo[]> {
    const { data } = await api.get<Envelope<SessionInfo[]>>('/auth/sessions');
    return data.data;
  },

  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/auth/sessions/${sessionId}`);
  },

  async revokeOtherSessions(): Promise<void> {
    await api.post('/auth/sessions/revoke-others');
  },
};

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  isCurrent: boolean;
}
