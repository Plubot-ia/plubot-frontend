import React from 'react';
import { Route, Navigate } from 'react-router-dom';

import FactoryScreen from '../../components/onboarding/screens/FactoryScreen';
import WelcomeSequence from '../../components/onboarding/screens/WelcomeSequence';

export default (
  <>
    {/* Rutas de Onboarding/Training sin protección */}
    <Route path='/welcome' element={<WelcomeSequence />} />
    <Route path='/factory' element={<FactoryScreen />} />

    {/* Redirecciones de Onboarding */}
    <Route path='/plubot/create/factory' element={<Navigate to='/factory' replace />} />
  </>
);
