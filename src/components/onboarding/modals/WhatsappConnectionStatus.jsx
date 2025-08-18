import PropTypes from 'prop-types';
import React from 'react';

const WhatsappConnectionStatus = ({
  connectionData,
  onTestMessage,
  onDisconnect,
  isApiLoading,
}) => (
  <div className='whatsapp-connected'>
    <div className='connection-status'>
      <span className='status-icon'>✅</span>
      <span>WhatsApp Business conectado</span>
    </div>

    <div className='connection-details'>
      <p>
        <strong>Número:</strong> {connectionData?.phone_number || 'pending_configuration'}
      </p>
      <p>
        <strong>Nombre del negocio:</strong> {connectionData?.business_name || 'WhatsApp Business'}
      </p>
      <p>
        <strong>WABA ID:</strong> {connectionData?.waba_id || 'pending_configuration'}
      </p>
    </div>

    <div className='connection-actions'>
      <button
        onClick={onTestMessage}
        className='btn-test-message'
        disabled={connectionData?.phone_number_id === 'pending_configuration'}
      >
        📱 Enviar Mensaje de Prueba
      </button>
      <button className='btn-disconnect' onClick={onDisconnect} disabled={isApiLoading}>
        ❌ Desconectar
      </button>
    </div>
  </div>
);

WhatsappConnectionStatus.propTypes = {
  connectionData: PropTypes.shape({
    phone_number: PropTypes.string,
    business_name: PropTypes.string,
    waba_id: PropTypes.string,
    phone_number_id: PropTypes.string,
  }),
  onTestMessage: PropTypes.func.isRequired,
  onDisconnect: PropTypes.func.isRequired,
  isApiLoading: PropTypes.bool.isRequired,
};

export default WhatsappConnectionStatus;
