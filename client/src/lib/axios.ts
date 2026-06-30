import axios from 'axios';

/**
 * Shared Axios instance. `withCredentials` allows the httpOnly refresh
 * cookie to flow. Interceptors for auth/refresh are added with the auth feature.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
