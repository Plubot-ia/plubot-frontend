import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import logger from '@/services/loggerService';
import useAuthStore from '@/stores/use-auth-store';
import axiosInstance from '@/utils/axios-config';

const handleDeletionError = (
  error,
  plubotId,
  { showNotification, navigate, setUnremovablePlubots },
) => {
  logger.error('Error al eliminar Plubot:', error);
  const status = error.response?.status;
  const message = error.response?.data?.message ?? 'Error de red o desconocido';

  switch (status) {
    case 401: {
      showNotification('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'error');
      navigate('/login');
      break;
    }
    case 404: {
      setUnremovablePlubots((previous) =>
        previous.includes(plubotId) ? previous : [...previous, plubotId],
      );
      showNotification(
        'Plubot no encontrado. Puedes forzar su eliminación de la lista.',
        'warning',
      );
      break;
    }
    default: {
      showNotification(`Error al eliminar Plubot: ${message.slice(0, 50)}...`, 'error');
      break;
    }
  }
};

const useDeleteConfirmation = (handleDeletePlubot) => {
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    plubot: undefined,
  });

  const requestDeletePlubot = useCallback((plubot) => {
    setDeleteConfirmState({ isOpen: true, plubot });
  }, []);

  const cancelDeletePlubot = useCallback(() => {
    setDeleteConfirmState({ isOpen: false, plubot: undefined });
  }, []);

  const confirmDeletePlubot = useCallback(() => {
    if (deleteConfirmState.plubot) {
      handleDeletePlubot(deleteConfirmState.plubot.id);
    }
    cancelDeletePlubot();
  }, [deleteConfirmState.plubot, handleDeletePlubot, cancelDeletePlubot]);

  return {
    deleteConfirmState,
    requestDeletePlubot,
    cancelDeletePlubot,
    confirmDeletePlubot,
  };
};

export const usePlubotManagement = (showNotification) => {
  const { user, setUser, fetchUserProfile } = useAuthStore();
  const navigate = useNavigate();

  const [deletingPlubotIds, setDeletingPlubotIds] = useState([]);
  const [unremovablePlubots, setUnremovablePlubots] = useState([]);

  const handleDeletePlubot = useCallback(
    async (plubotId) => {
      if (!plubotId || deletingPlubotIds.includes(plubotId)) {
        return;
      }

      setDeletingPlubotIds((previous) => [...previous, plubotId]);

      try {
        const response = await axiosInstance.delete(`/auth/profile/plubots/${plubotId}`);

        if (response.status === 200) {
          showNotification('Plubot eliminado exitosamente.', 'success');
          await fetchUserProfile(true);
        } else {
          const errorData = response.data;
          showNotification(
            `Error al eliminar: ${errorData.message ?? 'Error desconocido'}`,
            'error',
          );
        }
      } catch (error) {
        handleDeletionError(error, plubotId, {
          showNotification,
          navigate,
          setUnremovablePlubots,
        });
      } finally {
        setDeletingPlubotIds((previous) => previous.filter((id) => id !== plubotId));
      }
    },
    [deletingPlubotIds, fetchUserProfile, navigate, showNotification, setUnremovablePlubots],
  );

  const handleForceRemovePlubot = useCallback(
    (plubotId) => {
      if (user?.plubots) {
        const updatedPlubots = user.plubots.filter((plubot) => plubot.id !== plubotId);
        setUser({ ...user, plubots: updatedPlubots });
        showNotification('Plubot eliminado de la vista local', 'success');
        setUnremovablePlubots((previous) => previous.filter((id) => id !== plubotId));
      }
    },
    [user, setUser, showNotification],
  );

  const { deleteConfirmState, requestDeletePlubot, cancelDeletePlubot, confirmDeletePlubot } =
    useDeleteConfirmation(handleDeletePlubot);

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
