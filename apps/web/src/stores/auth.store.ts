import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CurrentUser, AuthResponse } from '@bthgrentalcar/sdk';
import { api } from '@/lib/api';

interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: CurrentUser | null) => void;
  login: (email: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstname: string;
    name: string;
    email: string;
    password: string;
    telephone: string;
    numPermis: string;
    address: string;
    city: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  deactivateAccount: () => Promise<void>;
  reactivateAccount: (email: string, password: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.login({ email, password });
          await api.setTokens(response.accessToken, response.refreshToken);

          const user = await api.auth.me();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      loginAdmin: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.loginAdmin({ email, password });
          await api.setTokens(response.accessToken, response.refreshToken);

          const user = await api.auth.me();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.register(data);
          await api.setTokens(response.accessToken, response.refreshToken);

          const user = await api.auth.me();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.auth.logout();
        } catch {
          // Ignore logout errors
        } finally {
          await api.clearTokens();
          set({ user: null, isAuthenticated: false });
        }
      },

      deactivateAccount: async () => {
        set({ isLoading: true, error: null });
        try {
          await api.users.deactivateAccount();
          // Clear auth state after successful deactivation
          try {
            await api.auth.logout();
          } catch {
            // Ignore logout errors during deactivation
          }
          await api.clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to deactivate account';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      reactivateAccount: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.reactivateAccount({ email, password });
          await api.setTokens(response.accessToken, response.refreshToken);

          const user = await api.auth.me();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to reactivate account';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      fetchUser: async () => {
        const isAuth = await api.isAuthenticated();
        if (!isAuth) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await api.auth.me();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          await api.clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'bthg-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
