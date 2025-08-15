import { useCallback } from 'react';

import { powers } from '@/data/powers';
import { usePlubotManagement } from '@/hooks/usePlubotManagement';
import useAuthStore from '@/stores/use-auth-store';
import axiosInstance from '@/utils/axios-config.js';

const getErrorMessage = (error, defaultMessage) => {
  return error?.response?.data?.message || error?.message || defaultMessage;
};

const usePlubotSection = ({ setModalPlubot, showNotification }) => {
  const { user } = useAuthStore();

  const getPowerDetails = useCallback((powerId) => {
    const power = powers.find((p) => p.id === powerId);
    return power
      ? { title: power.title, icon: power.icon, description: power.description }
      : { title: powerId, icon: '⚡', description: 'Desconocido' };
  }, []);

  const handleViewDetails = useCallback(
    async (plubot) => {
      if (!plubot || !plubot.id) {
        showNotification('Error: Datos del Plubot inválidos para ver detalles.', 'error');
        return;
      }

      try {
        const response = await axiosInstance.get(`/plubots/${plubot.id}`);
        const plubotData = response.data?.plubot;

        if (response.data?.status === 'success' && plubotData) {
          setModalPlubot(plubotData);
        } else {
          const message = getErrorMessage(response, 'Error al cargar los detalles del Plubot.');
          showNotification(message, 'error');
        }
      } catch (error) {
        const message = getErrorMessage(error, 'Error de red o desconocido al cargar detalles.');
        showNotification(message, 'error');
      }
    },
    [setModalPlubot, showNotification],
  );

  const plubotManagement = usePlubotManagement(showNotification);

  return {
    user,
    getPowerDetails,
    handleViewDetails,
    ...plubotManagement,
  };
};

export default usePlubotSection;
