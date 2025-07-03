import PropTypes from 'prop-types';
import React, { memo, useCallback, useState, useEffect } from 'react';

import { powers } from '@/data/powers'; // Corregido: import 'powers' from '@data/powers'
import axiosInstance from '@/utils/axios-config.js'; // Corregido para usar alias @

import logger from '../../../services/loggerService'; // <--- AÑADIR IMPORTACIÓN
import useAuthStore from '../../../stores/use-auth-store';

const PlubotCard = memo(
  ({
    plubot,
    index,
    animateBadges,
    getPowerDetails,
    handleViewDetails,
    handleForceRemovePlubot,
    requestDeletePlubot,
    setEditModalPlubot,
    deletingPlubotIds,
    unremovablePlubots,
    showNotification,
  }) => {
    const plubotPowers = Array.isArray(plubot.powers)
      ? plubot.powers.filter(Boolean)
      : [];
    const plubotPowerTitles =
      plubotPowers
        .map((powerId) => getPowerDetails(powerId).title)
        .join(', ') || 'Ninguno';
    const plubotIcon =
      plubotPowers.length > 0 ? getPowerDetails(plubotPowers[0]).icon : '🤖';

    const isDeleting = deletingPlubotIds.includes(plubot.id);
    const isUnremovable = unremovablePlubots.includes(plubot.id);

    return (
      <div
        className={`
        plubot-card 
        ${animateBadges ? 'animate-in' : ''} 
        ${plubot.color ? '' : 'plubot-card-fallback'} 
        ${isDeleting ? 'deleting' : ''} 
        ${isUnremovable ? 'unremovable' : ''}
      `}
        style={{
          background: plubot.color
            ? `linear-gradient(135deg, ${plubot.color}40, rgba(0, 40, 80, 0.8))`
            : undefined,
          borderColor: plubot.color || undefined,
          animationDelay: `${index * 150}ms`,
          opacity: isDeleting ? 0.6 : 1,
          position: 'relative',
        }}
      >
        {isDeleting && (
          <div
            className='deleting-overlay'
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 10,
              borderRadius: 'inherit',
            }}
          >
            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>
              Eliminando...
            </span>
          </div>
        )}

        <div className='plubot-icon-container'>
          <div className='plubot-icon'>{plubotIcon}</div>
        </div>

        <h4 className='plubot-name'>
          {plubot.name || 'Plubot'}
          {isUnremovable && (
            <span
              title='Este Plubot no existe en el servidor pero aparece en la interfaz'
              style={{ color: '#ff9800' }}
            >
              {' '}
              (Fantasma)
            </span>
          )}
        </h4>

        <div className='plubot-detail'>
          Personalidad: {plubot.tone || 'N/A'}
        </div>
        <div className='plubot-powers'>
          <div className='plubot-detail'>
            <strong>Poderes:</strong> {plubotPowerTitles}
          </div>
        </div>
        <div className='plubot-actions'>
          <button
            className='plubot-button icon-button'
            onClick={() => {
              if (!plubot || !plubot.id) {
                showNotification('Error: Plubot no válido.', 'error');
                return;
              }
              setEditModalPlubot(plubot);
            }}
            title='Editar Plubot'
            disabled={isDeleting || isUnremovable}
          >
            ⚙️
          </button>
          <button
            className='plubot-button icon-button view-button'
            onClick={() => handleViewDetails(plubot)}
            title='Ver detalles'
            disabled={isDeleting || isUnremovable}
          >
            👁️
          </button>

          {isUnremovable ? (
            <button
              className='plubot-button icon-button force-delete-button'
              onClick={() => handleForceRemovePlubot(plubot.id)}
              title='Eliminar de la interfaz'
              style={{ background: '#ff5722' }}
              disabled={isDeleting}
            >
              🗑️🚫
            </button>
          ) : (
            <button
              className='plubot-button icon-button delete-button'
              onClick={() => requestDeletePlubot(plubot)}
              title='Eliminar'
              disabled={isDeleting}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    );
  },
);

