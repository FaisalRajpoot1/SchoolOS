import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from './auth.api';

export const useForgotPassword = () =>
  useMutation({ mutationFn: authApi.forgotPassword });

export const useResetPassword = () =>
  useMutation({ mutationFn: authApi.resetPassword });

export const useChangePassword = () =>
  useMutation({ mutationFn: authApi.changePassword });

const SESSIONS_KEY = ['auth', 'sessions'] as const;

export const useSessions = () =>
  useQuery({ queryKey: SESSIONS_KEY, queryFn: authApi.listSessions });

export const useRevokeSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
};

export const useRevokeOtherSessions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.revokeOtherSessions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
};
