import { useContext } from 'react';

import { ModalContext } from '../context/modal/ModalContext';

const useModalContext = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};

export default useModalContext;
