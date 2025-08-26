import { useState, useEffect, useCallback, useRef } from 'react';

import whatsappService from '../../../services/whatsappService';

// Subscribe to WebSocket events for real-time updates
export const subscribeToWebSocket = (userId, plubotId, callbacks) => {
  const { onQRUpdate, onStatusUpdate } = callbacks;

  // Initialize socket if not already done
  whatsappService.initializeSocket();

  // Subscribe to QR updates
  if (onQRUpdate) {
    whatsappService.subscribeToQRUpdates(userId, plubotId, onQRUpdate);
  }

  // Subscribe to status updates
  if (onStatusUpdate) {
    whatsappService.onStatusUpdate(onStatusUpdate);
  }

  // Return cleanup function
  return () => {
    if (onQRUpdate) {
      whatsappService.unsubscribeFromQRUpdates(onQRUpdate);
    }
    if (onStatusUpdate) {
      whatsappService.offStatusUpdate(onStatusUpdate);
    }
  };
};

// Hook for managing WhatsApp session initialization
export const useWhatsAppSession = (config) => {
  const { user, plubotId, token, nodes, edges } = config;
  const [qrCode, setQrCode] = useState();
  const [status, setStatus] = useState('initializing');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const initializingRef = useRef(false);
  const sessionId = useRef(null);

  // Simple notification function
  const showNotification = useCallback(() => {
    // Notification system placeholder
  }, []);

  // Set sessionId when user and plubotId are available
  useEffect(() => {
    const userId = user?.id || localStorage.getItem('userId') || 'test';
    sessionId.current = `${userId}-${plubotId}`;
  }, [user, plubotId]);

  // Helper to handle QR data
  const handleQRData = useCallback(
    (qrData) => {
      if (qrData.status === 'ready' || qrData.status === 'authenticated') {
        setStatus('ready');
        setQrCode('');
        showNotification('WhatsApp ya está conectado', 'success');
      } else if (qrData.qrCode || qrData.qr) {
        setQrCode(qrData.qrCode || qrData.qr);
      }
    },
    [showNotification],
  );

  // Helper to handle session success
  const handleSessionSuccess = useCallback(
    async (userId) => {
      setStatus('waiting_qr');
      setHasInitialized(true);
      whatsappService.initializeSocket(userId, plubotId);

      const qrData = await whatsappService.getQRCode(userId, plubotId);
      handleQRData(qrData);

      await whatsappService.syncFlowData(userId, plubotId, {
        nodes: nodes || [],
        edges: edges || [],
      });
    },
    [plubotId, nodes, edges, handleQRData],
  );

  // Initialize WhatsApp session
  const initializeSession = useCallback(async () => {
    if (initializingRef.current) return;

    try {
      initializingRef.current = true;
      setIsLoading(true);
      setError(undefined);
      setStatus('initializing');

      const userId = user?.id || localStorage.getItem('userId') || 'test';
      const response = await whatsappService.startQRSession(userId, plubotId, token);
      sessionId.current = `${userId}-${plubotId}`;

      if (response.success) {
        await handleSessionSuccess(userId);
      } else {
        throw new Error(response.message || 'Failed to start WhatsApp session');
      }
    } catch (error_) {
      setError(error_.message || 'Error al iniciar sesión de WhatsApp');
      setStatus('error');
      if (!hasInitialized) {
        showNotification('Error al conectar con WhatsApp', 'error');
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        initializingRef.current = false;
      }, 0);
    }
  }, [plubotId, token, user, hasInitialized, handleSessionSuccess, showNotification]);

  return {
    qrCode,
    setQrCode,
    status,
    setStatus,
    isLoading,
    setIsLoading,
    error,
    setError,
    phoneNumber,
    setPhoneNumber,
    retryCount,
    setRetryCount,
    hasInitialized,
    setHasInitialized,
    initializingRef,
    sessionId,
    showNotification,
    initializeSession,
  };
};

