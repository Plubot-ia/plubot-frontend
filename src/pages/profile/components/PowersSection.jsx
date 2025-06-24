import React, { useState, useEffect } from 'react';

import { powers } from '@/data/powers';
import axiosInstance from '@/utils/axiosConfig';

/**
 * Componente que gestiona la sección de poderes del usuario
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.user - Datos del usuario
 * @param {Function} props.setUser - Función para actualizar los datos del usuario
 * @param {Function} props.showNotification - Función para mostrar notificaciones
 * @param {Function} props.navigate - Función de navegación
 */
const PowersSection = ({ user, setUser, showNotification, navigate }) => {
  const [newPower, setNewPower] = useState('');
  const [showPowerTooltip, setShowPowerTooltip] = useState(null);
  const [powerAnimations, setPowerAnimations] = useState({});

  // Inicializar animaciones de poderes
  useEffect(() => {
    if (user && Array.isArray(user.powers)) {
      const animations = {};
      user.powers.forEach((power, index) => {
        if (power) {
          animations[power] = { delay: index * 300, active: false };
        }
      });
      setPowerAnimations(animations);

      const timeouts = Object.keys(animations).map((key, index) =>
        setTimeout(() => {
          setPowerAnimations((prev) => ({
            ...prev,
            [key]: { ...prev[key], active: true },
          }));
        }, index * 300 + 500),
      );

      return () => timeouts.forEach(clearTimeout);
    }
  }, [user]);

  const handlePowerHover = (powerId) => {
    setShowPowerTooltip(powerId);
  };

  const handlePowerLeave = () => {
    setShowPowerTooltip(null);
  };

  const handleAddPower = async (e) => {
    e.preventDefault();
    if (!newPower) {
      showNotification('Por favor, selecciona un poder.', 'error');
      return;
    }

    try {
      showNotification('Adquiriendo poder...', 'info');
      const response = await axiosInstance.post('auth/profile/powers', { powerId: newPower });

      if (response.data.status === 'success') {
        setUser({ ...user, powers: response.data.powers });
        setNewPower('');

        showNotification('¡Poder adquirido con éxito!', 'success');

        setPowerAnimations((prev) => ({
          ...prev,
          [newPower]: { delay: 0, active: true },
        }));
      } else {
        showNotification(response.data.message || 'Error al agregar el poder', 'error');
      }
    } catch (error) {

      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        showNotification('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
        navigate('/login');
      } else {
        showNotification(`Error al agregar el poder: ${error.message}`, 'error');
      }
    }
  };

  const handleRemovePower = async (powerId) => {
    try {
      showNotification('Desactivando poder...', 'info');
      const response = await axiosInstance.delete('auth/profile/powers', {
        data: { powerId },
      });

      if (response.data.status === 'success') {
        setPowerAnimations((prev) => ({
          ...prev,
          [powerId]: { ...prev[powerId], active: false, removing: true },
        }));

        setTimeout(() => {
          setUser({ ...user, powers: response.data.powers });
          showNotification('Poder eliminado correctamente', 'success');
        }, 800);
      } else {
        showNotification(response.data.message || 'Error al eliminar el poder', 'error');
      }
    } catch (error) {

      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        showNotification('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
        navigate('/login');
      } else {
        showNotification(`Error al eliminar el poder: ${error.message}`, 'error');
      }
    }
  };

  const getPowerDetails = (powerId) => {
    const power = powers.find((p) => p.id === powerId);
    return power ? { title: power.title, icon: power.icon, description: power.description } : { title: powerId, icon: '⚡', description: 'Desconocido' };
  };

  return (
    <div className="profile-section powers-section">
      <h3 className="profile-section-title">PODERES</h3>
      <div className="powers-grid full">
        {Array.isArray(user?.powers) && user.powers.length > 0 ? (
          user.powers.map((power) => {
            const { title, icon, description } = getPowerDetails(power);
            const isActive = powerAnimations[power]?.active;
            const isRemoving = powerAnimations[power]?.removing;

            return (
              <div
                key={power}
                className={`power-item large ${isActive ? 'active' : ''} ${isRemoving ? 'removing' : ''} power-item-large-styles`}
                style={{
                  animationDelay: `${powerAnimations[power]?.delay || 0}ms`,
                }}
                onMouseEnter={() => handlePowerHover(power)}
                onMouseLeave={handlePowerLeave}
              >
                <div className="power-icon large">{icon}</div>
                <div className="power-name">{title}</div>
                {showPowerTooltip === power && (
                  <div className="power-tooltip large">
                    <div className="tooltip-title">{title}</div>
                    <div className="tooltip-description">{description}</div>
                    <button
                      className="cyber-button small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePower(power);
                      }}
                    >
                      Desactivar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-icon">⚡</div>
            <p>No tienes poderes asignados.</p>
          </div>
        )}
      </div>

      <form className="power-form-container" onSubmit={handleAddPower}>
        <select
          value={newPower}
          onChange={(e) => setNewPower(e.target.value)}
          className="power-select-styles"
        >
          <option value="">Selecciona un poder</option>
          {powers.map((power) => (
            <option key={power.id} value={power.id}>
              {power.title}
            </option>
          ))}
        </select>
        <button type="submit" className="cyber-button glow-effect">
          AGREGAR PODER
        </button>
      </form>
    </div>
  );
};

PowersSection.displayName = 'PowersSection';

export default PowersSection;
