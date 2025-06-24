import React, { memo, useCallback, useState, useEffect } from 'react';

import { powers } from '@/data/powers'; // Corregido: import 'powers' from '@data/powers'
import useAuthStore from '@/stores/useAuthStore'; // <--- AÑADIR IMPORTACIÓN
import axiosInstance from '@/utils/axiosConfig'; // Corregido para usar alias @

const PlubotCard = memo(({
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
  const plubotPowers = Array.isArray(plubot.powers) ? plubot.powers.filter((p) => p) : [];
  const plubotPowerTitles = plubotPowers.map((powerId) => getPowerDetails(powerId).title).join(', ') || 'Ninguno';
  const plubotIcon = plubotPowers.length > 0 ? getPowerDetails(plubotPowers[0]).icon : '🤖';

  const isDeleting = deletingPlubotIds.includes(plubot.id);
  const isUnremovable = unremovablePlubots.includes(plubot.id);

  return (
    <div
      className={`plubot-card ${animateBadges ? 'animate-in' : ''} 
                 ${!plubot.color ? 'plubot-card-fallback' : ''} 
                 ${isDeleting ? 'deleting' : ''} 
                 ${isUnremovable ? 'unremovable' : ''}`}
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
        <div className="deleting-overlay" style={{
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
        }}>
          <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>Eliminando...</span>
        </div>
      )}

      <div className="plubot-icon-container">
        <div className="plubot-icon">{plubotIcon}</div>
      </div>

      <h4 className="plubot-name">
        {plubot.name || 'Plubot'}
        {isUnremovable && <span title="Este Plubot no existe en el servidor pero aparece en la interfaz" style={{ color: '#ff9800' }}> (Fantasma)</span>}
      </h4>

      <div className="plubot-detail">Personalidad: {plubot.tone || 'N/A'}</div>
      <div className="plubot-powers">
        <div className="plubot-detail">
          <strong>Poderes:</strong> {plubotPowerTitles}
        </div>
      </div>
      <div className="plubot-actions">
        <button
          className="plubot-button icon-button"
          onClick={() => {
            if (!plubot || !plubot.id) {
              showNotification('Error: No se pudo abrir el editor porque el Plubot es inválido.', 'error');
              return;
            }
            setEditModalPlubot(plubot);
          }}
          title="Editar Plubot"
          disabled={isDeleting || isUnremovable}
        >
          ⚙️
        </button>
        <button
          className="plubot-button icon-button view-button"
          onClick={() => handleViewDetails(plubot)}
          title="Ver detalles"
          disabled={isDeleting || isUnremovable}
        >
          👁️
        </button>

        {isUnremovable ? (
          <button
            className="plubot-button icon-button force-delete-button"
            onClick={() => handleForceRemovePlubot(plubot.id)}
            title="Eliminar de la interfaz"
            style={{ background: '#ff5722' }}
            disabled={isDeleting}
          >
            🗑️🚫
          </button>
        ) : (
          <button
            className="plubot-button icon-button delete-button"
            onClick={() => requestDeletePlubot(plubot)}
            title="Eliminar"
            disabled={isDeleting}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
});
PlubotCard.displayName = 'PlubotCard';
// import './PlubotSection.css'; // Eliminada esta importación ya que el archivo no existe y es probable que no se necesite

const PlubotSection = memo(({
  user,
  updateProfile,
  animateBadges,
  setModalPlubot,
  setEditModalPlubot,
  showNotification,
  navigate,
}) => {
  const { setUser } = useAuthStore(); // <--- AÑADIR setUser AQUÍ

  // Log inicial para ver las props
  useEffect(() => {

  }, [user, updateProfile]); // Ejecutar si user o updateProfile cambian


  const getPowerDetails = useCallback((powerId) => {
    const power = powers.find((p) => p.id === powerId); // Corregido: usar 'powers.find'
    return power ? { title: power.title, icon: power.icon, description: power.description } : { title: powerId, icon: '⚡', description: 'Desconocido' };
  }, []);

  // Restaurar handleViewDetails
  const handleViewDetails = useCallback(async (plubot) => {
    if (!plubot || !plubot.id) {
      showNotification('Error: Datos del Plubot inválidos para ver detalles.', 'error');

      return;
    }
    try {

      // Asumimos que setModalPlubot puede manejar el estado de carga si es necesario,
      // o podríamos añadir un estado de carga local aquí.
      const response = await axiosInstance.get(`/plubots/${plubot.id}`);
      if (response.data.status === 'success' && response.data.plubot) {

        setModalPlubot(response.data.plubot); // Prop para abrir el modal de detalles
      } else {
        const errorMsg = response.data.message || 'Error al cargar los detalles del Plubot desde el backend.';

        showNotification(errorMsg, 'error');
        // Opcionalmente, mostrar el plubot local si falla la carga detallada:
        // setModalPlubot(plubot);
      }
    } catch (err) {

      const errorMsg = err.response?.data?.message || err.message || 'Error de red o desconocido al cargar detalles.';
      showNotification(errorMsg, 'error');
      // Opcionalmente, mostrar el plubot local si falla la carga detallada:
      // setModalPlubot(plubot);
    }
  }, [setModalPlubot, showNotification]);

  const [deletingPlubotIds, setDeletingPlubotIds] = useState([]);
  const [unremovablePlubots, setUnremovablePlubots] = useState([]);
  const [deleteConfirmState, setDeleteConfirmState] = useState({ isOpen: false, plubot: null });

  useEffect(() => {

  }, [deletingPlubotIds]);

  useEffect(() => {

  }, [unremovablePlubots]);

  const handleForceRemovePlubot = useCallback((plubotId) => {
    // Solo eliminar localmente del estado del usuario
    if (user && Array.isArray(user.plubots)) {
      const updatedPlubots = user.plubots.filter(p => p.id !== plubotId);
      // Actualizar el estado global
      updateProfile({ ...user, plubots: updatedPlubots });
      showNotification('Plubot eliminado de la vista local', 'success');
      // Limpiar de la lista de no eliminables
      setUnremovablePlubots(prev => prev.filter(id => id !== plubotId));
    }
  }, [user, updateProfile, showNotification]);

  const requestDeletePlubot = useCallback((plubot) => {
    setDeleteConfirmState({ isOpen: true, plubot });
  }, []);

  const cancelDeletePlubot = () => {
    setDeleteConfirmState({ isOpen: false, plubot: null });
  };

  const confirmDeletePlubot = () => {
    if (deleteConfirmState.plubot) {
      handleDeletePlubot(deleteConfirmState.plubot.id); // Llamará al nuevo handleDeletePlubot consolidado
    }
    cancelDeletePlubot();
  };

  const handleDeletePlubot = useCallback(async (plubotId) => {
    if (!plubotId) {
      showNotification('Error: ID de Plubot no válido', 'error');

      return;
    }

    // Evitar múltiples intentos de eliminación para el mismo Plubot simultáneamente
    // Esta verificación se hace mejor antes de setDeletingPlubotIds si es posible,
    // pero aquí también funciona como una salvaguarda adicional.
    if (deletingPlubotIds.includes(plubotId)) {

      return;
    }


    setDeletingPlubotIds(prev => [...prev, plubotId]);

    try {

      const response = await axiosInstance.delete('auth/profile/plubots', {
        data: { plubotId },
      });


      if (response.data.status === 'success') {


        // ---- INICIO DE LA NUEVA LÓGICA ----
        try {

          // Usar axiosInstance directamente ya que está disponible y configurado
          const profileResponse = await axiosInstance.get('auth/profile');

          // La respuesta de /api/auth/profile usualmente tiene el usuario en profileResponse.data.user
          if (profileResponse.data?.user) {

            setUser(profileResponse.data.user); // Actualizar el estado global con el perfil fresco
            showNotification('Plubot desintegrado cuánticamente y perfil actualizado.', 'success');
          } else {

            showNotification('Plubot eliminado, pero la vista podría tardar en actualizarse.', 'warning');
            // Fallback opcional: intentar actualizar localmente si la recarga falla (menos ideal)
            // const currentUserForFallback = useAuthStore.getState().user;
            // if (currentUserForFallback && currentUserForFallback.plubots) {
            //   const filteredPlubots = currentUserForFallback.plubots.filter(p => p.id !== plubotId);
            //   setUser({ ...currentUserForFallback, plubots: filteredPlubots });
            // }
          }
        } catch (profileError) {
          console.error('Error al refrescar el perfil:', profileError);
          showNotification('Plubot eliminado, pero hubo un error al refrescar la vista.', 'error');
        }
        // ---- FIN DE LA NUEVA LÓGICA ----

      } else {
        // El backend devolvió un 2xx pero con status != 'success' en el cuerpo JSON
        const errorMessage = response.data.message || 'Error desconocido del backend al eliminar Plubot.';

        showNotification(errorMessage, 'error');
        // No se modifica unremovablePlubots aquí, ya que no fue un error de red/permiso, sino lógico del backend.
      }
    } catch (apiError) {


      if (apiError.response?.status === 404) {
        setUnremovablePlubots(prev => prev.includes(plubotId) ? prev : [...prev, plubotId]);
        showNotification(
          `Plubot no encontrado en el servidor. Puedes forzar su eliminación de esta lista si persiste.`,
          'warning',
        );
      } else if (apiError.response?.status === 403) {
        showNotification(
          apiError.response.data?.message || 'No tienes permiso para eliminar este Plubot.',
          'error',
        );
      } else if (apiError.response?.status === 401) {
        localStorage.removeItem('access_token');
        showNotification('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
        navigate('/login');
      } else if (apiError.response?.data?.message?.includes('ForeignKeyViolation')) {
        showNotification(
          'No se puede eliminar este Plubot porque tiene flujos con conexiones activas. Por favor, elimina las conexiones primero o contacta al soporte.',
          'error',
        );
      } else {
        showNotification(`Error al eliminar el Plubot: ${apiError.message || 'Error de red o desconocido'}`, 'error');
      }
    } finally {

      setDeletingPlubotIds(prev => prev.filter(id => id !== plubotId));
    }
  }, [showNotification, navigate, deletingPlubotIds, setUser]);

  // Efecto para garantizar que el perfil se renderice correctamente
  useEffect(() => {
    if (user && Array.isArray(user.plubots)) {
      // Registrar en consola para depuración

    }
  }, [user]);


  return (
    <div className="profile-section plubots-section">
      <h3 className="plubots-section-title">PLUBOTS CREADOS</h3>
      <div className="plubots-background" />

      {deleteConfirmState.isOpen && deleteConfirmState.plubot && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ backgroundColor: '#1a2035', color: '#00e0ff', padding: '30px', borderRadius: '10px', border: '1px solid #ff00ff', textAlign: 'center', boxShadow: '0 0 20px rgba(255,0,255,0.5)', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0, color: '#ff00ff', fontSize: '1.5em' }}>Confirmar Desintegración Quántica</h3>
            <p style={{ fontSize: '1.1em' }}>Estás a punto de enviar al Plubot <strong style={{ color: '#ff00ff' }}>{deleteConfirmState.plubot.name}</strong> al vacío.</p>
            <p>Esta acción es irreversible y su rastro de Quanta se perderá para siempre.</p>
            <div style={{ marginTop: '25px' }}>
              <button onClick={confirmDeletePlubot} style={{ backgroundColor: '#ff00ff', color: 'white', border: '1px solid #00e0ff', padding: '12px 25px', borderRadius: '5px', marginRight: '15px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Confirmar Desintegración</button>
              <button onClick={cancelDeletePlubot} style={{ backgroundColor: 'transparent', color: '#00e0ff', border: '1px solid #00e0ff', padding: '12px 25px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {(() => { // IIFE para lógica de renderizado condicional más compleja
        if (!user || typeof user.plubots === 'undefined') { // user.plubots puede ser null si así lo devuelve el backend inicialmente

          return <p className="no-plubots-message">Cargando Plubots o datos no disponibles...</p>;
        }
        if (!Array.isArray(user.plubots)) {

          return <p className="no-plubots-message">Error: Formato de datos de Plubots incorrecto. Por favor, recarga la página o contacta a soporte.</p>;
        }
        if (user.plubots.length === 0) {
          return <p className="no-plubots-message">Aún no has creado ningún Plubot. ¡Empieza tu aventura en el Pluniverse!</p>;
        }
        return (
          <div className="plubots-grid">
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
});

PlubotSection.displayName = 'PlubotSection';

export default PlubotSection;
