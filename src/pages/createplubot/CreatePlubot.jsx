import { Routes, Route, Navigate } from 'react-router-dom';

import FactoryScreen from '@/components/onboarding/screens/FactoryScreen';
import PersonalizationForm from '@/components/onboarding/screens/PersonalizationForm';
import TrainingScreen from '@/components/onboarding/screens/TrainingScreen';
import WelcomeSequence from '@/components/onboarding/screens/WelcomeSequence';

const CreatePlubot = () => {
  return (
    <Routes>
      <Route path='/' element={<WelcomeSequence />} />
      <Route path='/factory' element={<FactoryScreen />} />
      <Route path='/personalization' element={<PersonalizationForm />} />
      <Route path='/training/:flowId' element={<TrainingScreen />} />
      <Route path='*' element={<Navigate to='/' />} />
    </Routes>
  );
};

export default CreatePlubot;
