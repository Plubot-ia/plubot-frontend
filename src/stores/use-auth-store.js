import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import logger from '@/services/loggerService';
import { onEvent } from '@/utils/event-bus.js';

import * as authApi from './auth/auth-api';
import { parseAuthError } from './auth/error-parser';

// Estado inicial
const initialState = {
  user: undefined,
  isAuthenticated: false,
  loading: false,
  error: undefined,
  // Estado del perfil
  profile: {
    energyLevel: 0,
    dailyRewardAvailable: true,
    recentActivities: [],
    isLoading: false,
    isLoaded: false,
    profileId: undefined,
    terminalId: undefined,
  },
  _isLoadingProfile: false,
  _profileCache: { data: undefined, timestamp: 0 },
};

const authStoreLogic = (set, get) => {
  // Escuchar el evento de logout para desacoplar de axios-config
  onEvent('auth:logout', () => get().logout());

  const _profileCache = {
    isValid: () => {
      const cache = get()._profileCache;
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
      return cache.data && Date.now() - cache.timestamp < CACHE_DURATION;
    },
    set: (data) => {
      set((state) => ({
        _profileCache: {
          ...state._profileCache,
          data,
          timestamp: Date.now(),
        },
      }));
    },
    clear: () => {
      set((state) => ({
        _profileCache: {
          ...state._profileCache,
          data: undefined,
          timestamp: 0,
        },
      }));
    },
  };

  const _handleCachedProfile = (forceUpdate) => {
    if (!forceUpdate && _profileCache.isValid()) {
      const cachedUser = _profileCache.data;
      if (cachedUser) {
        set((state) => ({
          user: cachedUser,
          profile: { ...state.profile, ...cachedUser, isLoaded: true },
        }));
        return { success: true, user: cachedUser };
      }
    }
  };

  const _fetchAndSetProfile = async () => {
    try {
      const data = await authApi.fetchUserProfile();
      if (data?.success && data.user) {
        _profileCache.set(data.user);
        set((state) => ({
          ...state,
          user: data.user,
          _isLoadingProfile: false,
          profile: {
            ...state.profile,
            ...data.user,
            isLoading: false,
            isLoaded: true,
          },
        }));
        return { success: true, user: data.user };
      }
      throw new Error(data?.message || 'No se pudo cargar el perfil');
    } catch (error) {
      const errorMessage = parseAuthError(error);
      set((state) => ({
        ...state,
        _isLoadingProfile: false,
        profile: {
          ...state.profile,
          isLoading: false,
          error: errorMessage,
        },
      }));
      if (error.response?.status === 401) get().logout();
      throw new Error(errorMessage);
    }
  };

  const _handleAuthSuccess = (data) => {
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    set({ user: data.user, isAuthenticated: true, loading: false });
    _profileCache.set(data.user);
    return { success: true, user: data.user };
  };

  return {
    ...initialState,

    // Iniciar sesión
    login: async (email, password) => {
      set({ loading: true, error: undefined });
      try {
        const data = await authApi.loginUser(email, password);
        if (data?.success && data?.user) {
          return _handleAuthSuccess(data);
        }
        throw new Error(data?.message || 'Respuesta inválida del servidor');
      } catch (error) {
        const errorMessage = parseAuthError(error);
        set({
          user: undefined,
          isAuthenticated: false,
          loading: false,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
    },

    // Registrar nuevo usuario
    register: async (name, email, password) => {
      set({ loading: true, error: undefined });
      try {
        const data = await authApi.registerUser(name, email, password);
        if (data?.success === true) {
          set({ loading: false });
          return { success: true, message: data.message };
        }
        throw new Error(data?.message || 'Error al registrarse');
      } catch (error) {
        const errorMessage = parseAuthError(error);
        set({ loading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // Cerrar sesión
    logout: () => {
      // --- Optimistic UI Update --- //

      // 1. Guardar el token actual antes de que se borre.
      const token = localStorage.getItem('access_token');

      // 2. Limpiar el estado local y el storage inmediatamente.
      set({ ...initialState, isAuthenticated: false, user: undefined });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      _profileCache.clear();
      onEvent('auth:logged_out');

      // 3. Si existía un token, intentar el cierre de sesión en la API en segundo plano.
      if (token) {
        const performApiLogout = async () => {
          try {
            // Pasamos el token directamente a la función de la API.
            await authApi.logoutUser(token);
          } catch (error) {
            logger.warn('API logout call failed in the background.', error);
          }
        };
        performApiLogout();
      }
    },

    // Verificar autenticación
    checkAuth: () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        set({ isAuthenticated: true });
        // Opcional: decodificar token para obtener info básica sin llamar a la API
      } else {
        const currentState = get();
        if (currentState.isAuthenticated) {
          currentState.logout();
        }
      }
    },

    // Cargar perfil de usuario
    fetchUserProfile: async (forceUpdate = false) => {
      if (get()._isLoadingProfile) return;

      const cachedResponse = _handleCachedProfile(forceUpdate);
      if (cachedResponse) return cachedResponse;

      set((state) => ({
        ...state,
        _isLoadingProfile: true,
        profile: { ...state.profile, isLoading: true, error: undefined },
      }));

      return _fetchAndSetProfile();
    },

    // Solicitar restablecimiento de contraseña
    forgotPassword: async (email) => {
      set({ loading: true, error: undefined });
      try {
        const data = await authApi.requestPasswordReset(email);
        if (data?.success) {
          set({ loading: false });
          return { success: true, message: data.message };
        }
        throw new Error(data?.message || 'Error al solicitar');
      } catch (error) {
        const errorMessage = parseAuthError(error);
        set({ loading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // Restablecer contraseña
    resetPassword: async (token, newPassword) => {
      set({ loading: true, error: undefined });
      try {
        const data = await authApi.resetUserPassword(token, newPassword);
        if (data?.success) {
          set({ loading: false });
          return { success: true, message: data.message };
        }
        throw new Error(data?.message || 'Error al restablecer');
      } catch (error) {
        const errorMessage = parseAuthError(error);
        set({ loading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // Cambiar contraseña
    changePassword: async (currentPassword, newPassword) => {
      set({ loading: true, error: undefined });
      try {
        const data = await authApi.changeUserPassword(
          currentPassword,
          newPassword,
        );
        if (data?.success) {
          set({ loading: false });
          return { success: true, message: data.message };
        }
        throw new Error(data?.message || 'Error al cambiar contraseña');
      } catch (error) {
        const errorMessage = parseAuthError(error);
        set({ loading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // Verificar email con token
    verifyEmail: async (token) => {
      set({ loading: true, error: undefined });
      try {
        const data = await authApi.verifyUserEmail(token);
        if (data?.success) {
          set((state) => ({
            loading: false,
            user: { ...state.user, is_verified: true },
          }));
          return { success: true, message: data.message };
        }
        throw new Error(data?.message || 'Error al verificar');
      } catch (error) {
        const errorMessage = parseAuthError(error);
        set({ loading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // Reenviar email de verificación
    resendVerificationEmail: async (email) => {
      set({ loading: true, error: undefined });
      try {
        const data = await authApi.resendVerificationEmail(email);
        if (data?.success) {
          set({ loading: false });
          return { success: true, message: data.message };
        }
        throw new Error(data?.message || 'Error al reenviar');
      } catch (error) {
        const errorMessage = parseAuthError(error);
        set({ loading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // Autenticación con Google
    getGoogleAuthUrl: async () => {
      set({ loading: true, error: undefined });
      try {
        const data = await authApi.fetchGoogleAuthUrl();
        if (data?.url) {
          set({ loading: false });
          return { success: true, url: data.url };
        }
        throw new Error('No se pudo obtener la URL de Google');
      } catch (error) {
        const errorMessage = parseAuthError(error);
        set({ loading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // Procesar token de autenticación de Google
    processGoogleAuth: async (token) => {
      set({ loading: true, error: undefined });
      try {
        const data = await authApi.processGoogleToken(token);
        if (data?.success && data.user) {
          return _handleAuthSuccess(data);
        }
        throw new Error(
          data?.message || 'Error en la autenticación con Google',
        );
      } catch (error) {
        const errorMessage = parseAuthError(error);
        set({
          loading: false,
          error: errorMessage,
          isAuthenticated: false,
          user: undefined,
        });
        throw new Error(errorMessage);
      }
    },

    // Actualizar manualmente el objeto de usuario
    setUser: (user) => {
      set({ user });
    },

    // Limpiar errores
    clearError: () => set({ error: undefined }),

    // Actualizar perfil
    updateProfile: async (updates) => {
      if (!get().isAuthenticated) throw new Error('No hay usuario autenticado');

      set((state) => ({ profile: { ...state.profile, isLoading: true } }));

      try {
        const data = await authApi.updateUserProfile(updates);
        if (data?.success && data.user) {
          const updatedUser = { ...get().user, ...data.user };
          _profileCache.set(updatedUser);
          set((state) => ({
            user: updatedUser,
            profile: {
              ...state.profile,
              isLoading: false,
              isLoaded: true,
              error: undefined,
            },
          }));
          return { success: true, user: updatedUser };
        }
        throw new Error(data?.message || 'Error al actualizar el perfil');
      } catch (error) {
        const errorMessage = parseAuthError(error);
        set((state) => ({
          profile: {
            ...state.profile,
            isLoading: false,
            error: errorMessage,
          },
        }));
        if (error.response?.status === 401) get().logout();
        throw new Error(errorMessage);
      }
    },

    // Utilidades
    clearProfileError: () =>
      set((state) => ({
        profile: { ...state.profile, error: undefined },
      })),
  };
};

const persistConfig = {
  name: 'auth-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => {
    const { user, isAuthenticated, _profileCache } = state;
    const partialUser = user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          is_verified: user.is_verified,
          plubots: user.plubots,
        }
      : undefined;

    return {
      user: partialUser,
      isAuthenticated,
      _profileCache,
    };
  },
};

const useAuthStore = create(persist(authStoreLogic, persistConfig));

// Selectores personalizados
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useAuthError = () => useAuthStore((state) => state.error);

export default useAuthStore;
