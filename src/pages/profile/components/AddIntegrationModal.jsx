import PropTypes from 'prop-types';
import React from 'react';

import { useIntegrationForm } from '../hooks/useIntegrationForm';

import IntegrationFormUI from './IntegrationFormUI'; // Import the new UI component
import '../styles/AddIntegrationModal.css';

const AddIntegrationModal = ({
  isOpen,
  onClose,
  onIntegrationAdded,
  onIntegrationUpdated,
  integrationToEdit,
  showNotification,
}) => {
  const {
    botName,
    setBotName,
    botToken,
    setBotToken,
    isLoading,
    error,
    isEditMode,
    handleSubmit,
    handleClose,
  } = useIntegrationForm({
    integrationToEdit,
    onClose,
    onIntegrationAdded,
    onIntegrationUpdated,
    showNotification,
  });

  if (!isOpen) return; // Retornar undefined es la preferencia de la regla unicorn/no-null

  return (
    <IntegrationFormUI
      botName={botName}
      setBotName={setBotName}
      botToken={botToken}
      setBotToken={setBotToken}
      isLoading={isLoading}
      error={error}
      isEditMode={isEditMode}
      handleSubmit={handleSubmit}
      handleClose={handleClose}
      integrationToEdit={integrationToEdit}
    />
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
