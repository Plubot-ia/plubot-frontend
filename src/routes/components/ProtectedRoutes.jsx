import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

import Logout from '../../components/auth/Logout.jsx';
import ProtectedRoute from '../../components/auth/ProtectedRoute.jsx';
import PersonalizationForm from '../../components/onboarding/screens/PersonalizationForm';
import TrainingScreen from '../../components/onboarding/screens/TrainingScreen.jsx';

import PlubotRoutes from './PlubotRoutes.jsx';
import PluniverseRoutes from './PluniverseRoutes.jsx';

const Profile = lazy(() => import('../../pages/profile/Profile.jsx'));

export default (
  <>
    {/* Rutas de Plubot y Pluniverso */}
    {PluniverseRoutes}
    {PlubotRoutes}

    {/* Rutas de Perfil y Autenticación */}
    <Route
      path='/profile'
      element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      }
    />
    <Route
      path='/logout'
      element={
        <ProtectedRoute>
          <Logout />
        </ProtectedRoute>
      }
    />

    {/* Rutas de Onboarding/Training con protección */}
    <Route
      path='/personalization'
      element={
        <ProtectedRoute>
          <PersonalizationForm />
        </ProtectedRoute>
      }
    />
    <Route
      path='/training'
      element={
        <ProtectedRoute>
          <TrainingScreen />
        </ProtectedRoute>
      }
    />
  </>
);
