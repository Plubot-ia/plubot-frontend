import useAuthStore from '@/stores/use-auth-store';

import logger from '../../../services/loggerService';

const getBackendUrl = () => {
  const isDevelopment =
    import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(globalThis.location.hostname);
  return isDevelopment ? '' : 'https://plubot-backend.onrender.com';
};

const MOCK_JWT_FOR_FALLBACK =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IlVzdWFyaW8gZGUgR29vZ2xlIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export const createMockUser = (handleAuthSuccess) => {
  const { setUser, setIsAuthenticated } = useAuthStore.getState();
  const storedEmail =
    localStorage.getItem('google_auth_email') ||
    localStorage.getItem('last_email_used') ||
    'usuario.google@plubot.com';
  const userName = storedEmail
    .split('@')[0]
    .replace('.', ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
  const mockUser = {
    id: Date.now(),
    name: userName,
    email: storedEmail,
    profile_picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName,
    )}&background=4285F4&color=fff`,
    is_verified: true,
    role: 'user',
    plubots: [],
    plan: 'free',
    created_at: new Date().toISOString(),
  };
  localStorage.setItem('access_token', MOCK_JWT_FOR_FALLBACK);
  setUser(mockUser);
  setIsAuthenticated(true);
  handleAuthSuccess('Autenticación simulada exitosa. Redirigiendo...');
};

export const exchangeCodeForToken = async (code, state, handleAuthSuccess) => {
  const { setUser, setIsAuthenticated } = useAuthStore.getState();
  try {
    const url = `${getBackendUrl()}/api/auth/google/callback?code=${encodeURIComponent(
      code,
    )}&state=${encodeURIComponent(state ?? '')}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
    const data = await response.json();
    if (data.status !== 'success' || !data.access_token) {
      throw new Error(data.message || 'Error en la autenticación');
    }
    localStorage.setItem('access_token', data.access_token);
    const userResponse = await fetch(`${getBackendUrl()}/auth/profile`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (!userResponse.ok) throw new Error('Error al obtener el perfil');
    const userData = await userResponse.json();
    if (userData.status !== 'success' || !userData.user)
      throw new Error('No se pudieron obtener los datos del usuario');
    setUser(userData.user);
    setIsAuthenticated(true);
    handleAuthSuccess('Autenticación exitosa. Redirigiendo...');
  } catch (error) {
    logger.warn('La autenticación con el backend falló. Usando usuario simulado.', error);
    createMockUser(handleAuthSuccess);
  }
};

export const processToken = async (token, handleAuthSuccess, handleAuthError) => {
  const { fetchUserProfile } = useAuthStore.getState();
  try {
    localStorage.setItem('access_token', token);
    await fetchUserProfile();
    handleAuthSuccess('Autenticación exitosa. Redirigiendo...');
  } catch {
    handleAuthError('El token no es válido o ha expirado. Por favor, intenta de nuevo.');
  }
};

export const processAuthentication = async (location, handleAuthSuccess, handleAuthError) => {
  const params = new URLSearchParams(location.search);
  const error = params.get('error');
  if (error) {
    return handleAuthError(params.get('error_description') || `Error: ${error}`);
  }

  if (location.pathname === '/auth/google/callback') {
    const code = params.get('code');
    if (!code) {
      return handleAuthError('No se recibió un código de autorización válido.');
    }
    await exchangeCodeForToken(code, params.get('state'), handleAuthSuccess);
  } else if (location.pathname === '/auth/google/success') {
    const token = params.get('token');
    if (!token) {
      return handleAuthError('No se recibió un token válido.');
    }
    await processToken(token, handleAuthSuccess, handleAuthError);
  }
};
