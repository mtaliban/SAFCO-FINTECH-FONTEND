import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, clearSession, saveSession } from '@/lib/auth';
import { disconnectEcho } from '@/lib/echo';
import type { LoginOtpPending, LoginResponse, User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (identifier: string, password: string, deviceName?: string) => Promise<LoginResponse | LoginOtpPending>;
  verifyLoginOtp: (email: string, code: string, deviceName?: string) => Promise<LoginResponse>;
  register: (payload: Parameters<typeof authApi.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      async login(identifier, password, deviceName = 'web') {
        set({ loading: true });
        try {
          const res = await authApi.login({ identifier, password, device_name: deviceName });
          // otp_sent: true — credentials OK, waiting for OTP verification
          if ('otp_sent' in res && res.otp_sent) {
            set({ loading: false });
            return res;
          }
          // Phone-only user: token issued directly
          const full = res as LoginResponse;
          saveSession(full);
          set({ user: full.user, token: full.token, isAuthenticated: true, loading: false });
          return full;
        } catch (e) {
          set({ loading: false });
          throw e;
        }
      },

      async verifyLoginOtp(email, code, deviceName = 'web') {
        set({ loading: true });
        try {
          const res = await authApi.verifyLoginOtp({ email, code, device_name: deviceName });
          saveSession(res);
          set({ user: res.user, token: res.token, isAuthenticated: true, loading: false });
          return res;
        } catch (e) {
          set({ loading: false });
          throw e;
        }
      },

      async register(payload) {
        set({ loading: true });
        try {
          const res = await authApi.register(payload);
          saveSession(res);
          set({ user: res.user, token: res.token, isAuthenticated: true, loading: false });
        } catch (e) {
          set({ loading: false });
          throw e;
        }
      },

      async logout() {
        try {
          await authApi.logout();
        } catch {
          // ignore — still clear local session
        }
        disconnectEcho();
        clearSession();
        set({ user: null, token: null, isAuthenticated: false });
      },

      async fetchMe() {
        try {
          const user = await authApi.me();
          set({ user, isAuthenticated: true });
        } catch {
          clearSession();
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      setUser(user) {
        set({ user });
      },
    }),
    {
      name: 'safco-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);
