import Cookies from 'js-cookie';
import { apiRequest, TOKEN_KEY, USER_KEY } from './api';
import type { LoginResponse, User } from '@/types';

const cookieOpts = {
  expires: 1,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export const authApi = {
  register: (payload: {
    full_name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
    accept_terms: boolean;
    gender?: string;
    position?: string;
    role?: string;
  }) => apiRequest.post<LoginResponse>('/auth/register', payload),

  login: (payload: { identifier: string; password: string; device_name?: string }) =>
    apiRequest.post<LoginResponse>('/auth/login', payload),

  logout: () => apiRequest.post<null>('/auth/logout'),

  me: () => apiRequest.get<User>('/auth/me'),

  forgotPassword: (email: string) => apiRequest.post<null>('/auth/password/forgot', { email }),

  resetPassword: (payload: { email: string; token: string; password: string; password_confirmation: string }) =>
    apiRequest.post<null>('/auth/password/reset', payload),

  requestOtp: (payload: { identifier: string; type: string; channel: 'sms' | 'email' }) =>
    apiRequest.post<null>('/auth/otp/request', payload),

  verifyOtp: (payload: { identifier: string; code: string; type: string }) =>
    apiRequest.post<null>('/auth/otp/verify', payload),

  setup2fa: () =>
    apiRequest.post<{ secret: string; qr_code_svg: string; otpauth_url: string; instructions: string }>(
      '/auth/2fa/setup'
    ),

  confirm2fa: (code: string) =>
    apiRequest.post<{ enabled: boolean; recovery_codes: string[]; warning: string }>(
      '/auth/2fa/confirm',
      { code }
    ),

  disable2fa: () => apiRequest.delete<null>('/auth/2fa'),
};

export function saveSession(login: LoginResponse) {
  Cookies.set(TOKEN_KEY, login.token, { ...cookieOpts, expires: 1 });
  Cookies.set(USER_KEY, JSON.stringify(login.user), cookieOpts);
}

export function clearSession() {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = Cookies.get(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!Cookies.get(TOKEN_KEY);
}
