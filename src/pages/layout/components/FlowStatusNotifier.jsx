import React, { useState, useEffect } from 'react';

import StatusBubble from '../../../components/onboarding/common/StatusBubble';

const FlowStatusNotifier = () => {
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const handleFlowSaved = (event) => {
      const { success, message } = event.detail ?? {};
      const notificationMessage =
        message || (success ? '✅ Flujo guardado con éxito' : '❌ Error al guardar el flujo');
      setStatusMessage(notificationMessage);
    };

    globalThis.addEventListener('flow-saved', handleFlowSaved);

    return () => {
      globalThis.removeEventListener('flow-saved', handleFlowSaved);
    };
  }, []);

  return <StatusBubble message={statusMessage} />;
};

export default FlowStatusNotifier;
