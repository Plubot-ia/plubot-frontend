import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

import ProtectedRoute from '../../components/auth/ProtectedRoute.jsx';

// Lazy load pluniverse pages
const PluniverseDashboard = lazy(
  () => import('../../pages/pluniversedashboard/PluniverseDashboard.jsx'),
);
const Academy = lazy(() => import('../../pages/pluniverse/Academy.jsx'));
const Marketplace = lazy(() => import('../../pages/marketplace/Marketplace.jsx'));
const Coliseum = lazy(() => import('../../pages/pluniverse/Coliseum.jsx'));
const Tower = lazy(() => import('../../pages/pluniverse/Tower.jsx'));
const Sanctuary = lazy(() => import('../../pages/pluniverse/Sanctuary.jsx'));

export default (
  <>
    <Route
      path='/pluniverse'
      element={
        <ProtectedRoute>
          <PluniverseDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path='/academy'
      element={
        <ProtectedRoute>
          <Academy />
        </ProtectedRoute>
      }
    />
    <Route
      path='/marketplace'
      element={
        <ProtectedRoute>
          <Marketplace />
        </ProtectedRoute>
      }
    />
    <Route
      path='/coliseum'
      element={
        <ProtectedRoute>
          <Coliseum />
        </ProtectedRoute>
      }
    />
    <Route
      path='/tower'
      element={
        <ProtectedRoute>
          <Tower />
        </ProtectedRoute>
      }
    />
    <Route
      path='/sanctuary'
      element={
        <ProtectedRoute>
          <Sanctuary />
        </ProtectedRoute>
      }
    />

    {/* Redirecciones */}
    <Route path='/pluniverse/academy' element={<Navigate to='/academy' replace />} />
    <Route path='/pluniverse/marketplace' element={<Navigate to='/marketplace' replace />} />
    <Route path='/pluniverse/coliseum' element={<Navigate to='/coliseum' replace />} />
    <Route path='/pluniverse/tower' element={<Navigate to='/tower' replace />} />
    <Route path='/pluniverse/sanctuary' element={<Navigate to='/sanctuary' replace />} />
  </>
);
