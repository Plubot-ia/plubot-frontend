import { MessageCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import './WhatsAppQRPanel.css';
import useWhatsAppSessionRestore from '../../../hooks/useWhatsAppSessionRestore';
import whatsappService from '../../../services/whatsappService';

import {
  ConnectedView,
  QRDisplay,
  QRInstructions,
  StatusIndicator,
  ErrorDisplay,
  FeaturesSection,
  WhatsAppInfo,
} from './WhatsAppQRPanelHelpers';
import { handleQRRefresh, subscribeToWebSocket } from './WhatsAppQRPanelHooks';

const WhatsAppQRPanel = ({ plubotId, nodes, edges }) => {
  // Get auth token from localStorage
  const token = localStorage.getItem('access_token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : undefined;
  const userId = user?.id || 'user123'; // Fallback para testing

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('waiting');
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [linkingAttempts, setLinkingAttempts] = useState(0);

  // Check for existing session on mount
  const sessionRestore = useWhatsAppSessionRestore(userId, plubotId);

  // Define handleRefreshQR function
  const handleRefreshQR = useCallback(async () => {
    if (!userId || !plubotId) return;

    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      // Clean plubotId for the refresh request
      const cleanPlubotId = plubotId ? plubotId.replaceAll(/[^a-zA-Z0-9]/g, '') : 'defaultplubot';
      console.log('[WhatsAppQRPanel] Refreshing QR for:', { userId, plubotId: cleanPlubotId });

      // Call the service to refresh QR
      const result = await whatsappService.refreshQR(userId, cleanPlubotId);

      if (result && (result.qr || result.qrDataUrl)) {
        const qr = result.qrDataUrl || result.qr;
        setQrCode(qr);
        setStatus('waiting_qr');
        setErrorMessage(null);
      } else {
        throw new Error('No QR received from server');
      }
    } catch (error) {
      console.error('[WhatsAppQRPanel] Error refreshing QR:', error);
      setErrorMessage('Error al actualizar el código QR. Intenta de nuevo.');
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, plubotId]);

  // Define handleRetry function
  const handleRetry = useCallback(async () => {
    setRetryCount((previous) => previous + 1);
    await handleRefreshQR();
  }, [handleRefreshQR]);

  useEffect(() => {
    if (!userId || !plubotId) return;

    // Skip initialization if session is being restored
    if (sessionRestore.loading) return;

    // If session exists and is authenticated, update state
    if (sessionRestore.exists && sessionRestore.status === 'connected') {
      setStatus('connected');
      setPhoneNumber(sessionRestore.phoneNumber);
      return;
    }

    const initializeWhatsApp = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // Clean plubotId to be alphanumeric only (remove hyphens)
        const cleanPlubotId = plubotId ? plubotId.replaceAll(/[^a-zA-Z0-9]/g, '') : 'defaultplubot';
        console.log('[WhatsAppQRPanel] Initializing session for:', {
          userId,
          plubotId: cleanPlubotId,
        });
        const result = await whatsappService.createSession(userId, cleanPlubotId);
        console.log('[WhatsAppQRPanel] Session result:', result);

        if (result.qr || result.qrDataUrl) {
          const qr = result.qrDataUrl || result.qr;
          console.log('[WhatsAppQRPanel] Setting QR code');
          setQrCode(qr);
          setStatus('waiting_qr');
          setErrorMessage(null); // Clear any error message when QR is received
        } else if (result.status === 'ready' || result.status === 'connected') {
          console.log('[WhatsAppQRPanel] Session already connected');
          setStatus('connected');
          setPhoneNumber(result.phoneNumber);
        } else {
          console.log('[WhatsAppQRPanel] Unexpected result status:', result.status);
          setStatus('waiting');
        }
      } catch (error) {
        console.error('[WhatsAppQRPanel] Error creating session:', error);
        // Don't set status to 'error' unless it's a critical failure
        // This prevents the persistent "Error de conexión" message
        if (error.response?.status === 500 || error.response?.status === 503) {
          setErrorMessage('El servicio de WhatsApp no está disponible temporalmente.');
          setStatus('disconnected');
        } else {
          // For other errors, just show waiting state with retry option
          setStatus('waiting');
          // Don't show error message persistently, only temporarily
          if (retryCount < 3) {
            setTimeout(() => {
              handleRetry();
            }, 2000);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeWhatsApp();
  }, [
    userId,
    plubotId,
    sessionRestore.loading,
    sessionRestore.exists,
    sessionRestore.status,
    sessionRestore.phoneNumber,
  ]);

  // Setup WebSocket connection to listen for authentication events
  useEffect(() => {
    if (!userId || !plubotId || status === 'connected') return;

    const cleanPlubotId = plubotId ? plubotId.replaceAll(/[^a-zA-Z0-9]/g, '') : 'defaultplubot';
    const sessionId = `${userId}-${cleanPlubotId}`;

    console.log('[WhatsAppQRPanel] Setting up WebSocket for session:', sessionId);

    // Subscribe to WebSocket events
    const unsubscribe = whatsappService.subscribeToStatusUpdates({
      sessionId,
      onQRUpdate: (data) => {
        console.log('[WhatsAppQRPanel] QR Update received:', data);
        if (data.qrDataUrl || data.qr) {
          setQrCode(data.qrDataUrl || data.qr);
          setStatus('waiting');
          setErrorMessage(null);
        }
      },
      onAuthenticated: (data) => {
        console.log('[WhatsAppQRPanel] Session authenticated:', data);
        setStatus('connected');
        setPhoneNumber(data.phoneNumber || 'Connected');
        setQrCode(null);
        setErrorMessage(null);
      },
      onReady: (data) => {
        console.log('[WhatsAppQRPanel] Session ready:', data);
        setStatus('connected');
        setPhoneNumber(data.phoneNumber || 'Connected');
        setQrCode(null);
        setErrorMessage(null);
      },
      onDisconnected: () => {
        console.log('[WhatsAppQRPanel] Session disconnected');
        setStatus('disconnected');
        setErrorMessage('WhatsApp desconectado. Por favor, reconecta.');
      },
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId, plubotId, status]);

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
            handleDisconnect={() => {}}
            handleCreateNewSession={() => {}}
            isLoading={isLoading}
          />
        ) : (
          <div className='whatsapp-qr-layout'>
            <div className='whatsapp-qr-left'>
              <div className='share-qr-code'>
                <QRDisplay qrCode={qrCode} status={status} />
              </div>
            </div>
            <QRInstructions
              qrCode={qrCode}
              handleRefreshQR={handleRefreshQR}
              handleRetry={handleRetry}
              error={errorMessage}
              retryCount={retryCount}
              isLoading={isLoading}
            />
          </div>
        )}

        <ErrorDisplay error={errorMessage} handleRetry={handleRetry} />
      </div>

      <FeaturesSection />
      <WhatsAppInfo status={status} />
    </div>
  );
};

WhatsAppQRPanel.propTypes = {
  plubotId: PropTypes.string.isRequired,
  nodes: PropTypes.array,
  edges: PropTypes.array,
};

export default WhatsAppQRPanel;
