import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import logger from '@/services/loggerService';
import useAuthStore from '@/stores/use-auth-store';
import axiosInstance from '@/utils/axios-config';

export const usePlubotManagement = (showNotification) => {
  const { user, setUser, fetchUserProfile } = useAuthStore();
  const navigate = useNavigate();

  const [deletingPlubotIds, setDeletingPlubotIds] = useState([]);
  const [unremovablePlubots, setUnremovablePlubots] = useState([]);
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    plubot: undefined,
  });

  const handleDeletePlubot = useCallback(
    async (plubotId) => {
      if (!plubotId || deletingPlubotIds.includes(plubotId)) {
        return;
      }

      setDeletingPlubotIds((previous) => [...previous, plubotId]);

      try {
        const response = await axiosInstance.delete(
          `/auth/profile/plubots/${plubotId}`,
        );

        if (response.status === 200) {
          showNotification('Plubot eliminado exitosamente.', 'success');
          await fetchUserProfile(true);
        } else {
          const errorData = response.data;
          showNotification(
            `Error al eliminar: ${errorData.message || 'Error desconocido'}`,
            'error',
          );
        }
      } catch (error) {
        logger.error('Error al eliminar Plubot:', error);
        const apiError = error.response?.data || {};
        if (apiError.response?.status === 404) {
          setUnremovablePlubots((previous) => {
            if (previous.includes(plubotId)) {
              return previous;
            }
            return [...previous, plubotId];
          });
          showNotification(
            'Plubot no encontrado en el servidor. Puedes forzar su eliminación de esta lista si persiste.',
            'warning',
          );
        } else if (
          apiError.response?.status === 401 ||
          apiError.message?.includes('sesión')
        ) {
          navigate('/login');
          showNotification(
            'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
            'error',
          );
        } else {
          const errorMessage = apiError.message || 'Error de red o desconocido';
          showNotification(
            `Error al eliminar Plubot: ${errorMessage.slice(0, 50)}...`,
            'error',
          );
        }
      } finally {
        setDeletingPlubotIds((previous) =>
          previous.filter((id) => id !== plubotId),
        );
      }
    },
    [deletingPlubotIds, fetchUserProfile, navigate, showNotification],
  );

  const handleForceRemovePlubot = useCallback(
    (plubotId) => {
      if (user && Array.isArray(user.plubots)) {
        const updatedPlubots = user.plubots.filter((p) => p.id !== plubotId);
        const updatedUser = { ...user, plubots: updatedPlubots };
        setUser(updatedUser);
        showNotification('Plubot eliminado de la vista local', 'success');
        setUnremovablePlubots((previous) =>
          previous.filter((id) => id !== plubotId),
        );
      }
    },
    [user, setUser, showNotification],
  );

  const requestDeletePlubot = useCallback((plubot) => {
    setDeleteConfirmState({ isOpen: true, plubot });
  }, []);

  const cancelDeletePlubot = () => {
    setDeleteConfirmState({ isOpen: false, plubot: undefined });
  };

  const confirmDeletePlubot = () => {
    if (deleteConfirmState.plubot) {
      handleDeletePlubot(deleteConfirmState.plubot.id);
    }
    cancelDeletePlubot();
  };

  return {
    deletingPlubotIds,
    unremovablePlubots,
    deleteConfirmState,
    handleForceRemovePlubot,
    requestDeletePlubot,
    cancelDeletePlubot,
    confirmDeletePlubot,
  };
};
