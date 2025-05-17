import axios from 'axios';

const isDevelopment = import.meta.env.MODE === 'development';
const baseURL = isDevelopment 
  ? 'http://127.0.0.1:5000' // URL del backend local en desarrollo
  : import.meta.env.VITE_API_URL || 'https://plubot-backend.onrender.com';

// Log para depurar la URL base
console.log(`[axiosConfig] Usando baseURL: ${baseURL}`);

const instance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para añadir el token a las peticiones
instance.interceptors.request.use(
  (config) => {
    // Omitir el token para rutas públicas
    const publicEndpoints = ['/api/auth/login', '/api/auth/register', '/api/contact', '/api/opinion'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[axiosConfig] Token añadido a la petición:', config.url);
      } else {
        console.warn('[axiosConfig] No se encontró token de autenticación');
      }
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
      originalRequest._retry = true;
      
      try {
        // Intentar renovar el token
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${baseURL}/api/auth/refresh`, { refresh_token: refreshToken });
          const { access_token } = response.data;
          
          if (access_token) {
            // Guardar el nuevo token
            localStorage.setItem('access_token', access_token);
            
            // Reintentar la petición original con el nuevo token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return instance(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('[axiosConfig] Error al renovar el token:', refreshError);
        // Redirigir al login si no se puede renovar el token
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login?session_expired=true';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;