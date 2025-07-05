import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation

import instance from '@/utils/axios-config.js'; // Import the configured axios instance

import AddIntegrationModal from './AddIntegrationModal'; // Import the new modal component

import '../styles/IntegrationsSection.css';

const getStatusDisplayDetails = (status, lastErrorMessage) => {
  switch (status) {
    case 'pending_verification': {
      return {
        text: 'Pendiente de Verificación',
        className: 'status-pending-verification',
        tooltipText:
          'El token está guardado y se intentará verificar automáticamente.',
      };
    }
    case 'active': {
      return {
        text: 'Activo',
        className: 'status-active',
        tooltipText: 'La integración está activa y funcionando correctamente.',
      };
    }
    case 'invalid_token': {
      return {
        text: 'Token Inválido',
        className: 'status-error',
        tooltipText: `Error: ${
          lastErrorMessage ||
          'El token proporcionado no es válido o ha sido revocado por Discord.'
        }`,
      };
    }
    case 'verification_error': {
      return {
        text: 'Error de Verificación',
        className: 'status-error',
        tooltipText: `Error: ${
          lastErrorMessage ||
          'No se pudo verificar el token con Discord. Revisa el token o inténtalo más tarde.'
        }`,
      };
    }
    default: {
      return {
        text: status
          ? status
              .replaceAll('_', ' ')
              .replaceAll(/\b\w/g, (l) => l.toUpperCase())
          : 'Desconocido',
        className: 'status-unknown',
        tooltipText:
          lastErrorMessage || 'Estado desconocido de la integración.',
      };
    }
  }
};

const IntegrationsHeader = ({ onAdd }) => (
  <div className='integrations-header'>
    <h2>Integraciones de Discord</h2>
    <div className='header-actions'>
      <Link
        to='/tutoriales/tutorialesdiscord'
        className='cyber-link-button tutorial-discord-link tutorial-link'
      >
        ¿Cómo obtener mi token de Discord?
      </Link>
      <button onClick={onAdd} className='cyber-button add-integration-button'>
        Añadir Nueva Integración
      </button>
    </div>
  </div>
);

IntegrationsHeader.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

const IntegrationItem = ({ integration, deletingId, onEdit, onDelete }) => {
  const displayDetails = getStatusDisplayDetails(
    integration.status,
    integration.last_error_message,
  );

  return (
    <li className={`integration-item status-${integration.status}`}>
      <div className='integration-info'>
        <strong>{integration.integration_name}</strong>
        {integration.guild_id && <span>Guild ID: {integration.guild_id}</span>}
      </div>
      <div className='integration-actions'>
        <span
          className={`status-badge ${displayDetails.className}`}
          title={displayDetails.tooltipText}
        >
          {displayDetails.text}
        </span>
        <button
          onClick={() => onEdit(integration)}
          className='cyber-button-small edit-button'
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(integration.id)}
          className='cyber-button-small delete-button'
          disabled={deletingId === integration.id}
        >
          {deletingId === integration.id ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </li>
  );
};

IntegrationItem.propTypes = {
  integration: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    integration_name: PropTypes.string,
    guild_id: PropTypes.string,
    status: PropTypes.string,
    last_error_message: PropTypes.string,
  }).isRequired,
  deletingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

const IntegrationsSection = ({ user, showNotification }) => {
  const [discordIntegrations, setDiscordIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState();
  const [deletingId, setDeletingId] = useState();

  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await instance.get('discord-integrations/');
      if (response.data && response.data.integrations) {
        const mappedIntegrations = response.data.integrations.map((int) => ({
          id: int.id,
          integration_name: int.integration_name,
          guild_id: int.guild_id,
          status: int.status,
          last_error_message: int.last_error_message,
        }));
        setDiscordIntegrations(mappedIntegrations);
      } else {
        setDiscordIntegrations([]);
      }
    } catch (error_) {
      let errorMessage = 'Failed to load integrations. Please try again.';
      if (
        error_.response &&
        error_.response.data &&
        error_.response.data.message
      ) {
        errorMessage = error_.response.data.message;
      } else if (error_.message) {
        errorMessage = error_.message;
      }
      setError(errorMessage);
      setDiscordIntegrations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchIntegrations();
    }
  }, [user, fetchIntegrations]);

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handleOpenEditModal = (integration) => {
    setEditingIntegration(integration);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingIntegration(undefined);
    setIsEditModalOpen(false);
  };

  const handleIntegrationAdded = () => {
    fetchIntegrations();
    handleCloseAddModal();
  };

  const handleIntegrationUpdated = () => {
    fetchIntegrations();
    handleCloseEditModal();
  };

  const handleDeleteIntegration = async (integrationId) => {
    setDeletingId(integrationId);
    try {
      await instance.delete(`discord-integrations/${integrationId}`);
      showNotification('Integración eliminada con éxito', 'success');
      fetchIntegrations();
    } catch (error_) {
      showNotification(
        `Error al eliminar la integración: ${
          error_.response?.data?.message || error_.message
        }`,
        'error',
      );
    } finally {
      setDeletingId(undefined);
    }
  };

  if (isLoading) {
    return (
      <div className='integrations-loading'>Cargando integraciones...</div>
    );
  }

  return (
    <div className='integrations-section'>
      <IntegrationsHeader onAdd={handleOpenAddModal} />

      <AddIntegrationModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onIntegrationAdded={handleIntegrationAdded}
        onIntegrationUpdated={handleIntegrationUpdated}
        showNotification={showNotification}
      />

      {editingIntegration && (
        <AddIntegrationModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onIntegrationUpdated={handleIntegrationUpdated}
          integrationToEdit={editingIntegration}
          showNotification={showNotification}
        />
      )}

      {error && <p className='integrations-list-empty-message'>{error}</p>}
      {!error && discordIntegrations.length === 0 && (
        <p className='integrations-list-empty-message'>
          No tienes integraciones de Discord configuradas todavía.
        </p>
      )}

      {discordIntegrations.length > 0 && (
        <ul className='integrations-list'>
          {discordIntegrations.map((integration) => (
            <IntegrationItem
              key={integration.id}
              integration={integration}
              deletingId={deletingId}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteIntegration}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

IntegrationsSection.propTypes = {
  user: PropTypes.shape({
    // El objeto de usuario se usa como disparador, no es necesario validar su contenido interno aquí.
  }).isRequired,
  showNotification: PropTypes.func.isRequired,
};

export default IntegrationsSection;
