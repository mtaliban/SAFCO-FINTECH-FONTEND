import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

/**
 * Central Axios client for talking to the SAFCO FINTECH LMS backend.
 * - Attaches the Sanctum bearer token from a cookie on every request
 * - On 401, clears the token and redirects to /login
 * - Surfaces validation errors as toast messages
 * - Sends an X-Correlation-ID for distributed tracing
 */

export const TOKEN_KEY = 'safco_token';
export const USER_KEY = 'safco_user';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/v1`,
  timeout: 30_000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Correlation ID for distributed tracing (backend logs it in Kibana/Grafana)
  if (typeof window !== 'undefined') {
    config.headers['X-Correlation-ID'] = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      Cookies.remove(TOKEN_KEY);
      Cookies.remove(USER_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (status === 422 && data?.errors) {
      const firstError = Object.values(data.errors)[0]?.[0];
      if (firstError) toast.error(firstError);
    } else if (status === 429) {
      toast.error('Umeomba mara nyingi mno. Subiri kidogo.');
    } else if (status === 423) {
      toast.error('Akaunti yako imefungwa kwa muda.');
    } else if (data?.message && status && status >= 400) {
      toast.error(data.message);
    }

    return Promise.reject(error);
  }
);

/** Convenience helpers so components don't unwrap `.data.data` everywhere. */
export const apiRequest = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<{ data: T }>(url, config).then((r) => r.data.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    api.post<{ data: T }>(url, body, config).then((r) => r.data.data),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    api.patch<{ data: T }>(url, body, config).then((r) => r.data.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<{ data: T }>(url, config).then((r) => r.data.data),
};
