import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import axiosInstance from '@/utils/axiosConfig';
import { powers } from '@/data/powers';

/**
 * Componente que gestiona la sección de plubots del usuario
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.user - Datos del usuario
 * @param {Function} props.updateProfile - Función para actualizar los datos del usuario
 * @param {boolean} props.animateBadges - Indica si se deben animar los elementos
 * @param {Function} props.setModalPlubot - Función para establecer el plubot en el modal
 * @param {Function} props.setEditModalPlubot - Función para establecer el plubot en el modal de edición
 * @param {Function} props.showNotification - Función para mostrar notificaciones
 * @param {Function} props.navigate - Función de navegación
 */
const PlubotSection = memo(({ 
  user, 
  updateProfile, 
  animateBadges, 
  setModalPlubot, 
  setEditModalPlubot, 
  showNotification, 
  navigate 
}) => {
  const getPowerDetails = useCallback((powerId) => {
    const power = powers.find((p) => p.id === powerId);
    return power ? { title: power.title, icon: power.icon, description: power.description } : { title: powerId, icon: '⚡', description: 'Desconocido' };
  }, []);

  const handleViewDetails = useCallback(async (plubot) => {
    try {
      const response = await axiosInstance.get(`/api/plubots/${plubot.id}`);
      if (response.data.status === 'success') {
        setModalPlubot(response.data.plubot);
      } else {
        showNotification(response.data.message || 'Error al cargar los detalles del Plubot', 'error');
        setModalPlubot(plubot);
      }
    } catch (err) {
      console.error('[PlubotSection] Error al cargar detalles del Plubot:', err);
      showNotification('Error al cargar los detalles del Plubot: ' + err.message, 'error');
      setModalPlubot(plubot);
    }
  }, [setModalPlubot, showNotification]);

  // Estado local para rastrear eliminaciones en progreso
  const [deletingPlubotIds, setDeletingPlubotIds] = useState([]);
  
  // Estado para rastrear Plubots que no se pueden eliminar (404)
  const [unremovablePlubots, setUnremovablePlubots] = useState([]);
  
  // Función para manejar el caso especial de Plubots fantasma
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

  const handleDeletePlubot = useCallback(async (plubotId) => {
    try {
      // Verificar que el ID del Plubot sea válido
      if (!plubotId) {
        showNotification('Error: ID de Plubot no válido', 'error');
        return;
      }
      
      // Evitar eliminaciones múltiples del mismo Plubot
      if (deletingPlubotIds.includes(plubotId)) {
        console.log(`[PlubotSection] Ya se está eliminando el Plubot ${plubotId}`);
        return;
      }
      
      // Actualizar estado para mostrar progreso
      setDeletingPlubotIds(prev => [...prev, plubotId]);
      showNotification('Eliminando Plubot...', 'info');
      
      console.log(`[PlubotSection] Eliminando Plubot con ID: ${plubotId}`);
      
      try {
        // Intentar eliminar a través de la API
        const response = await axiosInstance.delete('/api/auth/profile/plubots', {
          data: { plubotId },
        });

        // Solo actualizar UI si la eliminación fue exitosa en el backend
        if (response.data.status === 'success') {
          // Usar un callback para actualizar basado en el estado más reciente
          updateProfile(currentUser => {
            // Asegurarse de que el usuario tenga un array válido de plubots
            const updatedPlubots = Array.isArray(response.data.plubots) ? response.data.plubots : 
                                   (Array.isArray(currentUser.plubots) ? currentUser.plubots.filter(p => p.id !== plubotId) : []);
            
            return {
              ...currentUser,
              plubots: updatedPlubots
            };
          });
          showNotification('Plubot eliminado correctamente', 'success');
        } else {
          // Manejar respuesta no exitosa del servidor
          throw new Error(response.data.message || 'Error al eliminar el Plubot');
        }
      } catch (apiError) {
        console.error('[PlubotSection] Error en API:', apiError);
        
        // Si es un error 404, manejar especialmente - el Plubot no existe en el servidor
        if (apiError.response?.status === 404) {
          // Eliminar localmente y notificar
          updateProfile(currentUser => {
            const updatedPlubots = Array.isArray(currentUser.plubots) ? 
                                   currentUser.plubots.filter(p => p.id !== plubotId) : [];
            return { ...currentUser, plubots: updatedPlubots };
          });
          
          // Añadir a lista de Plubots problemáticos y mostrar notificación
          setUnremovablePlubots(prev => [...prev, plubotId]);
          showNotification(
            'Plubot eliminado localmente (no encontrado en servidor)',
            'success'
          );
        } else if (apiError.response?.status === 401) {
          // Error de autenticación
          localStorage.removeItem('access_token');
          showNotification('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
          navigate('/login');
        } else if (apiError.response?.data?.message?.includes('ForeignKeyViolation')) {
          // Error de restricción de clave foránea
          showNotification(
            'No se puede eliminar este Plubot porque tiene flujos con conexiones activas. Por favor, elimina las conexiones primero o contacta al soporte.',
            'error'
          );
          // Revertir cambios optimistas
          updateProfile(prev => ({ ...prev }));
        } else {
          // Cualquier otro error
          showNotification(`Error al eliminar el Plubot: ${apiError.message || 'Error desconocido'}`, 'error');
          // Revertir cambios optimistas
          updateProfile(prev => ({ ...prev }));
        }
      }
    } catch (globalError) {
      // Capturar cualquier error no manejado y registrarlo
      console.error('[PlubotSection] Error global en eliminación:', globalError);
      showNotification('Error interno al procesar la eliminación', 'error');
      
      // Asegurar que la UI se mantenga consistente
      setTimeout(() => {
        // Forzar una re-renderización completa del componente
        updateProfile(current => ({ ...current }));
      }, 500);
    } finally {
      // Limpiar el estado de eliminación
      setDeletingPlubotIds(prev => prev.filter(id => id !== plubotId));
    }
  }, [updateProfile, showNotification, navigate, deletingPlubotIds]);
  
  // Efecto para garantizar que el perfil se renderice correctamente
  useEffect(() => {
    if (user && Array.isArray(user.plubots)) {
      // Registrar en consola para depuración
      console.log(`[PlubotSection] Usuario tiene ${user.plubots.length} plubots`);
    }
  }, [user]);


  const renderPlubotCard = useMemo(() => (plubot, index) => {
    const plubotPowers = Array.isArray(plubot.powers) ? plubot.powers.filter((p) => p) : [];
    const plubotPowerTitles = plubotPowers.map((powerId) => getPowerDetails(powerId).title).join(', ') || 'Ninguno';
    const plubotIcon = plubotPowers.length > 0 ? getPowerDetails(plubotPowers[0]).icon : '🤖';
    
    // Comprobar si este Plubot está en proceso de eliminación
    const isDeleting = deletingPlubotIds.includes(plubot.id);
    
    // Comprobar si este Plubot es un 'fantasma' que no se puede eliminar normalmente
    const isUnremovable = unremovablePlubots.includes(plubot.id);

    return (
      <div
        key={plubot.id}
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
          position: 'relative'
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
            borderRadius: 'inherit'
          }}>
            <span style={{color: '#00e0ff', fontWeight: 'bold'}}>Eliminando...</span>
          </div>
        )}
        
        <div className="plubot-icon-container">
          <div className="plubot-icon">{plubotIcon}</div>
        </div>
        
        <h4 className="plubot-name">
          {plubot.name || 'Plubot'} 
          {isUnremovable && <span title="Este Plubot no existe en el servidor pero aparece en la interfaz" style={{color: '#ff9800'}}> (Fantasma)</span>}
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
                console.error('[PlubotSection] Error: plubot es null o no tiene ID:', plubot);
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
          
          {/* Si el Plubot es un 'fantasma', mostrar opción para eliminarlo localmente */}
          {isUnremovable ? (
            <button
              className="plubot-button icon-button force-delete-button"
              onClick={() => handleForceRemovePlubot(plubot.id)}
              title="Eliminar de la interfaz"
              style={{background: '#ff5722'}}
              disabled={isDeleting}
            >
              🗑️🚫
            </button>
          ) : (
            <button
              className="plubot-button icon-button delete-button"
              onClick={() => handleDeletePlubot(plubot.id)}
              title="Eliminar"
              disabled={isDeleting}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    );
  }, [animateBadges, getPowerDetails, handleViewDetails, handleDeletePlubot, handleForceRemovePlubot, setEditModalPlubot, deletingPlubotIds, unremovablePlubots]);

  return (
    <div className="profile-section plubots-section">
      <h3 className="plubots-section-title">PLUBOTS CREADOS</h3>
      <div className="plubots-background"></div>
      
      {/* Cubos de datos decorativos */}
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`cube-${index}`}
          className="data-cube"
          style={{
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
            animationDelay: `${index * 0.7}s`,
          }}
        ></div>
      ))}

      {Array.isArray(user?.plubots) && user.plubots.length > 0 ? (
        <div className="plubots-grid">
          {user.plubots.map((plubot, index) => renderPlubotCard(plubot, index))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <img src="/assets/img/plubot.svg" alt="Plubot Logo" className="empty-icon-image" />
          </div>
          <p>¡Crea tu primer Plubot en la Fábrica!</p>
          <button
            className="cyber-button glow-effect empty-state-button"
            onClick={() => {
              console.log('[PlubotSection] Navigating to /plubot/create/factory');
              navigate('/plubot/create/factory');
            }}
          >
            IR A LA FÁBRICA
          </button>
        </div>
      )}
    </div>
  );
});

export default PlubotSection;
