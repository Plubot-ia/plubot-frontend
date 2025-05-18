import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import instance from '@/utils/axiosConfig';

// Estado inicial
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  // Estado del perfil
  profile: {
    energyLevel: 0,
    dailyRewardAvailable: true,
    recentActivities: [],
    isLoading: false,
    isLoaded: false,
    profileId: null,
    terminalId: null
  }
};

// Crear el store de autenticación
const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Iniciar sesión
      login: async (email, password) => {
        set({ loading: true, error: null });
        
        try {
          // Crear FormData para enviar los datos como el backend espera
          const formData = new FormData();
          formData.append('email', email.trim());
          formData.append('password', password);
          
          console.log('Enviando datos de login:', { email: email.trim() });
          
          // Aumentar el timeout para esta solicitud específica y configurar para FormData
          const loginResponse = await instance.post('/api/auth/login', formData, {
            timeout: 30000, // 30 segundos para dar más tiempo en producción
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          const data = loginResponse.data;
          
          if (data?.status === 'success') {
            // Guardar el token
            localStorage.setItem('access_token', data.access_token);
            
            // Obtener el perfil del usuario
            const profileResponse = await instance.get('/api/auth/profile', {
              headers: {
                'Authorization': `Bearer ${data.access_token}`
              },
              timeout: 20000 // 20 segundos para esta solicitud
            });
            
            const profile = profileResponse.data;
            
            if (profile?.user) {
              if (!profile.user.is_verified) {
                throw new Error('Por favor verifica tu correo antes de iniciar sesión.');
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
          console.error('Error detallado en login:', error);
          let errorMessage = 'Error de conexión';
          
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'La conexión ha tardado demasiado. Por favor, inténtalo de nuevo.';
          }
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            loading: false, 
            error: errorMessage 
          });
          
          throw new Error(errorMessage);
        }
      },
      
      // Registrar nuevo usuario
      register: async (name, email, password) => {
        set({ loading: true, error: null });
        
        try {
          // Crear FormData para enviar los datos como el backend espera
          const formData = new FormData();
          formData.append('name', name);
          formData.append('email', email);
          formData.append('password', password);
          
          // Configuración especial para enviar FormData
          const response = await instance.post('/api/auth/register', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          const data = response.data;
          
          if (data?.status === 'success') {
            set({ loading: false });
            return { success: true };
          }
          
          throw new Error(data?.message || 'Error en el registro');
          
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },
      
      // Cerrar sesión
      logout: async () => {
        // Primero limpiar el estado y el almacenamiento para una experiencia más rápida
        // Esto garantiza que la interfaz de usuario responda inmediatamente
        
        // Eliminar tokens
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
        
        // Eliminar datos de usuario
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        
        // Eliminar estado de autenticación
        localStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('isAuthenticated');
        
        // Eliminar datos específicos de Google
        localStorage.removeItem('google_auth_email');
        localStorage.removeItem('google_auth_name');
        localStorage.removeItem('mock_google_user');
        localStorage.removeItem('current_user_email');
        localStorage.removeItem('current_user_name');
        
        // Limpiar completamente el estado
        set({
          ...initialState,
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
        
        console.log('Sesión cerrada correctamente');
        
        // Luego intentar notificar al backend, pero sin esperar respuesta
        // Esto evita que la interfaz se bloquee si hay problemas de conexión
        try {
          // Usar fetch con un timeout en lugar de axios para evitar bloqueos
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos de timeout
          
          fetch('/api/auth/logout', {
            method: 'POST',
            signal: controller.signal,
            credentials: 'include'
          }).catch(e => {
            // Ignorar errores de conexión, ya que el estado local ya está limpio
            console.log('No se pudo notificar al servidor sobre el cierre de sesión, pero la sesión local se cerró correctamente');
          }).finally(() => {
            clearTimeout(timeoutId);
          });
        } catch (error) {
          // Ignorar cualquier error, ya que el estado local ya está limpio
          console.error('Error al intentar notificar al servidor:', error);
        }
        
        return true; // Siempre devolver éxito ya que la sesión local se cerró correctamente
      },
      
      // Verificar autenticación
      checkAuth: async () => {
        const state = get();
        
        // Si ya está autenticado, no es necesario verificar de nuevo
        if (state.isAuthenticated && state.user) {
          return true;
        }
        
        // Si ya se está verificando, no hacer nada
        if (state.loading) {
          return false;
        }
        
        const token = localStorage.getItem('access_token');
        
        // Si no hay token, no está autenticado
        if (!token) {
          set({ loading: false, isAuthenticated: false, user: null });
          return false;
        }
        
        // Si hay un usuario en caché y el token es válido, usarlo
        if (state._profileCache.isValid() && state._profileCache.data) {
          set({
            user: state._profileCache.data,
            isAuthenticated: true,
            loading: false,
            error: null
          });
          return true;
        }
        
        // Marcar como cargando
        set({ loading: true });
        
        try {
          // Verificar token con el servidor
          const response = await instance.get('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
            // Evitar caché del navegador
            params: { _: Date.now() }
          });
          
          if (response.data?.user) {
            // Actualizar caché
            state._profileCache.set(response.data.user);
            
            // Actualizar estado
            set({
              user: response.data.user,
              isAuthenticated: true,
              loading: false,
              error: null
            });
            return true;
          }
          
          // Si no hay usuario en la respuesta, limpiar todo
          localStorage.removeItem('access_token');
          state._profileCache.clear();
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: 'Sesión inválida'
          });
          return false;
          
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
          
          if (process.env.NODE_ENV === 'development') {
            console.error('[Auth] Error al verificar autenticación:', errorMessage);
          }
          
          // Si hay un error de autenticación, limpiar todo
          if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            state._profileCache.clear();
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
              error: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
            });
          } else {
            // Para otros errores, mantener el estado actual pero marcar el error
            set(state => ({
              loading: false,
              error: errorMessage
            }));
          }
          
          return false;
        }
      },
      
      // Variable para controlar si hay una petición en curso
      _isLoadingProfile: false,
      
      // Método para cargar el perfil del usuario
      fetchUserProfile: async (forceUpdate = false) => {
        const currentState = get();
        
        // Si ya tenemos el perfil y no se fuerza la actualización, devolver el perfil actual
        if (currentState.user && currentState.isAuthenticated && !forceUpdate) {
          return { success: true, user: currentState.user };
        }
        
        // Usar una variable estática para evitar peticiones simultáneas
        if (useAuthStore._isLoadingProfile) {
          return { success: false, message: 'Ya hay una carga en curso' };
        }
        
        // Marcar como cargando
        useAuthStore._isLoadingProfile = true;
        set({ loading: true, error: null });
        
        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            set({ 
              user: null, 
              isAuthenticated: false, 
              loading: false, 
              error: 'No se encontró token de autenticación' 
            });
            return { success: false, message: 'No se encontró token de autenticación' };
          }
          
          // Verificar si hay datos en caché válidos
          if (!forceUpdate && currentState._profileCache.isValid()) {
            const cachedUser = currentState._profileCache.data;
            set({
              user: cachedUser,
              isAuthenticated: true,
              loading: false,
              error: null,
              profile: {
                ...currentState.profile,
                energyLevel: Math.min(cachedUser.plubots?.length * 20 || 0, 100),
                isLoaded: true
              }
            });
            return { success: true, user: cachedUser };
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auth] Cargando perfil de usuario...');
          }
          
          const response = await instance.get('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { _t: Date.now() } // Evitar caché del navegador
          });
          
          if (response.data?.status === 'success' && response.data.user) {
            // Actualizar caché
            currentState._profileCache.set(response.data.user);
            
            // Actualizar estado
            set({
              user: response.data.user,
              isAuthenticated: true,
              loading: false,
              error: null,
              profile: {
                ...currentState.profile,
                energyLevel: Math.min(response.data.user.plubots?.length * 20 || 0, 100),
                isLoaded: true
              }
            });
            
            if (process.env.NODE_ENV === 'development') {
              console.log('[Auth] Perfil cargado correctamente');
            }
            
            // Liberar la variable de carga
            useAuthStore._isLoadingProfile = false;
            return { success: true, user: response.data.user };
          }
          
          throw new Error(response.data?.message || 'Error al cargar el perfil');
          
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
          
          if (process.env.NODE_ENV === 'development') {
            console.error('[Auth] Error al cargar perfil:', errorMessage);
          }
          
          // Si hay un error de autenticación, limpiar todo
          if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            currentState._profileCache.clear();
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
              error: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
            });
          } else {
            set({
              loading: false,
              error: errorMessage
            });
          }
          
          // Liberar la variable de carga en caso de error
          useAuthStore._isLoadingProfile = false;
          return { success: false, message: errorMessage };
        } finally {
          // Asegurarse de que siempre se libere la variable de carga
          useAuthStore._isLoadingProfile = false;
        }
      },
      
      // Solicitar restablecimiento de contraseña
      forgotPassword: async (email) => {
        set({ loading: true, error: null });
        
        try {
          // Crear FormData para enviar los datos como el backend espera
          const formData = new FormData();
          formData.append('email', email.trim());
          
          const response = await instance.post('/api/auth/forgot_password', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.data?.status === 'success') {
            set({ loading: false });
            return { success: true };
          }
          
          throw new Error(response.data?.message || 'Error al enviar el correo de recuperación');
          
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },
      
      // Restablecer contraseña
      resetPassword: async (token, newPassword) => {
        set({ loading: true, error: null });
        
        try {
          // Crear FormData para enviar los datos como el backend espera
          const formData = new FormData();
          formData.append('token', token);
          formData.append('password', newPassword);
          formData.append('password_confirmation', newPassword);
          
          const response = await instance.post('/api/auth/reset_password', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.data?.status === 'success') {
            set({ loading: false });
            return { success: true };
          }
          
          throw new Error(response.data?.message || 'Error al restablecer la contraseña');
          
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },
      
      // Verificar email con token
      verifyEmail: async (token) => {
        set({ loading: true, error: null });
        
        try {
          // Crear FormData para enviar los datos como el backend espera
          const formData = new FormData();
          formData.append('token', token);
          
          const response = await instance.post('/api/auth/verify_email', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.data?.status === 'success') {
            set({ loading: false });
            return { success: true };
          }
          
          throw new Error(response.data?.message || 'Error al verificar el correo electrónico');
          
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },
      
      // Reenviar email de verificación
      resendVerificationEmail: async (email) => {
        set({ loading: true, error: null });
        
        try {
          // Crear FormData para enviar los datos como el backend espera
          const formData = new FormData();
          formData.append('email', email.trim());
          
          const response = await instance.post('/api/auth/resend_verification', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.data?.status === 'success') {
            set({ loading: false });
            return { success: true };
          }
          
          throw new Error(response.data?.message || 'Error al reenviar el correo de verificación');
          
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },
      
      // Autenticación con Google
      getGoogleAuthUrl: async () => {
        set({ loading: true, error: null });
        
        try {
          // Hacer la solicitud real al backend para obtener la URL de autenticación
          console.log('Solicitando URL de autenticación de Google al backend');
          
          // Determinar la URL base del backend según el entorno
          const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const backendBaseUrl = isDevelopment ? '' : 'https://plubot-backend.onrender.com';
          
          console.log('URL base del backend:', backendBaseUrl);
          
          // La ruta correcta es /api/auth/google/login (el blueprint google_auth_bp está registrado con prefijo /auth)
          const url = `${backendBaseUrl}/api/auth/google/login`;
          console.log('Enviando solicitud a:', url);
          
          const response = await instance.get(url);
          console.log('Respuesta del backend:', response.data);
          
          if (response.data?.status === 'success' && response.data?.authUrl) {
            set({ loading: false });
            return { success: true, authUrl: response.data.authUrl };
          }
          
          throw new Error(response.data?.message || 'Error al obtener URL de autenticación de Google');
        } catch (error) {
          set({
            loading: false,
            error: error.response?.data?.message || error.message || 'Error al obtener URL de autenticación de Google'
          });
          return { success: false, error: error.message };
        }
      },
      
      // Procesar token de autenticación de Google
      processGoogleAuth: async (token) => {
        set({ loading: true, error: null });
        
        try {
          console.log('Procesando token de autenticación de Google:', token);
          
          // Enviar el token al backend para verificarlo
          const response = await instance.post('/api/auth/google/success', { token });
          console.log('Respuesta del backend al procesar token:', response.data);
          
          if (response.data?.status === 'success') {
            // Guardar el token
            localStorage.setItem('access_token', response.data.access_token);
            
            // Obtener el perfil del usuario
            const profileResponse = await instance.get('/api/auth/profile', {
              headers: {
                'Authorization': `Bearer ${response.data.access_token}`
              }
            });
            
            if (profileResponse.data?.user) {
              set({
                user: profileResponse.data.user,
                isAuthenticated: true,
                loading: false,
                error: null
              });
              
              return { success: true, user: profileResponse.data.user };
            }
          }
          
          throw new Error(response.data?.message || 'Error al procesar autenticación con Google');
          
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },
      
      // Limpiar errores
      clearError: () => set({ error: null }),
      
      // Funciones para establecer el estado directamente (útil para pruebas y desarrollo)
      setUser: (user) => set({ user }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      // Cache para perfiles
      _profileCache: {
        data: null,
        timestamp: 0,
        isValid() {
          return this.data && (Date.now() - this.timestamp) < 30000;
        },
        set(data) {
          this.data = data;
          this.timestamp = Date.now();
        },
        clear() {
          this.data = null;
          this.timestamp = 0;
        }
      },
      
      // Actualizar perfil
      updateProfile: async (updates) => {
        // Evitar actualizaciones duplicadas
        const currentState = get();
        if (currentState.profile.isLoading) {
          return { success: false, message: 'Ya hay una actualización en curso' };
        }
        
        set(state => ({ 
          profile: { 
            ...state.profile, 
            isLoading: true, 
            error: null 
          } 
        }));
        
        try {
          // Crear FormData solo si hay actualizaciones
          const formData = new FormData();
          let hasUpdates = false;
          
          Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, value);
              hasUpdates = true;
            }
          });
          
          if (!hasUpdates) {
            set(state => ({ 
              profile: { 
                ...state.profile, 
                isLoading: false 
              } 
            }));
            return { success: true, user: currentState.user };
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auth] Actualizando perfil...', updates);
          }
          
          const response = await instance.put('/api/auth/profile', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          if (response.data?.status === 'success' && response.data.user) {
            const updatedUser = { ...currentState.user, ...response.data.user };
            
            // Actualizar la caché
            currentState._profileCache.set(updatedUser);
            
            // Actualizar el estado
            set({
              user: updatedUser,
              isAuthenticated: true,
              profile: { 
                ...currentState.profile, 
                isLoading: false, 
                error: null,
                energyLevel: Math.min(updatedUser.plubots?.length * 20 || 0, 100)
              }
            });
            
            if (process.env.NODE_ENV === 'development') {
              console.log('[Auth] Perfil actualizado correctamente');
            }
            
            return { success: true, user: updatedUser };
          }
          
          throw new Error(response.data?.message || 'Error al actualizar el perfil');
          
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
          
          if (process.env.NODE_ENV === 'development') {
            console.error('[Auth] Error al actualizar perfil:', errorMessage);
          }
          
          set(state => ({
            profile: { 
              ...state.profile, 
              isLoading: false,
              error: errorMessage 
            }
          }));
          
          // Si hay un error de autenticación, limpiar la caché
          if (error.response?.status === 401) {
            currentState._profileCache.clear();
            localStorage.removeItem('access_token');
            set({
              isAuthenticated: false,
              user: null,
              loading: false
            });
          }
          
          throw new Error(errorMessage);
        }
      },
      
      // Gamificación
      claimDailyReward: () => {
        set(state => ({
          profile: {
            ...state.profile,
            dailyRewardAvailable: false,
            energyLevel: Math.min(100, (state.profile.energyLevel || 0) + 20)
          }
        }));
        // Aquí iría la llamada a la API para reclamar la recompensa
        return { success: true };
      },
      
      // Utilidades
      clearProfileError: () => set(state => ({ 
        profile: { ...state.profile, error: null } 
      })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectores personalizados
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useAuthError = () => useAuthStore((state) => state.error);

export default useAuthStore;
