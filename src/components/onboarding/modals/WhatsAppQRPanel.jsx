import { AlertCircle, MessageCircle, RefreshCw, Shield, Users, Zap } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import whatsappService from '../../../services/whatsappService';

import {
  ConnectedView,
  QRCodeDisplay,
  QRInstructions,
  StatusIndicator,
} from './WhatsAppQRPanelHelpers';
import './WhatsAppQRPanel.css';

const WhatsAppQRPanel = ({ plubotId, nodes, edges }) => {
  // Get auth token from localStorage
  const token = localStorage.getItem('access_token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : undefined;

  // Simple notification function
  const showNotification = useCallback(() => {
    // Notification system placeholder
  }, []);

  const [qrCode, setQrCode] = useState();
  const [status, setStatus] = useState('initializing'); // initializing, waiting_qr, scanning, authenticated, ready, error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const initializingRef = useRef(false);
  const sessionId = useRef(null);
  
  // Set sessionId when user and plubotId are available
  useEffect(() => {
    const userId = user?.id || localStorage.getItem('userId') || 'test';
    sessionId.current = `${userId}-${plubotId}`;
    console.log('📌 Session ID set to:', sessionId.current);
  }, [user, plubotId]);

  // Initialize WhatsApp session
  const initializeSession = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (initializingRef.current) {
      // Already initializing, skipping
      return;
    }

    try {
      const isInitializing = true;
      initializingRef.current = isInitializing;
      setIsLoading(true);
      setError(undefined);
      setStatus('initializing');

      // Start QR session via backend
      const userId = user?.id || localStorage.getItem('userId') || 'test';
      const response = await whatsappService.startQRSession(userId, plubotId, token);
      
      // Update sessionId
      sessionId.current = `${userId}-${plubotId}`;

      if (response.success) {
        setStatus('waiting_qr');
        setHasInitialized(true);

        // Initialize Socket.IO connection for real-time updates
        whatsappService.initializeSocket(userId, plubotId);

        // Get initial QR code or check if already authenticated
        const qrData = await whatsappService.getQRCode(userId, plubotId);
        
        // Check if session is already authenticated
        if (qrData.status === 'ready' || qrData.status === 'authenticated') {
          console.log('✅ Session already authenticated!');
          setStatus('ready');
          setQrCode('');
          showNotification('WhatsApp ya está conectado', 'success');
        } else if (qrData.qrCode) {
          setQrCode(qrData.qrCode);
        } else if (qrData.qr) {
          setQrCode(qrData.qr);
        }

        // Sync flow data
        await whatsappService.syncFlowData(userId, plubotId, {
          nodes: nodes || [],
          edges: edges || [],
        });
      } else {
        throw new Error(response.message || 'Failed to start WhatsApp session');
      }
    } catch (error_) {
      // Error initializing WhatsApp session
      setError(error_.message || 'Error al iniciar sesión de WhatsApp');
      setStatus('error');
      // Only show notification once
      if (!hasInitialized) {
        showNotification('Error al conectar con WhatsApp', 'error');
      }
    } finally {
      setIsLoading(false);
      // Avoid race condition by setting ref after state update
      setTimeout(() => {
        initializingRef.current = false;
      }, 0);
    }
  }, [plubotId, token, user, hasInitialized, nodes, edges, showNotification]);

  // Handle QR updates
  useEffect(() => {
    if (!sessionId.current) return;
    
    console.log('🔌 Setting up WebSocket subscriptions for sessionId:', sessionId.current);
    
    const unsubscribeCallbacks = whatsappService.subscribeToStatusUpdates({
      sessionId: sessionId.current,
      onQRUpdate: (data) => {
        console.log('📱 QR Update received:', data);
        if (data.qr && data.sessionId === sessionId.current) {
          setQrCode(data.qr);
          setStatus('waiting_qr');
          setError(null);
          
          // Check if too many QR attempts
          if (data.attempt && data.attempt > 5) {
            setError('Demasiados intentos. Por favor, desvincula dispositivos antiguos en WhatsApp.');
            notification.warning({
              message: 'Límite de dispositivos',
              description: 'WhatsApp tiene un límite de dispositivos vinculados. Desvincula dispositivos antiguos desde tu teléfono.',
              duration: 10,
            });
          }
        }
      },
      onStatusUpdate: (data) => {
        console.log('📊 Status Update received:', data);
        console.log('Current sessionId:', sessionId.current);
        console.log('Data sessionId:', data.sessionId);
        
        // Only update if it's for our session
        if (data.sessionId && data.sessionId !== sessionId.current) {
          console.log('Ignoring status update for different session');
          return;
        }
        
        console.log('Setting status to:', data.status);
        setStatus(data.status);

        switch (data.status) {
          case 'authenticated': {
            console.log('✅ WhatsApp authenticated!', data);
            showNotification('WhatsApp conectado exitosamente', 'success');
            if (data.phoneNumber) {
              setPhoneNumber(data.phoneNumber);
            }

            break;
          }
          case 'ready': {
            console.log('🚀 WhatsApp ready!', data);
            showNotification('WhatsApp listo para recibir mensajes', 'success');
            if (data.phoneNumber) {
              setPhoneNumber(data.phoneNumber);
            }

            break;
          }
          case 'disconnected': {
            showNotification('WhatsApp desconectado', 'warning');
            setQrCode('');

            break;
          }
          case 'auth_failed': {
            setError('Autenticación fallida. Por favor, intenta de nuevo.');
            showNotification('Error de autenticación', 'error');

            break;
          }
          // No default
        }
      },
      onAuthFailed: (data) => {
        console.log('Auth failed:', data);
        setStatus('auth_failed');
        setError(data.error || 'Autenticación fallida. Por favor, intenta de nuevo.');
        notification.error({
          message: 'Error de Autenticación',
          description: data.error || 'No se pudo autenticar con WhatsApp',
        });
      },
    });

    return () => {
      unsubscribeCallbacks();
    };
  }, [showNotification]);

  // Sync flow data when connected
  const syncFlowData = useCallback(async () => {
    if (!nodes || !edges || nodes.length === 0) {
      // No flow data to sync
      return;
    }

    try {
      await whatsappService.syncFlowData(user?.id || 'guest', plubotId, nodes, edges, token);
      // Flow data synced successfully
      showNotification('Flujo sincronizado con WhatsApp', 'success');
    } catch {
      // Error syncing flow data
      showNotification('Error al sincronizar el flujo', 'warning');
    }
  }, [nodes, edges, user, plubotId, token, showNotification]);

  // Initialize on mount - only once
  useEffect(() => {
    if (!hasInitialized) {
      initializeSession();
      setHasInitialized(true);
    }

    return () => {
      // Cleanup socket connection on unmount
      whatsappService.disconnect();
      initializingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  // Sync flow when status becomes ready
  useEffect(() => {
    if (status === 'ready' || status === 'authenticated') {
      syncFlowData();
    }
  }, [status, syncFlowData]);

  // Handle retry with rate limiting
  const handleRetry = () => {
    if (retryCount >= 3) {
      showNotification('Demasiados intentos. Por favor, recarga la página.', 'error');
      return;
    }
    setRetryCount((previous) => previous + 1);
    setHasInitialized(false);
    initializeSession();
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);

      // Llamar al backend para hacer logout completo
      const userId = user?.id || localStorage.getItem('userId') || 'test';
      await whatsappService.logoutSession(userId, plubotId);

      setError(undefined);
      setPhoneNumber(undefined);
      setHasInitialized(false);
      setRetryCount(0);

      // Create new session
      const response = await whatsappService.createSession(userId, plubotId, token);
      
      // Update sessionId
      sessionId.current = `${userId}-${plubotId}`;

      // Wait a bit and then fetch QR
      setTimeout(async () => {
        await initializeSession();
      }, 1000);

      showNotification('Sesión cerrada. Generando nuevo código QR...', 'info');
    } catch {
      // Error disconnecting
      showNotification(
        'Error al cerrar sesión. Puedes desvincular manualmente desde WhatsApp.',
        'warning',
      );
      // Intentar reinicializar de todas formas
      setHasInitialized(false);
      setTimeout(() => {
        initializeSession();
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle create new session
  const handleCreateNewSession = async () => {
    try {
      setIsLoading(true);

      // First disconnect if connected
      const userId = user?.id || localStorage.getItem('userId') || 'test';
      if (status === 'ready' || status === 'authenticated') {
        await whatsappService.disconnectSession(userId, plubotId);
      }

      setError(undefined);
      setPhoneNumber(undefined);
      setHasInitialized(false);
      setRetryCount(0);

      // Create new session
      const response = await whatsappService.createSession(userId, plubotId, token);
      
      // Update sessionId
      sessionId.current = `${userId}-${plubotId}`;

      // Wait a bit and then fetch QR
      setTimeout(async () => {
        await initializeSession();
      }, 1000);

      showNotification('Creando nueva sesión...', 'info');
    } catch {
      // Error creating new session
      showNotification('Error al crear nueva sesión', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshQR = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Refreshing QR code...');
      
      const userId = user?.id || localStorage.getItem('userId') || 'test';
      
      // Always destroy and recreate session for a fresh QR
      await whatsappService.destroySession(userId, plubotId);
      
      // Update sessionId
      sessionId.current = `${userId}-${plubotId}`;
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create new session
      await whatsappService.createSession(userId, plubotId, token);
      
      // Wait for QR to be generated
      let newQR = null;
      let attempts = 0;
      const maxAttempts = 15;
      
      while (!newQR && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const qrData = await whatsappService.getQRCode(userId, plubotId);
        newQR = qrData?.qrCode || qrData?.qr;
        attempts++;
        
        if (attempts % 5 === 0) {
          console.log(`Waiting for QR... attempt ${attempts}`);
        }
      }
      
      if (newQR) {
        setQrCode(newQR);
        setStatus('waiting_qr');
        showNotification('QR Regenerado', 'success');
      } else {
        throw new Error('No se pudo generar un nuevo QR después de múltiples intentos');
      }
    } catch (error) {
      console.error('Error refreshing QR:', error);
      setError('Error al actualizar el QR. Por favor, intenta de nuevo.');
      showNotification('Error al refrescar QR', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='share-panel whatsapp-panel'>
      <div className='share-panel-header'>
        <div className='share-panel-icon whatsapp'>
          <MessageCircle size={24} />
        </div>
        <div>
          <h3>Conecta con WhatsApp Web</h3>
          <p>Integra tu Plubot directamente con WhatsApp para atender a tus clientes 24/7</p>
        </div>
      </div>

      <div className='share-panel-content'>
        <StatusIndicator status={status} />

        {status === 'ready' || status === 'authenticated' ? (
          <ConnectedView
            phoneNumber={phoneNumber}
            handleDisconnect={handleDisconnect}
            handleCreateNewSession={handleCreateNewSession}
            isLoading={isLoading}
          />
        ) : (
          <div className='whatsapp-qr-layout'>
            <div className='whatsapp-qr-left'>
              <div className='share-qr-code'>
                <QRCodeDisplay qrCode={qrCode} status={status} />
              </div>
            </div>
            <QRInstructions
              qrCode={qrCode}
              handleRefreshQR={handleRefreshQR}
              handleRetry={handleRetry}
              error={error}
              retryCount={retryCount}
              isLoading={isLoading}
            />
          </div>
        )}

        {error && (
          <div className='share-qr-error'>
            <AlertCircle size={32} />
            <p>{error}</p>
            <button className='share-button secondary' onClick={handleRetry} type='button'>
              <RefreshCw size={16} />
              <span>Reintentar</span>
            </button>
          </div>
        )}
      </div>

      <div className='share-features'>
        <div className='share-feature'>
          <Shield size={20} />
          <div>
            <strong>Seguro y Privado</strong>
            <span>Encriptación de extremo a extremo</span>
          </div>
        </div>
        <div className='share-feature'>
          <Users size={20} />
          <div>
            <strong>Multiagente</strong>
            <span>Atiende múltiples conversaciones</span>
          </div>
        </div>
        <div className='share-feature'>
          <Zap size={20} />
          <div>
            <strong>Respuestas Instantáneas</strong>
            <span>Disponible 24/7 sin interrupciones</span>
          </div>
        </div>
      </div>

      {status === 'ready' && (
        <div className='share-whatsapp-info'>
          <h4>✅ Tu Plubot está activo en WhatsApp</h4>
          <p>
            Los mensajes que recibas en WhatsApp serán procesados automáticamente por tu Plubot
            usando el flujo configurado.
          </p>
        </div>
      )}
    </div>
  );
};

WhatsAppQRPanel.propTypes = {
  plubotId: PropTypes.string.isRequired,
  nodes: PropTypes.array,
  edges: PropTypes.array,
};

export default WhatsAppQRPanel;
