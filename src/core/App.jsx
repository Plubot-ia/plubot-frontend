import React, { Suspense } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';

import ModalContainer from '../components/modals/ModalContainer';
import AuthInitializer from '../components/system/AuthInitializer.jsx';
import ErrorBoundary from '../components/system/ErrorBoundary.jsx';
import LoadingFallback from '../components/system/LoadingFallback.jsx';
import ScrollToTop from '../components/system/ScrollToTop.jsx';
import GamificationProvider from '../context/GamificationContext';
import GlobalProvider from '../context/GlobalProvider';
import { PlubotCreationProvider } from '../context/PlubotCreationContext';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import Layout from '../pages/layout/Layout.jsx';
import AuthRoutes from '../routes/AuthRoutes.jsx';
import MainRoutes from '../routes/MainRoutes.jsx';
import useAuthStore from '../stores/use-auth-store';

const AppWrapper = () => {
  const { isAuthenticated, logout } = useAuthStore();

  // Cierra la sesión después de 15 minutos de inactividad.
  useIdleTimeout(logout, 900, isAuthenticated);
  const location = useLocation();
  const { pathname } = location;

  const authRoutePaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password/',
    '/change-password',
    '/verify-email/',
    '/auth/google/callback',
    '/resend-verification',
    '/auth/verify-email',
  ];

  const isAuthPage = authRoutePaths.some((route) => pathname.startsWith(route));

  const hideHeaderFooterPaths = [
    '/training',
    '/plubot/edit',
    '/plubot/create/training',
    '/benchmark',
  ];

  const shouldHideHeaderFooter = hideHeaderFooterPaths.some((route) => pathname.startsWith(route));

  return (
    <ErrorBoundary>
      <AuthInitializer>
        <GamificationProvider>
          <PlubotCreationProvider>
            <ModalContainer />
            <Suspense fallback={<LoadingFallback />}>
              {isAuthPage ? (
                <AuthRoutes />
              ) : (
                <Layout hideHeaderFooter={shouldHideHeaderFooter}>
                  <ScrollToTop />
                  <MainRoutes />
                </Layout>
              )}
            </Suspense>
          </PlubotCreationProvider>
        </GamificationProvider>
      </AuthInitializer>
    </ErrorBoundary>
  );
};

const App = () => (
  <GlobalProvider>
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppWrapper />
    </Router>
  </GlobalProvider>
);

export default App;
