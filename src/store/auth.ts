import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, clearSession, saveSession } from '@/lib/auth';
import type { LoginResponse, User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (identifier: string, password: string, deviceName?: string) => Promise<LoginResponse>;
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
          await authApi.register(payload);
        } finally {
          set({ loading: false });
        }
      },

      async logout() {
        try {
          await authApi.logout();
        } catch {
          // ignore — still clear local session
        }
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
