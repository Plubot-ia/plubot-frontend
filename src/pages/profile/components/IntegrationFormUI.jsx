import PropTypes from 'prop-types';
import React from 'react';

import FormField from './FormField';
import IntegrationFormActions from './IntegrationFormActions';

const IntegrationFormUI = ({
  botName,
  setBotName,
  botToken,
  setBotToken,
  isLoading,
  error,
  isEditMode,
  handleSubmit,
  handleClose,
  integrationToEdit,
}) => {
  const getButtonText = () => {
    if (isLoading) {
      return isEditMode ? 'Guardando Cambios...' : 'Guardando...';
    }
    return isEditMode ? 'Guardar Cambios' : 'Guardar Integración';
  };

  return (
    <div className='modal-overlay'>
      <div className='modal-content cyber-border-modal'>
        <h2>
          {isEditMode ? 'Editar Integración de Discord' : 'Añadir Nueva Integración de Discord'}
        </h2>
        <form onSubmit={handleSubmit}>
          <FormField
            id='botName'
            label='Nombre del Bot'
            type='text'
            value={botName}
            onChange={(event) => setBotName(event.target.value)}
            placeholder={isEditMode ? integrationToEdit.integration_name : 'Mi Bot Increíble'}
            className='cyber-input'
            required
          />
          <FormField
            id='botToken'
            label='Token del Bot'
            type='password'
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
          <small className='token-info'>Tu token será cifrado y almacenado de forma segura.</small>
          {error && <p className='error-message'>{error}</p>}
          <IntegrationFormActions
            isLoading={isLoading}
            getButtonText={getButtonText}
            handleClose={handleClose}
          />
        </form>
      </div>
    </div>
  );
};

IntegrationFormUI.propTypes = {
  botName: PropTypes.string.isRequired,
  setBotName: PropTypes.func.isRequired,
  botToken: PropTypes.string.isRequired,
  setBotToken: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  isEditMode: PropTypes.bool.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  integrationToEdit: PropTypes.shape({
    integration_name: PropTypes.string,
  }),
};

export default IntegrationFormUI;
