import { useEffect, useState } from 'react';

import whatsappService from '../services/whatsappService';

/**
 * Hook to check and restore WhatsApp sessions on component mount
 * Prevents users from having to scan QR code again after page reload
 */
export const useWhatsAppSessionRestore = (userId, plubotId) => {
  const [sessionStatus, setSessionStatus] = useState({
    loading: true,
    exists: false,
    status: null,
    phoneNumber: null,
    needsReconnection: false,
  });

  useEffect(() => {
    if (!userId || !plubotId) {
      setSessionStatus((previous) => ({ ...previous, loading: false }));
      return;
    }

    const checkExistingSession = async () => {
      const sessionId = `${userId}-${plubotId}`;

      try {
        // Check session status
        const baseUrl = import.meta.env.VITE_WHATSAPP_SERVICE_URL || 'http://localhost:3001';
        const response = await fetch(`${baseUrl}/api/sessions/${sessionId}/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'internal-api-key',
          },
        });

        if (!response.ok) {
          // If 404, session doesn't exist yet
          if (response.status === 404) {
            setSessionStatus({
              loading: false,
              exists: false,
              status: 'not_found',
              phoneNumber: null,
              needsReconnection: false,
            });
            return;
          }
          throw new Error('Failed to check session status');
        }

        const data = await response.json();

        if (data.exists && data.status === 'authenticated') {
          // Session is active and authenticated
          setSessionStatus({
            loading: false,
            exists: true,
            status: 'connected',
            phoneNumber: data.phoneNumber,
            needsReconnection: false,
          });

          console.info(`✅ WhatsApp session restored for ${sessionId}`);
        } else if (data.exists && data.needsReconnection) {
          // Session exists but needs reconnection
          console.info(`🔄 Attempting to reconnect session ${sessionId}`);

          const reconnectResponse = await fetch(
            `${import.meta.env.VITE_WHATSAPP_API_URL}/api/sessions/${sessionId}/reconnect`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );

          if (reconnectResponse.ok) {
            const reconnectData = await reconnectResponse.json();
            setSessionStatus({
              loading: false,
              exists: true,
              status: reconnectData.status === 'ready' ? 'connected' : 'reconnecting',
              phoneNumber: null,
              needsReconnection: false,
            });
          } else {
            // Reconnection failed, show QR
            setSessionStatus({
              loading: false,
              exists: false,
              status: 'waiting_qr',
              phoneNumber: null,
              needsReconnection: false,
            });
          }
        } else {
          // No session exists, need to show QR
          setSessionStatus({
            loading: false,
            exists: false,
            status: 'waiting_qr',
            phoneNumber: null,
            needsReconnection: false,
          });
        }
      } catch (error) {
        console.error('Error checking session status:', error);

        // On error, default to showing QR
        setSessionStatus({
          loading: false,
          exists: false,
          status: 'waiting_qr',
          phoneNumber: null,
          needsReconnection: false,
        });
      }
    };

    checkExistingSession();
  }, [userId, plubotId]);

  return sessionStatus;
};

export default useWhatsAppSessionRestore;
