import PropTypes from 'prop-types';
import React, { useState } from 'react';

import instance from '@/utils/axios-config.js';
import '../styles/AddIntegrationModal.css'; // Asegúrate de crear este archivo CSS

const AddIntegrationModal = ({
  isOpen,
  onClose,
  onIntegrationAdded,
  onIntegrationUpdated,
  integrationToEdit,
  showNotification,
}) => {
  const isEditMode = Boolean(integrationToEdit);
  const [botName, setBotName] = useState(
    isEditMode ? integrationToEdit.integration_name : '',
  );
  const [botToken, setBotToken] = useState(''); // Token is not pre-filled for editing, but can be updated
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setBotName('');
    setBotToken('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  // eslint-disable-next-line unicorn/no-null
  if (!isOpen) return null; // Retornar null es idiomático en React para no renderizar el componente.

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    if (!botName.trim() || (!isEditMode && !botToken.trim())) {
      setError('El nombre del bot y el token son obligatorios.');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        integration_name: botName,
        ...(botToken.trim() && { bot_token: botToken }),
      };

      const apiCall = isEditMode
        ? instance.put(`/discord-integrations/${integrationToEdit.id}`, payload)
        : instance.post('discord-integrations/', payload);

      const response = await apiCall;

      const successMessage =
        response.data?.message ||
        (isEditMode
          ? '¡Integración actualizada con éxito!'
          : '¡Integración añadida con éxito!');
      showNotification(successMessage, 'success');
      if (isEditMode) {
        onIntegrationUpdated();
      } else {
        onIntegrationAdded();
      }
      handleClose();
    } catch (error_) {
      const errorMessage =
        error_.response?.data?.message ||
        error_.message ||
        'Ocurrió un error inesperado.';
      setError(errorMessage);
      showNotification(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='modal-overlay'>
      <div className='modal-content cyber-border-modal'>
        <h2>
          {isEditMode
            ? 'Editar Integración de Discord'
            : 'Añadir Nueva Integración de Discord'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label htmlFor='botName'>Nombre del Bot</label>
            <input
              type='text'
              id='botName'
              value={botName}
              onChange={(event) => setBotName(event.target.value)}
              placeholder={
                isEditMode
                  ? integrationToEdit.integration_name
                  : 'Mi Bot Increíble'
              }
              className='cyber-input'
              required
            />
          </div>
          <div className='form-group'>
            <label htmlFor='botToken'>Token del Bot</label>
            <input
              type='password' // Use password type for tokens
              id='botToken'
              value={botToken}
              onChange={(event) => setBotToken(event.target.value)}
              placeholder={
                isEditMode
                  ? 'Ingresa un nuevo token para actualizar (opcional)'
                  : 'Token de Bot de Discord'
              }
              className='cyber-input'
              required={!isEditMode}
            />
            <small className='token-info'>
              Tu token será cifrado y almacenado de forma segura.
            </small>
          </div>
          {error && <p className='error-message'>{error}</p>}
          <div className='modal-actions'>
            <button
              type='submit'
              className='cyber-button save-button'
              disabled={isLoading}
            >
              {(() => {
                let buttonText = '';
                if (isLoading) {
                  buttonText = isEditMode
                    ? 'Guardando Cambios...'
                    : 'Guardando...';
                } else {
                  buttonText = isEditMode
                    ? 'Guardar Cambios'
                    : 'Guardar Integración';
                }
                return buttonText;
              })()}
            </button>
            <button
              type='button'
              className='cyber-button cancel-button'
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AddIntegrationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onIntegrationAdded: PropTypes.func.isRequired,
  onIntegrationUpdated: PropTypes.func.isRequired,
  integrationToEdit: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    integration_name: PropTypes.string,
  }),
  showNotification: PropTypes.func.isRequired,
};

export default AddIntegrationModal;