// Hook for WebSocket connection
export const useWhatsAppSocket = (sessionId, setters) => {
  const { setQrCode, setStatus, setError, setPhoneNumber, showNotification } = setters;
  useEffect(() => {
    if (!sessionId.current) return;

    const unsubscribeCallbacks = whatsappService.subscribeToStatusUpdates({
      sessionId: sessionId.current,
      onQRUpdate: (data) => {
        if (data.qr && data.sessionId === sessionId.current) {
          setQrCode(data.qr);
          setStatus('waiting_qr');
          setError(undefined);

          // Only show error if attempts are actually high (not on first QR)
          if (data.attempt && data.attempt > 15) {
            setError(
              'Demasiados intentos. Por favor, desvincula dispositivos antiguos en WhatsApp.',
            );
            showNotification(
              'WhatsApp tiene un límite de dispositivos vinculados. Desvincula dispositivos antiguos desde tu teléfono.',
              'warning',
            );
          }
        }
      },
      onStatusUpdate: (data) => {
        if (data.sessionId !== sessionId.current) return;

        switch (data.status) {
          case 'authenticated':
          case 'ready': {
            setStatus('ready');
            setQrCode('');
            setError(undefined);
            setPhoneNumber(data.phoneNumber || '');
            showNotification('¡WhatsApp conectado exitosamente!', 'success');
            break;
          }
          case 'disconnected': {
            setStatus('error');
            setError('Sesión desconectada');
            showNotification('WhatsApp desconectado', 'warning');
            break;
          }
          case 'auth_failure': {
            setStatus('error');
            setError('Error de autenticación');
            showNotification('Error de autenticación en WhatsApp', 'error');
            break;
          }
          default: {
            break;
          }
        }
      },
      onError: (errorData) => {
        if (errorData.sessionId === sessionId.current) {
          setError(errorData.message || 'Error desconocido');
          setStatus('error');
        }
      },
    });

    return () => {
      if (unsubscribeCallbacks?.length > 0) {
        for (const unsub of unsubscribeCallbacks) unsub();
      }
    };
  }, [sessionId, setQrCode, setStatus, setError, setPhoneNumber, showNotification]);
};

// Hook for syncing flow data
export const useSyncFlowData = (config) => {
  const { nodes, edges, user, plubotId, token, showNotification } = config;
  const syncFlowData = useCallback(async () => {
    if (!nodes || !edges || nodes.length === 0) return;

    try {
      await whatsappService.syncFlowData(user?.id || 'guest', plubotId, nodes, edges, token);
      showNotification('Flujo sincronizado con WhatsApp', 'success');
    } catch {
      showNotification('Error al sincronizar el flujo', 'warning');
    }
  }, [nodes, edges, user, plubotId, token, showNotification]);

  return syncFlowData;
};

