import { useState, useEffect, useCallback } from 'react';

import instance from '@/utils/axios-config.js';

// --- Helper Functions for API calls ---

const _fetchDiscordIntegrations = async () => {
  const response = await instance.get('discord-integrations/');
  if (response.data && response.data.integrations) {
    return response.data.integrations.map((int) => ({
      id: int.id,
      integration_name: int.integration_name,
      guild_id: int.guild_id,
      status: int.status,
      last_error_message: int.last_error_message,
    }));
  }
  return [];
};

const _deleteDiscordIntegration = async (integrationId) => {
  return instance.delete(`discord-integrations/${integrationId}`);
};

// --- Main Hook ---

const useIntegrationsSection = ({ user, showNotification }) => {
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState();
  const [deletingId, setDeletingId] = useState();

  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const fetchedIntegrations = await _fetchDiscordIntegrations();
      setIntegrations(fetchedIntegrations);
    } catch (error_) {
      const message =
        error_.response?.data?.message ?? error_.message ?? 'Failed to load integrations.';
      setError(message);
      setIntegrations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchIntegrations();
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
      await _deleteDiscordIntegration(integrationId);
      showNotification('Integración eliminada con éxito', 'success');
      fetchIntegrations(); // Refresh list
    } catch (error_) {
      const message =
        error_.response?.data?.message ?? error_.message ?? 'Error al eliminar la integración.';
      showNotification(message, 'error');
    } finally {
      setDeletingId(undefined);
    }
  };

  return {
    discordIntegrations: integrations,
    isLoading,
    error,
    isAddModalOpen,
    isEditModalOpen,
    editingIntegration,
    deletingId,
    handleOpenAddModal,
    handleCloseAddModal,
    handleOpenEditModal,
    handleCloseEditModal,
    handleIntegrationAdded,
    handleIntegrationUpdated,
    handleDeleteIntegration,
  };
};

export default useIntegrationsSection;
