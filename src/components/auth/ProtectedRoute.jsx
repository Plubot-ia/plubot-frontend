import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore(state => ({ 
    isAuthenticated: state.isAuthenticated, 
    loading: state.loading 
  }));
  const location = useLocation();

  // Mientras se verifica la autenticación, no renderizar nada o un loader
  if (loading) {
    return <div>Cargando...</div>; // O un spinner/loader más sofisticado
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Si está autenticado, renderizar el componente hijo
  return children;
};

export default ProtectedRoute;
