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
});

instance.interceptors.request.use((config) => {
  // Omitir el token para /api/contact y /api/opinion
  if (!['/api/contact', '/api/opinion'].includes(config.url)) {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default instance;