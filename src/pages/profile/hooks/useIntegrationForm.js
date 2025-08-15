import { useState, useEffect } from 'react';

import instance from '@/utils/axios-config.js';

const executeApiCall = async (isEditMode, payload, integrationId) => {
  if (isEditMode) {
    return instance.put(`/discord-integrations/${integrationId}`, payload);
  }
  return instance.post('discord-integrations/', payload);
};

export const useIntegrationForm = ({
  integrationToEdit,
  onClose,
  onIntegrationAdded,
  onIntegrationUpdated,
  showNotification,
}) => {
  const isEditMode = Boolean(integrationToEdit);
  const [botName, setBotName] = useState('');
  const [botToken, setBotToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setBotName(isEditMode ? (integrationToEdit.integration_name ?? '') : '');
    setBotToken('');
    setError('');
    setIsLoading(false);
  }, [integrationToEdit, isEditMode]);

  const handleClose = () => {
    onClose();
  };

  const handleSuccess = (response) => {
    const successMessage =
      response.data?.message || `¡Integración ${isEditMode ? 'actualizada' : 'añadida'} con éxito!`;
    showNotification(successMessage, 'success');

    const callback = isEditMode ? onIntegrationUpdated : onIntegrationAdded;
    callback();
    handleClose();
  };

  const handleError = (error_) => {
    const errorMessage =
      error_.response?.data?.message || error_.message || 'Ocurrió un error inesperado.';
    setError(errorMessage);
    showNotification(`Error: ${errorMessage}`, 'error');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!botName.trim() || (!isEditMode && !botToken.trim())) {
      setError('El nombre del bot y el token son obligatorios.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        integration_name: botName,
        ...(botToken.trim() && { bot_token: botToken }),
      };

      const response = await executeApiCall(isEditMode, payload, integrationToEdit?.id);
      handleSuccess(response);
    } catch (error_) {
      handleError(error_);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    botName,
    setBotName,
    botToken,
    setBotToken,
    isLoading,
    error,
    isEditMode,
    handleSubmit,
    handleClose,
  };
};
