import { CheckCircle, MessageCircle, XCircle, ExternalLink } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';

import useAPI from '@/hooks/useAPI';
import useByteMessageContext from '../../../hooks/useByteMessageContext';

import './WhatsappIntegrationPanel.css';

const WhatsappBusinessPanel = ({ plubotId }) => {
  const { showNotification } = useByteMessageContext();
  const { request, isLoading: isApiLoading } = useAPI();

  const [isConnected, setIsConnected] = useState(false);
  const [connectionData, setConnectionData] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showManualConfig, setShowManualConfig] = useState(false);
  const [manualConfig, setManualConfig] = useState({
    phone_number_id: '',
    waba_id: '',
    phone_number: '',
    business_name: ''
  });

  // Verificar estado de conexión
  const checkStatus = useCallback(async () => {
    try {
      const response = await request('GET', `wa/status/${plubotId}`);
      if (response) {
        setConnectionData(response.data);
        setIsConnected(response.data.is_active);
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
  }, [plubotId, checkStatus, showNotification]);

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
      setConnectionData(null);
      setIsConnected(false);
      showNotification('WhatsApp Business desconectado correctamente', 'success');
    } catch (error) {
      showNotification(error.message || 'Error al desconectar', 'error');
    }
  };

  // Enviar mensaje de prueba
  const handleTestMessage = async () => {
    const phoneNumber = prompt('Ingresa el número de WhatsApp para enviar mensaje de prueba (con código de país, ej: 5491123456789):');
    if (!phoneNumber) return;

    try {
      const response = await request('POST', `wa/send/${plubotId}`, {
        to: phoneNumber,
        message: 'Este es un mensaje de prueba desde tu Plubot. ¡La conexión funciona correctamente!'
      });

      if (response?.status === 'success') {
        showNotification('Mensaje de prueba enviado exitosamente', 'success');
      } else {
        showNotification('Error al enviar mensaje de prueba', 'error');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      showNotification('Error al enviar mensaje de prueba', 'error');
    }
  };

  const handleManualConfig = async () => {
    try {
      const response = await request('POST', `wa/configure/${plubotId}`, manualConfig);
      if (response?.status === 'success') {
        showNotification('Configuración actualizada exitosamente', 'success');
        setShowManualConfig(false);
        await checkStatus();
      } else {
        showNotification('Error al actualizar configuración', 'error');
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      showNotification('Error al actualizar configuración', 'error');
    }
  };

  // Renderizar contenido según estado
  const renderContent = () => {
    if (isApiLoading && !connectionData) {
      return <div className='loading-spinner'>Cargando estado...</div>;
    }

    if (connectionData && connectionData.is_active) {
      return (
        <div className="whatsapp-connected">
          <div className="connection-status">
            <span className="status-icon">✅</span>
            <span>WhatsApp Business conectado</span>
          </div>
          
          <div className="connection-details">
            <p><strong>Número:</strong> {connectionData?.phone_number || 'pending_configuration'}</p>
            <p><strong>Nombre del negocio:</strong> {connectionData?.business_name || 'WhatsApp Business'}</p>
            <p><strong>WABA ID:</strong> {connectionData?.waba_id || 'pending_configuration'}</p>
          </div>

          {(connectionData?.phone_number_id === 'pending_configuration' || 
            connectionData?.waba_id === 'pending_configuration') && (
            <div className="manual-config-notice">
              <p className="warning-text">⚠️ La configuración automática no pudo completarse.</p>
              <p className="info-text">Necesitas ingresar los datos de tu WhatsApp Business API manualmente.</p>
              <button 
                onClick={() => setShowManualConfig(!showManualConfig)}
                className="btn-manual-config"
              >
                🔧 {showManualConfig ? 'Ocultar Formulario' : 'Configurar Manualmente'}
              </button>
            </div>
          )}

          {showManualConfig && (
            <div className="manual-config-form">
              <div className="form-header">
                <h4>📋 Configuración Manual de WhatsApp Business</h4>
                <p className="help-text">Copia estos valores desde la configuración de tu API de WhatsApp Business</p>
              </div>
              
              <div className="form-instructions">
                <p className="step-text">📍 Estos valores los encuentras en:</p>
                <ol>
                  <li>Ve a <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer">Facebook Developers</a></li>
                  <li>Selecciona tu aplicación</li>
                  <li>Ve a WhatsApp → Configuración de la API</li>
                  <li>Copia los valores que se muestran ahí</li>
                </ol>
              </div>
              
              <div className="form-group">
                <label>
                  <span className="label-title">📱 Phone Number ID</span>
                  <span className="label-help">Identificador del número de teléfono (ver imagen 2, campo "Identificador de número de teléfono")</span>
                </label>
                <input
                  type="text"
                  value={manualConfig.phone_number_id}
                  onChange={(e) => setManualConfig({...manualConfig, phone_number_id: e.target.value})}
                  placeholder="Ejemplo: 783440158177520"
                  className="config-input"
                />
              </div>
              
              <div className="form-group">
                <label>
                  <span className="label-title">🏢 WABA ID</span>
                  <span className="label-help">Identificador de la cuenta de WhatsApp Business (ver imagen 2, campo "Identificador de la cuenta de WhatsApp Business")</span>
                </label>
                <input
                  type="text"
                  value={manualConfig.waba_id}
                  onChange={(e) => setManualConfig({...manualConfig, waba_id: e.target.value})}
                  placeholder="Ejemplo: 728280003377275"
                  className="config-input"
                />
              </div>
              
              <div className="form-group">
                <label>
                  <span className="label-title">☎️ Número de Teléfono</span>
                  <span className="label-help">Tu número de WhatsApp Business con código de país (ver imagen 2, campo "Para")</span>
                </label>
                <input
                  type="text"
                  value={manualConfig.phone_number}
                  onChange={(e) => setManualConfig({...manualConfig, phone_number: e.target.value})}
                  placeholder="Ejemplo: +54 221 699-6564"
                  className="config-input"
                />
              </div>
              
              <div className="form-group">
                <label>
                  <span className="label-title">🏪 Nombre del Negocio</span>
                  <span className="label-help">El nombre de tu empresa o negocio</span>
                </label>
                <input
                  type="text"
                  value={manualConfig.business_name}
                  onChange={(e) => setManualConfig({...manualConfig, business_name: e.target.value})}
                  placeholder="Ejemplo: Mi Empresa"
                  className="config-input"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  onClick={handleManualConfig}
                  className="btn-save-config"
                  disabled={isApiLoading || !manualConfig.phone_number_id || !manualConfig.waba_id || !manualConfig.phone_number}
                >
                  💾 Guardar Configuración
                </button>
                <button 
                  onClick={() => setShowManualConfig(false)}
                  className="btn-cancel-config"
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="connection-actions">
            <button 
              onClick={handleTestMessage}
              className="btn-test-message"
              disabled={connectionData?.phone_number_id === 'pending_configuration'}
            >
              📱 Enviar Mensaje de Prueba
            </button>
            <button
              className='btn-disconnect'
              onClick={handleDisconnect}
              disabled={isApiLoading}
            >
              ❌ Desconectar
            </button>
          </div>
        </div>
      );
    }

    // Renderizar estado no conectado
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
