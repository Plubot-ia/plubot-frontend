import { useState } from 'react';

import { useModalLifecycle } from './useModalLifecycle';
import { useModalRegistration } from './useModalRegistration';

export const useModalState = () => {
  const [modals, setModals] = useState(new Map());
  const [modalHistory, setModalHistory] = useState([]);

  const { registerModal } = useModalRegistration(setModals);
  const { openModal, closeModal, closeAllModals } = useModalLifecycle(
    modals,
    setModals,
    setModalHistory,
  );

  return {
    modals,
    modalHistory,
    registerModal,
    openModal,
    closeModal,
    closeAllModals,
  };
};
