import PropTypes from 'prop-types';
import { useState, useCallback, useMemo, useEffect } from 'react';

import { ModalContext } from './ModalContext';

const ModalProvider = ({ children }) => {
  const [activeModals, setActiveModals] = useState(new Map());

  const openModal = useCallback((modal) => {
    setActiveModals(new Map([[modal, true]]));
    try {
      globalThis.dispatchEvent(
        new CustomEvent('plubot-open-modal', {
          detail: { modal, source: 'ModalProvider' },
        }),
      );
    } catch {}
  }, []);

  const closeModal = useCallback((modal) => {
    setActiveModals((previous) => {
      const newMap = new Map(previous);
      if (modal === 'all') {
        return new Map();
      }
      newMap.delete(modal);
      return newMap;
    });
    try {
      globalThis.dispatchEvent(
        new CustomEvent('plubot-close-modal', {
          detail: { modal, source: 'ModalProvider' },
        }),
      );
    } catch {}
  }, []);

  useEffect(() => {
    const handleOpenModal = (event) => {
      const { modal, source } = event.detail;
      if (modal && source !== 'ModalProvider') {
        setActiveModals(new Map([[modal, true]]));
      }
    };

    const handleCloseModal = (event) => {
      const { modal, source } = event.detail;
      if (modal && source !== 'ModalProvider') {
        closeModal(modal);
      }
    };

    globalThis.addEventListener('plubot-open-modal', handleOpenModal);
    globalThis.addEventListener('plubot-close-modal', handleCloseModal);

    return () => {
      globalThis.removeEventListener('plubot-open-modal', handleOpenModal);
      globalThis.removeEventListener('plubot-close-modal', handleCloseModal);
    };
  }, [closeModal]);

  const contextValue = useMemo(
    () => ({
      activeModals,
      openModal,
      closeModal,
      closeAllModals: () => closeModal('all'),
    }),
    [activeModals, openModal, closeModal],
  );

  return <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>;
};

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ModalProvider;
