import PropTypes from 'prop-types';
import { useState, useCallback, useMemo, useEffect } from 'react';

import useTrainingStore from '@/stores/use-training-store';

import { ByteMessageContext } from './ByteMessageContext';

const ByteMessageProvider = ({ children }) => {
  const [byteMessage, setByteMessage] = useState('');
  const [byteMessageType, setByteMessageType] = useState('info');
  const setTrainingByteMessage = useTrainingStore((state) => state.setByteMessage);

  const setGlobalByteMessage = useCallback(
    (message, type = 'info') => {
      setByteMessage(message);
      setByteMessageType(type);

      // Actualizar también el store de training para que se muestre en la UI
      setTrainingByteMessage(message, type);

      try {
        globalThis.dispatchEvent(
          new CustomEvent('plubot-byte-message', {
            detail: { message, type, timestamp: Date.now() },
          }),
        );
      } catch {}
    },
    [setTrainingByteMessage],
  );

  useEffect(() => {
    const handleByteMessage = (event) => {
      const { message, type } = event.detail;
      if (message) {
        setByteMessage(message);
        setByteMessageType(type || 'info');
        // Actualizar también el store de training
        setTrainingByteMessage(message);
      }
    };

    globalThis.addEventListener('plubot-byte-message', handleByteMessage);

    return () => {
      globalThis.removeEventListener('plubot-byte-message', handleByteMessage);
    };
  }, [setTrainingByteMessage]);

  const contextValue = useMemo(
    () => ({
      byteMessage,
      byteMessageType,
      setByteMessage: setGlobalByteMessage,
      showNotification: setGlobalByteMessage,
    }),
    [byteMessage, byteMessageType, setGlobalByteMessage],
  );

  return <ByteMessageContext.Provider value={contextValue}>{children}</ByteMessageContext.Provider>;
};

ByteMessageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ByteMessageProvider;
