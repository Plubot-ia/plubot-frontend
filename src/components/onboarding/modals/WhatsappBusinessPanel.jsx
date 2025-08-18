import PropTypes from 'prop-types';
import React, { useState } from 'react';

import useWhatsappConnection from '@/hooks/useWhatsappConnection';

import useByteMessageContext from '../../../hooks/useByteMessageContext';

import WhatsappConnectionStatus from './WhatsappConnectionStatus';
import WhatsappConnectPrompt from './WhatsappConnectPrompt';
import WhatsappManualConfigForm from './WhatsappManualConfigForm';

import './WhatsappIntegrationPanel.css';

const WhatsappBusinessPanel = ({ plubotId }) => {
  const { showNotification } = useByteMessageContext();
  const [showManualConfig, setShowManualConfig] = useState(false);
  const [manualConfig, setManualConfig] = useState({
    phone_number_id: '',
    waba_id: '',
    phone_number: '',
    business_name: '',
  });

  const {
    connectionData,
    isConnecting,
    isApiLoading,
    handleConnect,
    handleDisconnect,
    handleTestMessage,
    handleManualConfig: saveManualConfig,
  } = useWhatsappConnection(plubotId, showNotification);

  const handleManualConfigSave = async () => {
    const success = await saveManualConfig(manualConfig);
    if (success) {
      setShowManualConfig(false);
    }
  };

  // Renderizar contenido según estado
  const renderContent = () => {
    if (isApiLoading && !connectionData) {
      return <div className='loading-spinner'>Cargando estado...</div>;
    }

    if (connectionData && connectionData.is_active) {
      return (
        <>
          <WhatsappConnectionStatus
            connectionData={connectionData}
            onTestMessage={handleTestMessage}
            onDisconnect={handleDisconnect}
            isApiLoading={isApiLoading}
          />

          {(connectionData?.phone_number_id === 'pending_configuration' ||
            connectionData?.waba_id === 'pending_configuration') && (
            <div className='manual-config-notice'>
              <p className='warning-text'>⚠️ La configuración automática no pudo completarse.</p>
              <p className='info-text'>
                Necesitas ingresar los datos de tu WhatsApp Business API manualmente.
              </p>
              <button
                onClick={() => setShowManualConfig(!showManualConfig)}
                className='btn-manual-config'
              >
                🔧 {showManualConfig ? 'Ocultar Formulario' : 'Configurar Manualmente'}
              </button>
            </div>
          )}

          {showManualConfig && (
            <WhatsappManualConfigForm
              manualConfig={manualConfig}
              onConfigChange={setManualConfig}
              onSave={handleManualConfigSave}
              onCancel={() => setShowManualConfig(false)}
              isApiLoading={isApiLoading}
            />
          )}
        </>
      );
    }

    // Renderizar estado no conectado
    return (
      <WhatsappConnectPrompt
        onConnect={handleConnect}
        isApiLoading={isApiLoading}
        isConnecting={isConnecting}
      />
    );
  };

  return (
    <div className='whatsapp-integration-panel'>
      <h3>💬 WhatsApp Business API</h3>
      <p className='whatsapp-explanation'>
        Conecta tu cuenta oficial de WhatsApp Business para automatizar conversaciones con tus
        clientes. Esta integración usa la API oficial de Meta/Facebook.
      </p>
      {renderContent()}
    </div>
  );
};

WhatsappBusinessPanel.propTypes = {
  plubotId: PropTypes.string.isRequired,
};

export default WhatsappBusinessPanel;
