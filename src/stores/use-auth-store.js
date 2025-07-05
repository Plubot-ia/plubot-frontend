import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import logger from '@/services/loggerService';
import instance from '@/utils/axios-config.js';
import { onEvent } from '@/utils/event-bus.js';

// Función auxiliar para pausas asíncronas
const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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
};

// Crear el store de autenticación
const useAuthStore = create(
  persist(
    (set, get) => {
      // Escuchar el evento de logout para desacoplar de axios-config
      onEvent('auth:logout', () => get().logout());

      return {
        ...initialState,

        // Iniciar sesión
        login: async (email, password) => {
          set({ loading: true, error: undefined });

          try {
            // Crear FormData para enviar los datos como el backend espera
            const formData = new FormData();
            formData.append('email', email.trim());
            formData.append('password', password);

            // Aumentar el timeout para esta solicitud específica y configurar para FormData
            const loginResponse = await instance.post('auth/login', formData, {
              timeout: 30_000, // 30 segundos para dar más tiempo en producción
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });

            const { data } = loginResponse;

            if (data?.success === true) {
              // Guardar el token
              localStorage.setItem('access_token', data.access_token);

              // Obtener el perfil del usuario
              const profileResponse = await instance.get('auth/profile', {
                headers: {
                  Authorization: `Bearer ${data.access_token}`,
                },
                timeout: 20_000, // 20 segundos para esta solicitud
              });

              const profile = profileResponse.data;

              if (profile?.user) {
                if (!profile.user.is_verified) {
                  throw new Error(
                    'Por favor verifica tu correo antes de iniciar sesión.',
                  );
                }

                set({
                  user: profile.user,
                  isAuthenticated: true,
                  loading: false,
                });

                return { success: true, user: profile.user };
              }
            }

            throw new Error(data?.message || 'Error al iniciar sesión');
          } catch (error) {
            let errorMessage = 'Error de conexión';

            if (error.response?.data?.message) {
              errorMessage = error.response.data.message;
            } else if (error.message) {
              errorMessage = error.message;
            } else if (error.code === 'ECONNABORTED') {
              errorMessage =
                'La conexión ha tardado demasiado. Por favor, inténtalo de nuevo.';
            }

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
            // Crear FormData para enviar los datos como el backend espera
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);

            // Configuración especial para enviar FormData
            const response = await instance.post('auth/register', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });

            const { data } = response;

            if (data?.success === true) {
              // Guardar el token
              localStorage.setItem('access_token', data.access_token);

              set({
                user: data.user,
                isAuthenticated: true,
                loading: false,
              });

              return { success: true, user: data.user };
            }

            throw new Error(data?.message || 'Error al registrarse');
          } catch (error) {
            let errorMessage = 'Error de conexión';

            if (error.response?.data?.message) {
              errorMessage = error.response.data.message;
            } else if (error.message) {
              errorMessage = error.message;
            } else if (error.code === 'ECONNABORTED') {
              errorMessage =
                'La conexión ha tardado demasiado. Por favor, inténtalo de nuevo.';
            }

            set({
              user: undefined,
              isAuthenticated: false,
              loading: false,
              error: errorMessage,
            });

            throw new Error(errorMessage);
          }
        },

        // Cerrar sesión
        logout: async () => {
          set({ loading: true });

          try {
            // Limpiar token
            localStorage.removeItem('access_token');

            // Notificar al backend (esto no debería fallar)
            try {
              await instance.post('auth/logout');
            } catch (error) {
              logger.error(
                'Error al notificar al backend sobre el cierre de sesión',
                error,
              );
            }

            // Limpiar estado
            set({
              user: undefined,
              isAuthenticated: false,
              loading: false,
              profile: {
                energyLevel: 0,
                dailyRewardAvailable: true,
                recentActivities: [],
                isLoading: false,
                isLoaded: false,
                profileId: undefined,
                terminalId: undefined,
              },
            });

            // Limpiar la caché
            get()._profileCache.clear();

            return { success: true };
          } catch (error) {
            logger.error('Error al cerrar sesión', error);

            // Limpiar de todos modos
            set({
              user: undefined,
              isAuthenticated: false,
              loading: false,
            });

            return { success: true };
          }
        },

        // Verificar autenticación
        checkAuth: async () => {
          const token = localStorage.getItem('access_token');
          if (!token) {
            set({
              user: undefined,
              isAuthenticated: false,
              loading: false,
            });
            return { success: false, user: undefined };
          }

          set({ loading: true });

          try {
            const response = await instance.get('auth/profile', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              timeout: 10_000,
            });

            const { data } = response;

            if (data?.user) {
              if (!data.user.is_verified) {
                localStorage.removeItem('access_token');
                set({
                  user: undefined,
                  isAuthenticated: false,
                  loading: false,
                  error:
                    'Por favor verifica tu correo antes de iniciar sesión.',
                });
                return { success: false, user: undefined };
              }

              set({
                user: data.user,
                isAuthenticated: true,
                loading: false,
              });
              return { success: true, user: data.user };
            }

            localStorage.removeItem('access_token');
            set({
              user: undefined,
              isAuthenticated: false,
              loading: false,
            });
            return { success: false, user: undefined };
          } catch (error) {
            logger.error('Error al verificar autenticación', error);
            localStorage.removeItem('access_token');
            set({
              user: undefined,
              isAuthenticated: false,
              loading: false,
            });
            return { success: false, user: undefined };
          }
        },

        // Método para cargar el perfil del usuario con persistencia robusta de plubots
        fetchUserProfile: async (forceUpdate = false) => {
          const currentState = get();

          // Verificar si ya hay una petición en curso
          if (currentState._isLoadingProfile && !forceUpdate) {
            logger.info('Petición de perfil ya en curso, esperando...');
            // Esperar un poco para evitar sobrecarga
            await sleep(500);
            return { success: false, message: 'Petición ya en curso' };
          }

          // Verificar si el perfil ya está cargado y no se solicita actualización forzada
          if (currentState.profile.isLoaded && !forceUpdate) {
            logger.info('Perfil ya cargado, usando datos existentes.');
            return { success: true, user: currentState.user };
          }

          // Verificar si hay datos en caché y no se solicita actualización forzada
          const cachedProfile = currentState._profileCache.isValid()
            ? currentState._profileCache.data
            : undefined;
          if (cachedProfile && !forceUpdate) {
            logger.info('Usando datos de perfil en caché');
            set({
              user: cachedProfile,
              profile: {
                ...currentState.profile,
                isLoading: false,
                isLoaded: true,
                error: undefined,
                energyLevel: Math.min(
                  cachedProfile.plubots?.length * 20 || 0,
                  100,
                ),
              },
            });
            return { success: true, user: cachedProfile };
          }

          // Si no hay usuario autenticado, no intentar cargar el perfil
          if (!currentState.isAuthenticated || !currentState.user) {
            logger.warn('Intento de cargar perfil sin usuario autenticado');
            set({
              user: undefined,
              isAuthenticated: false,
              profile: {
                ...currentState.profile,
                isLoading: false,
                isLoaded: false,
                error: 'No hay usuario autenticado',
              },
            });
            return { success: false, message: 'No autenticado' };
          }

          // Actualizar el estado para indicar que se está cargando el perfil
          set((state) => ({
            _isLoadingProfile: true,
            profile: {
              ...state.profile,
              isLoading: true,
              error: undefined,
            },
          }));

          try {
            // Obtener el perfil del usuario con datos completos
            const response = await instance.get('auth/profile', {
              timeout: 20_000, // 20 segundos para esta solicitud
            });

            const { data } = response;

            if (data?.user) {
              // Actualizar el estado con los datos del perfil
              set({
                user: data.user,
                profile: {
                  ...currentState.profile,
                  isLoading: false,
                  isLoaded: true,
                  error: undefined,
                  profileId: data.user.id,
                  energyLevel: Math.min(
                    data.user.plubots?.length * 20 || 0,
                    100,
                  ),
                },
                _isLoadingProfile: false,
              });

              // Guardar en caché
              currentState._profileCache.set(data.user);

              return { success: true, user: data.user };
            }

            // Si no hay datos de usuario, limpiar el estado
            set({
              user: undefined,
              isAuthenticated: false,
              profile: {
                ...currentState.profile,
                isLoading: false,
                isLoaded: false,
                error: 'No se pudieron cargar los datos del perfil',
              },
              _isLoadingProfile: false,
            });

            return {
              success: false,
              message: 'No se pudieron cargar los datos del perfil',
            };
          } catch (error) {
            logger.error('Error al cargar el perfil del usuario', error);
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              'Error de conexión';
            // Actualizar el estado con el error
            set({
              profile: {
                ...currentState.profile,
                isLoading: false,
                error: errorMessage,
              },
              _isLoadingProfile: false,
            });

            if (error.response?.status === 401) {
              localStorage.removeItem('access_token');
              set({
                user: undefined,
                isAuthenticated: false,
              });
              currentState._profileCache.clear();
            }

            return { success: false, message: errorMessage };
          }
        },

        // Solicitar restablecimiento de contraseña
        forgotPassword: async (email) => {
          set({ loading: true, error: undefined });

          try {
            const formData = new FormData();
            formData.append('email', email);

            const response = await instance.post(
              'auth/forgot-password',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
            );

            set({ loading: false });
            return response.data;
          } catch (error) {
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              'Error de conexión';
            set({ loading: false, error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        // Restablecer contraseña
        resetPassword: async (token, newPassword) => {
          set({ loading: true, error: undefined });

          try {
            const formData = new FormData();
            formData.append('token', token);
            formData.append('password', newPassword);

            const response = await instance.post(
              'auth/reset-password',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
            );

            set({ loading: false });
            return response.data;
          } catch (error) {
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              'Error de conexión';
            set({ loading: false, error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        // Cambiar contraseña
        changePassword: async (
          currentPassword,
          newPassword,
          confirmPassword,
        ) => {
          set({ loading: true, error: undefined });

          try {
            const formData = new FormData();
            formData.append('current_password', currentPassword);
            formData.append('new_password', newPassword);
            formData.append('confirm_password', confirmPassword);

            const response = await instance.post(
              'auth/change-password',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
            );

            set({ loading: false });
            return response.data;
          } catch (error) {
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              'Error de conexión';
            set({ loading: false, error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        // Verificar email con token
        verifyEmail: async (token) => {
          set({ loading: true, error: undefined });

          try {
            const formData = new FormData();
            formData.append('token', token);

            const response = await instance.post(
              'auth/verify-email',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
            );

            set({ loading: false });
            return response.data;
          } catch (error) {
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              'Error de conexión';
            set({ loading: false, error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        // Reenviar email de verificación
        resendVerificationEmail: async (email) => {
          set({ loading: true, error: undefined });

          try {
            const formData = new FormData();
            formData.append('email', email);

            const response = await instance.post(
              'auth/resend-verification',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
            );

            set({ loading: false });
            return response.data;
          } catch (error) {
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              'Error de conexión';
            set({ loading: false, error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        // Autenticación con Google
        getGoogleAuthUrl: async () => {
          set({ loading: true, error: undefined });

          try {
            const response = await instance.get('auth/google/login');
            const { data } = response;

            if (data?.url) {
              set({ loading: false });
              return { success: true, url: data.url };
            }

            throw new Error(
              data?.message ||
                'Error al obtener URL de autenticación con Google',
            );
          } catch (error) {
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              'Error de conexión';
            set({ loading: false, error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        // Procesar token de autenticación de Google
        processGoogleAuth: async (token) => {
          set({ loading: true, error: undefined });

          try {
            const formData = new FormData();
            formData.append('token', token);

            const response = await instance.post(
              'auth/google/callback',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
            );

            const { data } = response;

            if (data?.success === true && data.access_token) {
              localStorage.setItem('access_token', data.access_token);
              const profileResponse = await instance.get('auth/profile', {
                headers: {
                  Authorization: `Bearer ${data.access_token}`,
                },
              });

              const profileData = profileResponse.data;

              if (profileData?.user) {
                set({
                  user: profileData.user,
                  isAuthenticated: true,
                  loading: false,
                });
                return { success: true, user: profileData.user };
              }
            }

            throw new Error(
              data?.message || 'Error al procesar autenticación con Google',
            );
          } catch (error) {
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              'Error de conexión';

            set({
              user: undefined,
              isAuthenticated: false,
              loading: false,
              error: errorMessage,
            });
            throw new Error(errorMessage);
          }
        },

        // Limpiar errores
        clearError: () => set({ error: undefined }),

        // Funciones para establecer el estado directamente (útil para pruebas y desarrollo)
        setUser: (user) => set({ user }),
        setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

        // Cache para perfiles
        _profileCache: {
          data: undefined,
          timestamp: 0,
          isValid() {
            const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
            return this.data && Date.now() - this.timestamp < CACHE_DURATION;
          },
          set(data) {
            this.data = data;
            this.timestamp = Date.now();
          },
          clear() {
            this.data = undefined;
            this.timestamp = 0;
          },
        },

        // Actualizar perfil
        updateProfile: async (updates) => {
          const currentState = get();

          if (!currentState.isAuthenticated || !currentState.user) {
            throw new Error('No hay usuario autenticado');
          }

          set((state) => ({
            profile: {
              ...state.profile,
              isLoading: true,
              error: undefined,
            },
          }));

          try {
            const formData = new FormData();
            let hasUpdates = false;

            // Añadir solo los campos que han sido actualizados
            for (const [key, value] of Object.entries(updates)) {
              if (value !== undefined) {
                // Si el valor es un objeto (pero no un archivo, que también es un objeto),
                // serializarlo
                if (typeof value === 'object' && !(value instanceof File)) {
                  formData.append(key, JSON.stringify(value));
                } else {
                  formData.append(key, value);
                }
                hasUpdates = true;
              }
            }

            if (!hasUpdates) {
              set((state) => ({
                profile: {
                  ...state.profile,
                  isLoading: false,
                },
              }));
              return { success: true, user: currentState.user };
            }

            const response = await instance.post('auth/profile', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });

            if (response.data?.success === true && response.data.user) {
              const updatedUser = {
                ...currentState.user,
                ...response.data.user,
              };

              // Actualizar la caché
              currentState._profileCache.set(updatedUser);

              // Actualizar el estado
              set({
                user: updatedUser,
                isAuthenticated: true,
                profile: {
                  ...currentState.profile,
                  isLoading: false,
                  error: undefined,
                  energyLevel: Math.min(
                    updatedUser.plubots?.length * 20 || 0,
                    100,
                  ),
                },
              });

              return { success: true, user: updatedUser };
            }

            throw new Error(
              response.data?.message || 'Error al actualizar el perfil',
            );
          } catch (error) {
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              'Error de conexión';

            set((state) => ({
              profile: {
                ...state.profile,
                isLoading: false,
                error: errorMessage,
              },
            }));

            // Si hay un error de autenticación, limpiar la caché
            if (error.response?.status === 401) {
              currentState._profileCache.clear();
              localStorage.removeItem('access_token');
              set({
                isAuthenticated: false,
                user: undefined,
                loading: false,
              });
            }

            throw new Error(errorMessage);
          }
        },

        // Utilidades
        clearProfileError: () =>
          set((state) => ({
            profile: { ...state.profile, error: undefined },
          })),
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => {
        const { user } = state;
        // Persist only essential, lightweight user data to prevent quota errors.
        const partialUser = user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              is_verified: user.is_verified,
              // Explicitly exclude heavy fields like 'plubots', 'projects', etc.
            }
          : undefined;

        return {
          user: partialUser,
          isAuthenticated: state.isAuthenticated,
        };
      },
    },
  ),
);

// Selectores personalizados
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useAuthError = () => useAuthStore((state) => state.error);

export default useAuthStore;
