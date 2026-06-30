import { useEffect } from 'react';
import axios from 'axios';
import { useAppDispatch } from '@/app/hooks';
import { setAccessToken } from '@/lib/authToken';
import { registerAuthFailureHandler } from '@/lib/axios';
import { authApi } from './auth.api';
import { clearCredentials, setBootstrapped, setCredentials } from './authSlice';

const baseURL = import.meta.env.VITE_API_URL;

/**
 * On app load, attempt a silent refresh using the httpOnly cookie to
 * restore the session, then fetch the current user. Also wires the
 * global auth-failure handler so an unrecoverable 401 clears state.
 */
export const useAuthBootstrap = (): void => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    registerAuthFailureHandler(() => {
      setAccessToken(null);
      dispatch(clearCredentials());
    });

    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      try {
        const { data } = await axios.post<{ data: { accessToken: string } }>(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        setAccessToken(data.data.accessToken);
        const user = await authApi.me();
        if (!cancelled) dispatch(setCredentials(user));
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          dispatch(clearCredentials());
        }
      } finally {
        if (!cancelled) dispatch(setBootstrapped());
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
};
