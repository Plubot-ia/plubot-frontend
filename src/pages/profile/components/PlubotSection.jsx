import PropTypes from 'prop-types';
import React, { memo, useCallback, useEffect } from 'react';

import { powers } from '@/data/powers';
import { usePlubotManagement } from '@/hooks/usePlubotManagement';
import useAuthStore from '@/stores/use-auth-store';
import axiosInstance from '@/utils/axios-config.js';

import DeleteConfirmationModal from './DeleteConfirmationModal';
import PlubotCard from './PlubotCard';

const PlubotSection = memo(
  ({ animateBadges, setModalPlubot, setEditModalPlubot, showNotification }) => {
    const { user } = useAuthStore();

    const getPowerDetails = useCallback((powerId) => {
      const power = powers.find((p) => p.id === powerId);
      return power
        ? {
            title: power.title,
            icon: power.icon,
            description: power.description,
          }
        : { title: powerId, icon: '⚡', description: 'Desconocido' };
    }, []);

    const handleViewDetails = useCallback(
      async (plubot) => {
        if (!plubot || !plubot.id) {
          showNotification(
            'Error: Datos del Plubot inválidos para ver detalles.',
            'error',
          );
          return;
        }
        try {
          const response = await axiosInstance.get(`/plubots/${plubot.id}`);
          if (response.data.status === 'success' && response.data.plubot) {
            setModalPlubot(response.data.plubot);
          } else {
            const errorMessage =
              response.data.message ||
              'Error al cargar los detalles del Plubot desde el backend.';
            showNotification(errorMessage, 'error');
          }
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            'Error de red o desconocido al cargar detalles.';
          showNotification(errorMessage, 'error');
        }
      },
      [setModalPlubot, showNotification],
    );

    const {
      deletingPlubotIds,
      unremovablePlubots,
      deleteConfirmState,
      handleForceRemovePlubot,
      requestDeletePlubot,
      cancelDeletePlubot,
      confirmDeletePlubot,
    } = usePlubotManagement(showNotification);

    useEffect(() => {
      if (user && Array.isArray(user.plubots)) {
        // Registrar en consola para depuración
      }
    }, [user]);

    return (
      <div className='profile-section plubots-section'>
        <h3 className='plubots-section-title'>PLUBOTS CREADOS</h3>
        <div className='plubots-background' />

        <DeleteConfirmationModal
          isOpen={deleteConfirmState.isOpen}
          plubot={deleteConfirmState.plubot}
          onConfirm={confirmDeletePlubot}
          onCancel={cancelDeletePlubot}
        />

        {(() => {
          // IIFE para lógica de renderizado condicional más compleja
          if (!user || user.plubots === undefined) {
            // user.plubots puede ser null si así lo devuelve el backend inicialmente
            return (
              <p className='no-plubots-message'>
                Cargando Plubots o datos no disponibles...
              </p>
            );
          }
          if (!Array.isArray(user.plubots)) {
            return (
              <p className='no-plubots-message'>
                Error: Formato de datos de Plubots incorrecto. Por favor,
                recarga la página o contacta a soporte.
              </p>
            );
          }
          if (user.plubots.length === 0) {
            return (
              <p className='no-plubots-message'>
                Aún no has creado ningún Plubot. ¡Empieza tu aventura en el
                Pluniverse!
              </p>
            );
          }
          return (
            <div className='plubots-grid'>
              {user.plubots.map((plubot, index) => (
                <PlubotCard
                  key={plubot.id}
                  plubot={plubot}
                  index={index}
                  animateBadges={animateBadges}
                  getPowerDetails={getPowerDetails}
                  handleViewDetails={handleViewDetails}
                  handleForceRemovePlubot={handleForceRemovePlubot}
                  requestDeletePlubot={requestDeletePlubot}
                  setEditModalPlubot={setEditModalPlubot}
                  deletingPlubotIds={deletingPlubotIds}
                  unremovablePlubots={unremovablePlubots}
                  showNotification={showNotification}
                />
              ))}
            </div>
          );
        })()}
      </div>
    );
  },
);

PlubotSection.displayName = 'PlubotSection';

PlubotSection.propTypes = {
  animateBadges: PropTypes.bool,
  setModalPlubot: PropTypes.func.isRequired,
  setEditModalPlubot: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
};

export default PlubotSection;
