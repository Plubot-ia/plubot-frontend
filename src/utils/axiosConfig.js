import axios from 'axios';

// En desarrollo, usamos el proxy configurado en vite.config.js
// En producción, usamos la URL de la API de producción
const isDevelopment = import.meta.env.MODE === 'development';
const baseURL = isDevelopment 
  ? '/api' // Usará el proxy configurado en vite.config.js
  : (import.meta.env.VITE_API_URL || 'https://plubot-backend.onrender.com/api');

// Log para depurar la configuración
if (isDevelopment) {
  console.log(`[axiosConfig] Modo desarrollo, usando baseURL: ${baseURL}`);
}

const instance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 20000, // 20 segundos de timeout (aumentado para evitar timeouts frecuentes)
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Aceptar códigos de estado 2xx y 4xx
  }
});

// Variable para rastrear si ya hay una solicitud de refresh en curso
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor para añadir el token a las peticiones
instance.interceptors.request.use(
  (config) => {
    // Omitir el token para rutas públicas
    const publicEndpoints = ['/api/auth/login', '/api/auth/register', '/api/contact', '/api/opinion'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      console.log('[axiosConfig] Token de acceso:', token ? 'Presente' : 'No encontrado');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (isDevelopment && !config.url?.includes('/api/auth/profile')) {
          console.log('[axiosConfig] Token añadido a la petición:', config.url);
        }
      } else if (isDevelopment) {
        console.warn('[axiosConfig] No se encontró token de autenticación para:', config.url);
      }
    }
    
    // Evitar caché para las peticiones de autenticación
    if (config.url?.includes('/api/auth/')) {
      config.params = { ...config.params, _: Date.now() };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas de error
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si el error es 401 y no es una solicitud de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Si ya estamos refrescando, encolar la petición
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${baseURL}/auth/refresh`, { 
            refresh_token: refreshToken 
          }, {
            _retry: true // Marcar como reintento para evitar bucles
          });
          
          const { access_token } = response.data;
          
          if (access_token) {
            // Guardar el nuevo token
            localStorage.setItem('access_token', access_token);
            
            // Procesar la cola de peticiones pendientes
            processQueue(null, access_token);
            
            // Reintentar la petición original con el nuevo token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return instance(originalRequest);
          }
        }
        
        // Si no hay refresh token o no se pudo renovar
        throw new Error('No se pudo renovar la sesión');
        
      } catch (refreshError) {
        // Procesar la cola con error
        processQueue(refreshError, null);
        
        if (isDevelopment) {
          console.error('[axiosConfig] Error al renovar el token:', refreshError.message);
        }
        
        // Redirigir al login si no se puede renovar el token
        if (window.location.pathname !== '/auth/login') {
          if (isDevelopment) {
            console.log('[axiosConfig] Redirigiendo a login por sesión expirada');
          }
          
          // Limpiar tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          
          // Redirigir con parámetro de sesión expirada
          window.location.href = '/auth/login?session_expired=true';
        }
        
        return Promise.reject(refreshError);
        
      } finally {
        isRefreshing = false;
      }
    }
    
    // Si el error no es 401 o ya se reintentó, rechazar la promesa
    return Promise.reject(error);
  }
);

export default instance;