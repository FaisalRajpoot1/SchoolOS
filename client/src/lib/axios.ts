import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getAccessToken, setAccessToken } from './authToken';

const baseURL = import.meta.env.VITE_API_URL;

/**
 * Shared Axios instance. `withCredentials` lets the httpOnly refresh
 * cookie flow on refresh/logout calls.
 */
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Called when the session can no longer be recovered (refresh failed). */
let onAuthFailure: (() => void) | null = null;
export const registerAuthFailureHandler = (handler: () => void): void => {
  onAuthFailure = handler;
};

// Attach the current access token to every outgoing request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Single-flight refresh so concurrent 401s trigger only one refresh call.
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  // Bare client (no interceptors) to avoid recursive refresh loops.
  const { data } = await axios.post<{ data: { accessToken: string } }>(
    `${baseURL}/auth/refresh`,
    {},
    { withCredentials: true },
  );
  const token = data.data.accessToken;
  setAccessToken(token);
  return token;
};

// On 401, transparently refresh once and replay the original request.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (RetriableConfig & InternalAxiosRequestConfig) | undefined;
    const isAuthCall = original?.url?.includes('/auth/refresh') || original?.url?.includes('/auth/login');

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        onAuthFailure?.();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