PlubotCard.displayName = 'PlubotCard';

PlubotCard.propTypes = {
  plubot: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    tone: PropTypes.string,
    color: PropTypes.string,
    model: PropTypes.string,
    is_public: PropTypes.bool,
    powers: PropTypes.arrayOf(PropTypes.string),
    flows: PropTypes.arrayOf(PropTypes.object),
    edges: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  index: PropTypes.number.isRequired,
  animateBadges: PropTypes.bool,
  getPowerDetails: PropTypes.func.isRequired,
  handleViewDetails: PropTypes.func.isRequired,
  handleForceRemovePlubot: PropTypes.func.isRequired,
  requestDeletePlubot: PropTypes.func.isRequired,
  setEditModalPlubot: PropTypes.func.isRequired,
  deletingPlubotIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  unremovablePlubots: PropTypes.arrayOf(PropTypes.string).isRequired,
  showNotification: PropTypes.func.isRequired,
};

const PlubotSection = memo(
  ({
    animateBadges,
    setModalPlubot,
    setEditModalPlubot,
    showNotification,
    navigate,
  }) => {
    const { user, setUser, fetchUserProfile } = useAuthStore();

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
            const errorMessage =
              apiError.message || 'Error de red o desconocido';
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
      [showNotification, navigate, deletingPlubotIds, fetchUserProfile],
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

    // Styles for Delete Confirmation Modal
    const modalOverlayStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10_000,
    };

    const modalContentStyle = {
      backgroundColor: '#1a2035',
      color: '#00e0ff',
      padding: '30px',
      borderRadius: '10px',
      border: '1px solid #ff00ff',
      textAlign: 'center',
      boxShadow: '0 0 20px rgba(255,0,255,0.5)',
      maxWidth: '400px',
    };

    const modalTitleStyle = {
      marginTop: 0,
      color: '#ff00ff',
      fontSize: '1.5em',
    };
    const modalStrongStyle = { color: '#ff00ff' };
    const modalTextStyle = { fontSize: '1.1em' };
    const modalButtonContainerStyle = { marginTop: '25px' };

    const modalButtonStyle = {
      cursor: 'pointer',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      padding: '12px 25px',
      borderRadius: '5px',
    };

    const confirmButtonStyle = {
      ...modalButtonStyle,
      backgroundColor: '#ff00ff',
      color: 'white',
      border: '1px solid #00e0ff',
      marginRight: '15px',
    };

    const cancelButtonStyle = {
      ...modalButtonStyle,
      backgroundColor: 'transparent',
      color: '#00e0ff',
      border: '1px solid #00e0ff',
    };

    // Efecto para garantizar que el perfil se renderice correctamente
    useEffect(() => {
      if (user && Array.isArray(user.plubots)) {
        // Registrar en consola para depuración
      }
    }, [user]);

    return (
      <div className='profile-section plubots-section'>
        <h3 className='plubots-section-title'>PLUBOTS CREADOS</h3>
        <div className='plubots-background' />

        {deleteConfirmState.isOpen && deleteConfirmState.plubot && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3 style={modalTitleStyle}>Confirmar Desintegración Quántica</h3>
              <p style={modalTextStyle}>
                Estás a punto de enviar al Plubot{' '}
                <strong style={modalStrongStyle}>
                  {deleteConfirmState.plubot.name}
                </strong>{' '}
                al vacío.
              </p>
              <p>
                Esta acción es irreversible y su rastro de Quanta se perderá
                para siempre.
              </p>
              <div style={modalButtonContainerStyle}>
                <button
                  onClick={confirmDeletePlubot}
                  style={confirmButtonStyle}
                >
                  Confirmar Desintegración
                </button>
                <button onClick={cancelDeletePlubot} style={cancelButtonStyle}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

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
  navigate: PropTypes.func.isRequired,
};

export default PlubotSection;
