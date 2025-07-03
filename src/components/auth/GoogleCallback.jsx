import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/use-auth-store';

const GoogleCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore.getState();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('access_token', token);
      checkAuth().then(() => {
        navigate('/dashboard'); // O a la ruta que desees después del login
      });
    } else {
      navigate('/login?error=google_auth_failed');
    }
  }, [location, navigate, checkAuth]);

  return <div>Procesando autenticación...</div>;
};

export default GoogleCallback;
