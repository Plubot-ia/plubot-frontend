import { useContext } from 'react';

import { PlubotCreationContext } from '../context/PlubotCreationContextObject';

const usePlubotCreation = () => {
  const context = useContext(PlubotCreationContext);
  if (!context) {
    throw new Error('usePlubotCreation debe usarse dentro de un PlubotCreationProvider');
  }
  return context;
};

export default usePlubotCreation;
