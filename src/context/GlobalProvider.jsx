import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { GlobalContext } from './GlobalContextObject';

const GlobalProvider = ({ children }) => {
  const [activeModals, setActiveModals] = useState(new Map());
  const [byteMessage, setByteMessage] = useState('');
  const [byteMessageType, setByteMessageType] = useState('info');
  const [currentFlowData, setCurrentFlowData] = useState({
    nodes: [],
    edges: [],
    plubotId: undefined,
    plubotName: 'Mi Plubot',
    project: { id: undefined, name: 'Proyecto' },
  });

  const openModal = useCallback((modal) => {
    setActiveModals(new Map([[modal, true]]));
    try {
      globalThis.dispatchEvent(
        new CustomEvent('plubot-open-modal', {
          detail: { modal, source: 'GlobalProvider' },
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
          detail: { modal, source: 'GlobalProvider' },
        }),
      );
    } catch {}
  }, []);

  const setGlobalByteMessage = useCallback((message, type = 'info') => {
    setByteMessage(message);
    setByteMessageType(type);
    try {
      globalThis.dispatchEvent(
        new CustomEvent('plubot-byte-message', {
          detail: { message, type, timestamp: Date.now() },
        }),
      );
    } catch {}
  }, []);

  useEffect(() => {
    const handleOpenModal = (event) => {
      const { modal, source } = event.detail;
      if (modal && source !== 'GlobalProvider') {
        setActiveModals(new Map([[modal, true]]));
      }
    };

    const handleCloseModal = (event) => {
      const { modal, source } = event.detail;
      if (modal && source !== 'GlobalProvider') {
        closeModal(modal);
      }
    };

    const handleByteMessage = (event) => {
      const { message, type } = event.detail;
      if (message) {
        setByteMessage(message);
        setByteMessageType(type || 'info');
      }
    };

    globalThis.addEventListener('plubot-open-modal', handleOpenModal);
    globalThis.addEventListener('plubot-close-modal', handleCloseModal);
    globalThis.addEventListener('plubot-byte-message', handleByteMessage);

    return () => {
      globalThis.removeEventListener('plubot-open-modal', handleOpenModal);
      globalThis.removeEventListener('plubot-close-modal', handleCloseModal);
      globalThis.removeEventListener('plubot-byte-message', handleByteMessage);
    };
  }, [closeModal]);

  const updateCurrentFlowData = useCallback((newData) => {
    setCurrentFlowData((previous) => ({ ...previous, ...newData }));
  }, []);

  useEffect(() => {
    const handleFlowDataUpdate = (event) => {
      try {
        const { nodes, edges, plubotId, plubotName, project } = event.detail;
        updateCurrentFlowData({ nodes, edges, plubotId, plubotName, project });
      } catch {}
    };

    globalThis.addEventListener(
      'plubot-flow-data-update',
      handleFlowDataUpdate,
    );
    return () => {
      globalThis.removeEventListener(
        'plubot-flow-data-update',
        handleFlowDataUpdate,
      );
    };
  }, [updateCurrentFlowData]);

  const contextValue = useMemo(
    () => ({
      activeModals,
      openModal,
      closeModal,
      closeAllModals: () => closeModal('all'),
      byteMessage,
      byteMessageType,
      setByteMessage: setGlobalByteMessage,
      showNotification: setGlobalByteMessage,
      currentFlowData,
      updateCurrentFlowData,
    }),
    [
      activeModals,
      byteMessage,
      byteMessageType,
      closeModal,
      currentFlowData,
      openModal,
      setGlobalByteMessage,
      updateCurrentFlowData,
    ],
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

GlobalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default GlobalProvider;
