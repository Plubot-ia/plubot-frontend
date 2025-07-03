import { useContext } from 'react';

import { GlobalContext } from '../context/GlobalContextObject';

const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error(
      'useGlobalContext debe ser usado dentro de un GlobalProvider',
    );
  }
  return context;
};

export default useGlobalContext;
