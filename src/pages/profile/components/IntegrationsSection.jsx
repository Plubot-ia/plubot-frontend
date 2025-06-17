import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import instance from '@/utils/axiosConfig'; // Import the configured axios instance
// import useAuthStore from '@/stores/useAuthStore'; // Token handled by axiosConfig
import AddIntegrationModal from './AddIntegrationModal'; // Import the new modal component
import '../styles/IntegrationsSection.css';

const IntegrationsSection = ({ user, showNotification }) => {
  const [discordIntegrations, setDiscordIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Renamed for clarity
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // Tracks ID of integration being deleted

  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await instance.get('/discord-integrations/');
      if (response.data && response.data.integrations) {
        const mappedIntegrations = response.data.integrations.map(int => ({
          id: int.id,
          integration_name: int.integration_name, // Corrected: backend sends integration_name
          guild_id: int.guild_id, // Corrected: backend sends guild_id
          status: int.status, // Corrected: backend sends status
          last_error_message: int.last_error_message // Add last_error_message from backend
        }));
        setDiscordIntegrations(mappedIntegrations);
      } else {
        setDiscordIntegrations([]); // Set to empty array if no integrations found or unexpected response
      }
    } catch (err) {
      console.error("Error fetching integrations:", err);
      let errorMessage = 'Failed to load integrations. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setDiscordIntegrations([]); // Clear integrations on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchIntegrations();
    }
  }, [user, fetchIntegrations]); // Added fetchIntegrations to dependency array as per lint suggestion

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (integration) => {
    setEditingIntegration(integration);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingIntegration(null);
    setIsEditModalOpen(false);
  };

  const handleIntegrationAdded = () => {
    setIsAddModalOpen(false);
    fetchIntegrations(); // Refresh the list
  };

  const handleIntegrationUpdated = () => {
    setIsEditModalOpen(false);
    fetchIntegrations(); // Refresh the list
  };

  const handleDeleteIntegration = async (integrationId) => {
    // Optional: Add a confirmation dialog here
    // if (!window.confirm('Are you sure you want to delete this integration?')) {
    //   return;
    // }
    setDeletingId(integrationId);
    try {
      await instance.delete(`/api/discord-integrations/${integrationId}`);
      notify({ message: 'Integration deleted successfully!', type: 'success' });
      fetchIntegrations(); // Refresh the list
    } catch (err) {
      console.error('Error deleting integration:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete integration.';
      notify({ message: `Error: ${errorMessage}`, type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <div className="integrations-loading">Cargando integraciones...</div>;
  }

  // Ensure showNotification is available, provide a default if not passed
  const notify = showNotification || ((notification) => console.log('Notification:', notification.message, notification.type));

  const getStatusDisplayDetails = (status, lastErrorMessage) => {
    switch (status) {
      case 'pending_verification':
        return {
          text: 'Pendiente de Verificación',
          className: 'status-pending-verification',
          tooltipText: 'El token está guardado y se intentará verificar automáticamente.'
        };
      case 'active':
        return {
          text: 'Activo',
          className: 'status-active',
          tooltipText: 'La integración está activa y funcionando correctamente.'
        };
      case 'invalid_token':
        return {
          text: 'Token Inválido',
          className: 'status-error',
          tooltipText: `Error: ${lastErrorMessage || 'El token proporcionado no es válido o ha sido revocado por Discord.'}`
        };
      case 'verification_error':
        return {
          text: 'Error de Verificación',
          className: 'status-error',
          tooltipText: `Error: ${lastErrorMessage || 'No se pudo verificar el token con Discord. Revisa el token o inténtalo más tarde.'}`
        };
      default:
        return {
          text: status ? status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Desconocido',
          className: 'status-unknown',
          tooltipText: lastErrorMessage || 'Estado desconocido de la integración.'
        };
    }
  };

  return (
    <div className="integrations-section">
      <div className="integrations-header">
        <h2>Integraciones de Discord</h2>
        <div className="header-actions">
          <Link to="/tutoriales/tutorialesdiscord" className="cyber-link-button tutorial-discord-link tutorial-link">
            ¿Cómo obtener mi token de Discord?
          </Link>
          <button onClick={handleOpenAddModal} className="cyber-button add-integration-button">
            Añadir Nueva Integración
          </button>
        </div>
      </div>

      <AddIntegrationModal // This will be adapted to handle both add and edit
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onIntegrationAdded={handleIntegrationAdded} // For when adding
        showNotification={notify}
        // mode="add" // We might not need an explicit mode prop if we rely on integrationToEdit
      />

      {editingIntegration && (
        <AddIntegrationModal // This instance is for editing
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onIntegrationUpdated={handleIntegrationUpdated} // For when editing
          integrationToEdit={editingIntegration}
          showNotification={notify}
          // mode="edit"
        />
      )}

      {/* Conditional rendering for error or empty state */}
      {error && (
        <p className="integrations-list-empty-message">{error}</p>
      )}
      {!error && discordIntegrations.length === 0 && (
        <p className="integrations-list-empty-message">
          No tienes integraciones de Discord configuradas todavía.
        </p>
      )}

      {discordIntegrations.length > 0 && (
        <ul className="integrations-list">
          {discordIntegrations.map(integration => (
            <li key={integration.id} className={`integration-item status-${integration.status}`}>
              <div className="integration-info">
                <strong>{integration.integration_name}</strong>
                {integration.guild_id && <span>Guild ID: {integration.guild_id}</span>}
              </div>
              <div className="integration-actions">
                {(() => {
                  const displayDetails = getStatusDisplayDetails(integration.status, integration.last_error_message);
                  return (
                    <span 
                      className={`status-badge ${displayDetails.className}`}
                      title={displayDetails.tooltipText}
                    >
                      {displayDetails.text}
                    </span>
                  );
                })()}
                <button onClick={() => handleOpenEditModal(integration)} className="cyber-button-small edit-button">Editar</button>
                <button onClick={() => handleDeleteIntegration(integration.id)} className="cyber-button-small delete-button" disabled={deletingId === integration.id}>{deletingId === integration.id ? 'Eliminando...' : 'Eliminar'}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IntegrationsSection;
