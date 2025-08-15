import { CheckCircle, MessageCircle, XCircle, ExternalLink } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';

import useAPI from '@/hooks/useAPI';
import useByteMessageContext from '../../../hooks/useByteMessageContext';

import './WhatsappIntegrationPanel.css';

const WhatsappBusinessPanel = ({ plubotId }) => {
  const { showNotification } = useByteMessageContext();
  const { request, isLoading: isApiLoading } = useAPI();

  const [connection, setConnection] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Verificar estado de conexión
  const checkStatus = useCallback(async () => {
    try {
      const response = await request('GET', `wa/status/${plubotId}`);
      if (response) {
        setConnection(response.data);
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
    }
  }, [plubotId, request]);

  useEffect(() => {
    checkStatus();
    
    // Escuchar mensajes del callback OAuth
    const handleMessage = (event) => {
      // Verificar origen por seguridad
      if (event.origin !== 'https://plubot.com') return;
      
      if (event.data.type === 'whatsapp-oauth-success') {
        showNotification('WhatsApp Business conectado exitosamente', 'success');
        checkStatus(); // Actualizar estado
      } else if (event.data.type === 'whatsapp-oauth-error') {
        showNotification(event.data.error || 'Error al conectar WhatsApp Business', 'error');
        setIsConnecting(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [plubotId, checkStatus]);

  // Iniciar proceso de conexión OAuth
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await request('POST', `wa/connect/${plubotId}`);
      
      if (response && response.oauth_url) {
        // Abrir ventana de OAuth
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const authWindow = window.open(
          response.oauth_url,
          'WhatsApp Business OAuth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Verificar cuando se complete la autenticación
        const checkInterval = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkInterval);
            setIsConnecting(false);
            checkStatus(); // Verificar nuevo estado
          }
        }, 1000);
      }
    } catch (error) {
      showNotification(error.message || 'Error al iniciar la conexión', 'error');
      setIsConnecting(false);
    }
  };

  // Desconectar WhatsApp
  const handleDisconnect = async () => {
    try {
      await request('POST', `wa/disconnect/${plubotId}`);
      setConnection(null);
      showNotification('WhatsApp Business desconectado correctamente', 'success');
    } catch (error) {
      showNotification(error.message || 'Error al desconectar', 'error');
    }
  };

  // Enviar mensaje de prueba
  const handleTestMessage = async () => {
    try {
      const testNumber = prompt('Ingresa el número de WhatsApp para enviar mensaje de prueba (con código de país, ej: 5491123456789):');
      if (!testNumber) return;

      const response = await request('POST', `wa/send/${plubotId}`, {
        to: testNumber,
        message: '¡Hola! Este es un mensaje de prueba desde Plubot 🤖'
      });

      if (response.status === 'success') {
        showNotification('Mensaje de prueba enviado correctamente', 'success');
      }
    } catch (error) {
      showNotification(error.message || 'Error al enviar mensaje de prueba', 'error');
    }
  };

  // Renderizar contenido según estado
  const renderContent = () => {
    if (isApiLoading && !connection) {
      return <div className='loading-spinner'>Cargando estado...</div>;
    }

    if (connection && connection.is_active) {
      return (
        <div className='connection-status connected'>
          <CheckCircle size={40} color='#25D366' />
          <h4>¡Conectado a WhatsApp Business!</h4>
          <div className='connection-details'>
            <p><strong>Número:</strong> {connection.phone_number || 'Configurando...'}</p>
            <p><strong>Nombre del negocio:</strong> {connection.business_name || 'Configurando...'}</p>
            {connection.waba_id && (
              <p className='connection-id'><strong>WABA ID:</strong> {connection.waba_id}</p>
            )}
          </div>
          
          <div className='connection-actions'>
            <button
              className='whatsapp-button test'
              onClick={handleTestMessage}
              disabled={isApiLoading}
            >
              <MessageCircle size={18} />
              Enviar Mensaje de Prueba
            </button>
            
            <button
              className='whatsapp-button disconnect'
              onClick={handleDisconnect}
              disabled={isApiLoading}
            >
              <XCircle size={18} />
              Desconectar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className='initiate-connection'>
        <MessageCircle size={40} color='#6c757d' />
        <h4>Conecta tu WhatsApp Business</h4>
        <p>
          Vincula tu cuenta de WhatsApp Business API para que este flujo pueda enviar y recibir mensajes automáticamente.
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
          onClick={handleConnect} 
          disabled={isApiLoading || isConnecting}
        >
          <ExternalLink size={18} />
          {isConnecting ? 'Conectando...' : 'Conectar con Facebook'}
        </button>
        
        <p className='privacy-note'>
          <small>
            Al conectar, autorizas a Plubot a enviar y recibir mensajes en tu nombre. 
            Tus datos están protegidos y puedes desconectar en cualquier momento.
          </small>
        </p>
      </div>
    );
  };

  return (
    <div className='whatsapp-integration-panel'>
      <h3>💬 WhatsApp Business API</h3>
      <p className='whatsapp-explanation'>
        Conecta tu cuenta oficial de WhatsApp Business para automatizar conversaciones con tus clientes.
        Esta integración usa la API oficial de Meta/Facebook.
      </p>
      {renderContent()}
    </div>
  );
};

WhatsappBusinessPanel.propTypes = {
  plubotId: PropTypes.string.isRequired,
};

export default WhatsappBusinessPanel;
