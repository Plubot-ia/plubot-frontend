import PropTypes from 'prop-types';
import { useState, useCallback, useMemo, useEffect } from 'react';

import { ByteMessageContext } from './ByteMessageContext';

const ByteMessageProvider = ({ children }) => {
  const [byteMessage, setByteMessage] = useState('');
  const [byteMessageType, setByteMessageType] = useState('info');

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
    const handleByteMessage = (event) => {
      const { message, type } = event.detail;
      if (message) {
        setByteMessage(message);
        setByteMessageType(type || 'info');
      }
    };

    globalThis.addEventListener('plubot-byte-message', handleByteMessage);

    return () => {
      globalThis.removeEventListener('plubot-byte-message', handleByteMessage);
    };
  }, []);

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
