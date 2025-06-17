import React, { useState } from 'react';
import instance from '@/utils/axiosConfig';
import '../styles/AddIntegrationModal.css'; // Asegúrate de crear este archivo CSS

const AddIntegrationModal = ({ isOpen, onClose, onIntegrationAdded, onIntegrationUpdated, integrationToEdit, showNotification }) => {
  const isEditMode = !!integrationToEdit;
  const [botName, setBotName] = useState(isEditMode ? integrationToEdit.integration_name : '');
  const [botToken, setBotToken] = useState(''); // Token is not pre-filled for editing, but can be updated
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!botName.trim() || (!isEditMode && !botToken.trim())) { // Token is only mandatory for new integrations
      setError('El nombre del bot y el token son obligatorios.');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        integration_name: botName,
        // Only include bot_token in payload if it's provided (for edit mode) or it's add mode
        ...(botToken.trim() && { bot_token: botToken }),
      };

      let response;
      if (isEditMode) {
        response = await instance.put(`/discord-integrations/${integrationToEdit.id}`, payload);
      } else {
        response = await instance.post('/discord-integrations/', payload);
      }

      // If the request was successful (axios doesn't throw for 2xx status codes),
      // we assume the operation was successful. Backend returns 201 for POST, 200 for PUT.
      const successMessage = response.data?.message || (isEditMode ? '¡Integración actualizada con éxito!' : '¡Integración añadida con éxito!');
      showNotification({ message: successMessage, type: 'success' });
      if (isEditMode) {
        onIntegrationUpdated();
      } else {
        onIntegrationAdded();
      }
      handleClose();
    } catch (err) {
      console.error('Error adding integration:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Ocurrió un error inesperado.';
      setError(errorMessage);
      showNotification({ message: `Error: ${errorMessage}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setBotName('');
    setBotToken('');
    setError(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content cyber-border-modal">
        <h2>{isEditMode ? 'Editar Integración de Discord' : 'Añadir Nueva Integración de Discord'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="botName">Nombre del Bot</label>
            <input
              type="text"
              id="botName"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder={isEditMode ? integrationToEdit.integration_name : "Mi Bot Increíble"}
              className="cyber-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="botToken">Token del Bot</label>
            <input
              type="password" // Use password type for tokens
              id="botToken"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder={isEditMode ? "Ingresa un nuevo token para actualizar (opcional)" : "Token de Bot de Discord"}
              className="cyber-input"
              required={!isEditMode}
            />
            <small className="token-info">Tu token será cifrado y almacenado de forma segura.</small>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="submit" className="cyber-button save-button" disabled={isLoading}>
              {isLoading ? (isEditMode ? 'Guardando Cambios...' : 'Guardando...') : (isEditMode ? 'Guardar Cambios' : 'Guardar Integración')}
            </button>
            <button type="button" className="cyber-button cancel-button" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIntegrationModal;
