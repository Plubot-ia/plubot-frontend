import React, { useEffect } from 'react';
import { Routes, useLocation } from 'react-router-dom';

import OnboardingRoutes from './components/OnboardingRoutes.jsx';
import ProtectedRoutes from './components/ProtectedRoutes.jsx';
import PublicRoutes from './components/PublicRoutes.jsx';
import TutorialRoutes from './components/TutorialRoutes.jsx';

// Hook para scroll to top en cambio de ruta
const useScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
};

const MainRoutes = () => {
  useScrollToTop();

  return (
    <Routes>
      {/* Composición de rutas modulares */}
      {PublicRoutes}
      {TutorialRoutes}
      {OnboardingRoutes}
      {ProtectedRoutes}
    </Routes>
  );
};

export default MainRoutes;
