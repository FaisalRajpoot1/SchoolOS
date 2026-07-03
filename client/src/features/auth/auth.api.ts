import { api } from '@/lib/axios';
import type {
  AuthResponseData,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  TwoFactorRequired,
} from './auth.types';

interface Envelope<T> {
  success: boolean;
  data: T;
}

export type LoginResult = AuthResponseData | TwoFactorRequired;

/** Thin API layer for the auth endpoints. */
export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResult> {
    const { data } = await api.post<Envelope<LoginResult>>('/auth/login', payload);
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

  // ---- Two-factor auth ----
  async twoFactorStatus(): Promise<TwoFactorStatus> {
    const { data } = await api.get<Envelope<TwoFactorStatus>>('/auth/2fa');
    return data.data;
  },
  async twoFactorSetup(): Promise<TwoFactorSetup> {
    const { data } = await api.post<Envelope<TwoFactorSetup>>('/auth/2fa/setup');
    return data.data;
  },
  async twoFactorEnable(code: string): Promise<{ backupCodes: string[] }> {
    const { data } = await api.post<Envelope<{ backupCodes: string[] }>>('/auth/2fa/enable', { code });
    return data.data;
  },
  async twoFactorDisable(password: string): Promise<void> {
    await api.post('/auth/2fa/disable', { password });
  },
  async twoFactorRegenerate(code: string): Promise<{ backupCodes: string[] }> {
    const { data } = await api.post<Envelope<{ backupCodes: string[] }>>('/auth/2fa/backup-codes', {
      code,
    });
    return data.data;
  },
};

export interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  isCurrent: boolean;
}
