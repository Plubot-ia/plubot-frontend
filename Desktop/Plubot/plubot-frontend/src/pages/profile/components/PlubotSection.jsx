import React, { useState, useCallback, useMemo, memo } from 'react';
import axiosInstance from '@/utils/axiosConfig';
import { powers } from '@/data/powers';

/**
 * Componente que gestiona la sección de plubots del usuario
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.user - Datos del usuario
 * @param {Function} props.setUser - Función para actualizar los datos del usuario
 * @param {boolean} props.animateBadges - Indica si se deben animar los elementos
 * @param {Function} props.setModalPlubot - Función para establecer el plubot en el modal
 * @param {Function} props.setEditModalPlubot - Función para establecer el plubot en el modal de edición
 * @param {Function} props.showNotification - Función para mostrar notificaciones
 * @param {Function} props.navigate - Función de navegación
 */
const PlubotSection = memo(({ 
  user, 
  setUser, 
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

  const handleDeletePlubot = useCallback(async (plubotId) => {
    try {
      showNotification('Eliminando Plubot...', 'info');
      const response = await axiosInstance.delete('/api/auth/profile/plubots', {
        data: { plubotId },
      });

      if (response.data.status === 'success') {
        setUser({ ...user, plubots: response.data.plubots });
        showNotification('Plubot eliminado correctamente', 'success');
      } else {
        showNotification(response.data.message || 'Error al eliminar el Plubot', 'error');
      }
    } catch (error) {
      console.error('[PlubotSection] Error al eliminar Plubot:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        showNotification('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
        navigate('/login');
      } else if (error.response?.data?.message?.includes('ForeignKeyViolation')) {
        showNotification(
          'No se puede eliminar este Plubot porque tiene flujos con conexiones activas. Por favor, elimina las conexiones primero o contacta al soporte.',
          'error'
        );
      } else {
        showNotification('Error al eliminar el Plubot: ' + error.message, 'error');
      }
    }
  }, [user, setUser, showNotification, navigate]);

  const renderPlubotCard = useMemo(() => (plubot, index) => {
    const plubotPowers = Array.isArray(plubot.powers) ? plubot.powers.filter((p) => p) : [];
    const plubotPowerTitles = plubotPowers.map((powerId) => getPowerDetails(powerId).title).join(', ') || 'Ninguno';
    const plubotIcon = plubotPowers.length > 0 ? getPowerDetails(plubotPowers[0]).icon : '🤖';

    return (
      <div
        key={plubot.id}
        className={`plubot-card ${animateBadges ? 'animate-in' : ''} ${!plubot.color ? 'plubot-card-fallback' : ''}`}
        style={{
          background: plubot.color
            ? `linear-gradient(135deg, ${plubot.color}40, rgba(0, 40, 80, 0.8))`
            : undefined,
          borderColor: plubot.color || undefined,
          animationDelay: `${index * 150}ms`,
        }}
      >
        <div className="plubot-icon-container">
          <div className="plubot-icon">{plubotIcon}</div>
        </div>
        <h4 className="plubot-name">{plubot.name || 'Plubot'}</h4>
        <div className="plubot-detail">Personalidad: {plubot.tone || 'N/A'}</div>
        <div className="plubot-powers">
          <div className="plubot-detail">
            <strong>Poderes:</strong> {plubotPowerTitles}
          </div>
        </div>
        <div className="plubot-actions">
          <button
            className="plubot-button icon-button"
            onClick={() => setEditModalPlubot(plubot)}
            title="Editar Plubot"
          >
            ⚙️
          </button>
          <button
            className="plubot-button icon-button view-button"
            onClick={() => handleViewDetails(plubot)}
            title="Ver detalles"
          >
            👁️
          </button>
          <button
            className="plubot-button icon-button delete-button"
            onClick={() => handleDeletePlubot(plubot.id)}
            title="Eliminar"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  }, [animateBadges, getPowerDetails, handleViewDetails, handleDeletePlubot, setEditModalPlubot]);

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
            <img src="/src/assets/img/plubot.svg" alt="Plubot Logo" className="empty-icon-image" />
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
