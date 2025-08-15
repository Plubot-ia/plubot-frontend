import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

import ProtectedRoute from '../../components/auth/ProtectedRoute.jsx';
import PersonalizationForm from '../../components/onboarding/screens/PersonalizationForm';
import TrainingScreen from '../../components/onboarding/screens/TrainingScreen.jsx';

// Lazy load plubot editing pages
const CreatePlubot = lazy(() => import('../../pages/createplubot/CreatePlubot.jsx'));

export default (
  <>
    <Route
      path='/plubot/edit/flow/:plubotId'
      element={
        <ProtectedRoute>
          <TrainingScreen />
        </ProtectedRoute>
      }
    />
    <Route
      path='/plubot/edit/identity/:plubotId'
      element={
        <ProtectedRoute>
          <PersonalizationForm />
        </ProtectedRoute>
      }
    />
    <Route
      path='/plubot/create/:templateId'
      element={
        <ProtectedRoute>
          <CreatePlubot />
        </ProtectedRoute>
      }
    />

    {/* Redirecciones */}
    <Route path='/plubot/edit/training' element={<Navigate to='/training' replace />} />
  </>
);
