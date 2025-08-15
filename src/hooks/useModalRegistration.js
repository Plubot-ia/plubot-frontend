import { useState, useCallback } from 'react';

export const useModalRegistration = (setModals) => {
  const [idCounter, setIdCounter] = useState(1);

  const registerModal = useCallback(
    (id, options = {}) => {
      if (id === '__proto__' || id === 'constructor' || id === 'prototype') {
        return;
      }
      const modalId = id || `modal-${idCounter}`;

      setModals((previous) => {
        const newModals = new Map(previous);
        const baseModal = newModals.get(modalId) || {
          id: modalId,
          isOpen: false,
          data: undefined,
          blocking: false,
          zIndex: 1000,
          size: 'medium',
          onBeforeClose: undefined,
          history: false,
        };
        const finalModal = { ...baseModal, ...options };
        newModals.set(modalId, finalModal);
        return newModals;
      });

      if (!id) {
        setIdCounter((previous) => previous + 1);
      }

      return modalId;
    },
    [idCounter, setModals],
  );

  return { registerModal };
};
