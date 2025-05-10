import { Routes, Route, Navigate } from 'react-router-dom';
import WelcomeSequence from '@/components/onboarding/WelcomeSequence';
import FactoryScreen from '@/components/onboarding/FactoryScreen';
import PersonalizationForm from '@/components/onboarding/PersonalizationForm';
import TrainingScreen from '@/components/onboarding/TrainingScreen';

const CreatePlubot = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomeSequence />} />
      <Route path="/welcome" element={<WelcomeSequence />} />
      <Route path="/factory" element={<FactoryScreen />} />
      <Route path="/personalization" element={<PersonalizationForm />} />
      <Route path="/training" element={<TrainingScreen />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default CreatePlubot;
