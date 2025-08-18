import { useState, useEffect, useCallback } from 'react';

import useAPI from '@/hooks/useAPI';

const useWhatsappConnection = (plubotId, showNotification) => {
  const { request, isLoading: isApiLoading } = useAPI();
  const [connectionData, setConnectionData] = useState();
  const [isConnecting, setIsConnecting] = useState(false);

  // Verificar estado de conexión
  const checkStatus = useCallback(async () => {
    try {
      const response = await request('GET', `wa/status/${plubotId}`);
      if (response) {
        setConnectionData(response.data);
      }
    } catch {
      // Error silenciado intencionalmente
    }
  }, [plubotId, request]);

  // Iniciar proceso de conexión OAuth
  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      const response = await request('POST', `wa/connect/${plubotId}`);

      if (response && response.oauth_url) {
        // Abrir ventana de OAuth
        const width = 600;
        const height = 700;
        const left = globalThis.screen.width / 2 - width / 2;
        const top = globalThis.screen.height / 2 - height / 2;

        const authWindow = globalThis.open(
          response.oauth_url,
          'WhatsApp Business OAuth',
          `width=${width},height=${height},left=${left},top=${top}`,
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
  }, [plubotId, request, checkStatus, showNotification]);

  // Desconectar WhatsApp
  const handleDisconnect = useCallback(async () => {
    try {
      await request('POST', `wa/disconnect/${plubotId}`);
      setConnectionData();
      showNotification('WhatsApp Business desconectado correctamente', 'success');
    } catch (error) {
      showNotification(error.message || 'Error al desconectar', 'error');
    }
  }, [plubotId, request, showNotification]);

  // Enviar mensaje de prueba
  const handleTestMessage = useCallback(async () => {
    // eslint-disable-next-line no-alert
    const phoneNumber = globalThis.prompt(
      'Ingresa el número de WhatsApp para enviar mensaje de prueba (con código de país, ej: 5491123456789):',
    );
    if (!phoneNumber) return;

    try {
      const response = await request('POST', `wa/send/${plubotId}`, {
        to: phoneNumber,
        message:
          'Este es un mensaje de prueba desde tu Plubot. ¡La conexión funciona correctamente!',
      });

      if (response?.status === 'success') {
        showNotification('Mensaje de prueba enviado exitosamente', 'success');
      } else {
        showNotification('Error al enviar mensaje de prueba', 'error');
      }
    } catch {
      showNotification('Error al enviar mensaje de prueba', 'error');
    }
  }, [plubotId, request, showNotification]);

  // Configuración manual
  const handleManualConfig = useCallback(
    async (manualConfig) => {
      if (!manualConfig.phone_number_id || !manualConfig.waba_id || !manualConfig.phone_number) {
        showNotification('Por favor completa todos los campos requeridos', 'error');
        return;
      }

      try {
        const response = await request('POST', `wa/configure/${plubotId}`, manualConfig);
        if (response?.status === 'success') {
          showNotification('Configuración guardada exitosamente', 'success');
          checkStatus();
          return true;
        } else {
          showNotification(response?.message || 'Error al guardar configuración', 'error');
          return false;
        }
      } catch (error) {
        showNotification(error?.message || 'Error al guardar configuración', 'error');
        return false;
      }
    },
    [plubotId, request, showNotification, checkStatus],
  );

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

    globalThis.addEventListener('message', handleMessage);

    return () => {
      globalThis.removeEventListener('message', handleMessage);
    };
  }, [plubotId, checkStatus, showNotification]);

  return {
    connectionData,
    isConnecting,
    isApiLoading,
    handleConnect,
    handleDisconnect,
    handleTestMessage,
    handleManualConfig,
  };
};

export default useWhatsappConnection;
