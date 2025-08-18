import { MessageCircle, ExternalLink } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

const WhatsappConnectPrompt = ({ onConnect, isApiLoading, isConnecting }) => (
  <div className='initiate-connection'>
    <MessageCircle size={40} color='#6c757d' />
    <h4>Conecta tu WhatsApp Business</h4>
    <p>
      Vincula tu cuenta de WhatsApp Business API para que este flujo pueda enviar y recibir mensajes
      automáticamente.
    </p>

    <div className='requirements-list'>
      <h5>Requisitos:</h5>
      <ul>
        <li>Cuenta de Facebook Business</li>
        <li>Número de WhatsApp Business verificado</li>
        <li>Permisos de administrador en la cuenta</li>
      </ul>
    </div>

    <button
      className='whatsapp-button connect'
      onClick={onConnect}
      disabled={isApiLoading || isConnecting}
    >
      <ExternalLink size={18} />
      {isConnecting ? 'Conectando...' : 'Conectar con Facebook'}
    </button>

    <p className='privacy-note'>
      <small>
        Al conectar, autorizas a Plubot a enviar y recibir mensajes en tu nombre. Tus datos están
        protegidos y puedes desconectar en cualquier momento.
      </small>
    </p>
  </div>
);

WhatsappConnectPrompt.propTypes = {
  onConnect: PropTypes.func.isRequired,
  isApiLoading: PropTypes.bool.isRequired,
  isConnecting: PropTypes.bool.isRequired,
};

export default WhatsappConnectPrompt;
