import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import Loader from '../common/Loader.jsx';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, checkAuth } = useAuthStore();
  const location = useLocation();

  // Verificar la autenticación al montar el componente
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      checkAuth();
    }
  }, [isAuthenticated, loading, checkAuth]);

  if (loading) {
    return <Loader />; // Muestra el loader mientras se verifica la autenticación
  }

  // Si no está autenticado, redirigir a la página de login
  if (!isAuthenticated) {
    // Guardar la ruta actual para redirigir después del login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Si está autenticado, renderizar los hijos
  return children;
};

export default PrivateRoute;