// Helper to poll for QR code (optimized for speed)
const pollForQRCode = async (userId, plubotId, maxAttempts = 5) => {
  for (let index = 0; index < maxAttempts; index++) {
    try {
      const qrData = await whatsappService.getQRCode(userId, plubotId);
      if (qrData?.qrCode || qrData?.qr) {
        return qrData.qrCode || qrData.qr;
      }
    } catch {
      // Continue polling
    }
    // Short delay between attempts (300ms instead of 1000ms)
    if (index < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  return null;
};

// Hook for WhatsApp action handlers
export const useWhatsAppHandlers = ({
  user,
  plubotId,
  token,
  setIsLoading,
  setError,
  setPhoneNumber,
  setHasInitialized,
  setRetryCount,
  sessionId,
  initializeSession,
  showNotification,
  retryCount,
  setQrCode,
  setStatus,
}) => {
  // Handle retry with rate limiting
  const handleRetry = useCallback(() => {
    if (retryCount >= 3) {
      showNotification('Demasiados intentos. Por favor, recarga la página.', 'error');
      return;
    }
    setRetryCount((previous) => previous + 1);
    setHasInitialized(false);
    initializeSession();
  }, [retryCount, setRetryCount, setHasInitialized, initializeSession, showNotification]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId = user?.id || localStorage.getItem('userId') || 'test';
      await whatsappService.logoutSession(userId, plubotId);

      setError(undefined);
      setPhoneNumber('');
      setHasInitialized(false);
      setRetryCount(0);

      await whatsappService.createSession(userId, plubotId, token);
      sessionId.current = `${userId}-${plubotId}`;

      setTimeout(async () => {
        await initializeSession();
      }, 1000);

      showNotification('Sesión cerrada. Generando nuevo código QR...', 'info');
    } catch {
      showNotification(
        'Error al cerrar sesión. Puedes desvincular manualmente desde WhatsApp.',
        'warning',
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    plubotId,
    token,
    setIsLoading,
    setError,
    setPhoneNumber,
    setHasInitialized,
    setRetryCount,
    sessionId,
    initializeSession,
    showNotification,
  ]);

  // Handle create new session
  const handleCreateNewSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId = user?.id || localStorage.getItem('userId') || 'test';

      await whatsappService.destroySession(userId, plubotId);
      await new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });
      await whatsappService.createSession(userId, plubotId, token);

      sessionId.current = `${userId}-${plubotId}`;

      setTimeout(async () => {
        await initializeSession();
      }, 1000);

      showNotification('Creando nueva sesión...', 'info');
    } catch {
      showNotification('Error al crear nueva sesión', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, plubotId, token, setIsLoading, sessionId, initializeSession, showNotification]);

  // Handle refresh QR
  const handleRefreshQR = useCallback(async () => {
    try {
      // Don't set loading to avoid button disappearing
      setError(undefined);

      // Use the same userId logic as initializeSession
      const userId = user?.id || localStorage.getItem('userId') || 'test';
      const currentSessionId = `${userId}-${plubotId}`;

      // Destroy and create in parallel for speed
      const destroyPromise = whatsappService.destroySession(userId, plubotId).catch((error) => {
        console.warn('Destroy error (non-blocking):', error);
      });

      // Small delay then create new session
      await new Promise((resolve) => setTimeout(resolve, 500));

      sessionId.current = currentSessionId;
      whatsappService.initializeSocket(userId, plubotId);

      const createResponse = await whatsappService.createSession(userId, plubotId, token);

      if (!createResponse.success) {
        throw new Error('Failed to create new session');
      }

      // Wait for destroy to complete
      await destroyPromise;

      // Quick poll for QR (reduced delay)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Try to get QR immediately
      const qrData = await whatsappService.getQRCode(userId, plubotId);
      if (qrData?.qr || qrData?.qrCode) {
        setQrCode(qrData.qr || qrData.qrCode);
        setStatus('waiting_qr');
        showNotification('QR actualizado', 'success');
      } else {
        // Fallback: poll quickly
        const newQR = await pollForQRCode(userId, plubotId, 5);
        if (newQR) {
          setQrCode(newQR);
          setStatus('waiting_qr');
          showNotification('QR actualizado', 'success');
        } else {
          throw new Error('No se pudo generar un nuevo QR');
        }
      }
    } catch (error) {
      console.error('Error refreshing QR:', error);
      setError('Error al actualizar el QR. Por favor, intenta de nuevo.');
      showNotification('Error al generar nuevo QR', 'error');
      // Try to recover by initializing session
      setTimeout(() => initializeSession(), 1000);
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    plubotId,
    token,
    setIsLoading,
    setError,
    sessionId,
    setQrCode,
    setStatus,
    showNotification,
    initializeSession,
  ]);

  return {
    handleRetry,
    handleDisconnect,
    handleCreateNewSession,
    handleRefreshQR,
  };
};

// Export handleQRRefresh as an alias for compatibility
export const handleQRRefresh = async (config) => {
  const handlers = useWhatsAppHandlers(config);
  return handlers.handleRefreshQR();
};
