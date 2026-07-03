import { useMutation } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setAccessToken } from '@/lib/authToken';
import { authApi } from './auth.api';
import { clearCredentials, setCredentials } from './authSlice';
import type { AuthResponseData, LoginPayload, RegisterPayload } from './auth.types';

/** Selectors for the current auth state. */
export const useAuth = () => useAppSelector((state) => state.auth);

/** Login mutation: persists token + user on success. */
export const useLogin = () => {
  const dispatch = useAppDispatch();

  const apply = (data: AuthResponseData): void => {
    setAccessToken(data.accessToken);
    dispatch(setCredentials(data.user));
  };

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      // A 2FA challenge is not a completed login — wait for the coded resubmit.
      if (!('twoFactorRequired' in data)) apply(data);
    },
  });
};

/** Register mutation: same post-success handling as login. */
export const useRegister = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      dispatch(setCredentials(data.user));
    },
  });
};

/** Logout mutation: clears server cookie and local state regardless of outcome. */
export const useLogout = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      setAccessToken(null);
      dispatch(clearCredentials());
    },
  });
};
