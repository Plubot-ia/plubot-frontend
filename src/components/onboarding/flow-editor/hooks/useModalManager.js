import { useCallback } from 'react';

export const useModalManager = () => {
  const openModal = useCallback((modalName) => {
    if (typeof globalThis.openModal === 'function') {
      globalThis.openModal(modalName);
    } else {
      try {
        globalThis.dispatchEvent(
          new CustomEvent('open-modal', {
            detail: { modal: modalName, timestamp: Date.now() },
          }),
        );
      } catch {}
    }
  }, []);

  const closeModal = useCallback((modalName) => {
    if (typeof globalThis.closeModal === 'function') {
      globalThis.closeModal(modalName);
    } else {
      try {
        globalThis.dispatchEvent(
          new CustomEvent('close-modal', {
            detail: { modal: modalName, timestamp: Date.now() },
          }),
        );
      } catch {}
    }
  }, []);

  return { openModal, closeModal };
};
