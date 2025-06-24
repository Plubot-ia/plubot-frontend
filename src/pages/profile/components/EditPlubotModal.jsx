import React, { useState, useEffect } from 'react';

import plubotLogo from '@/assets/img/logo.svg';

/**
 * Componente modal para editar un plubot
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.plubot - Datos del plubot a editar
 * @param {Function} props.setEditModalPlubot - Función para cerrar el modal
 * @param {Function} props.handleEditFlows - Función para editar los flujos del plubot
 * @param {Function} props.showNotification - Función para mostrar notificaciones
 * @param {Function} props.navigate - Función de navegación
 */
const EditPlubotModal = ({
  plubot,
  setEditModalPlubot,
  handleEditFlows,
  showNotification,
  navigate,
}) => {
  const [hoverIdentity, setHoverIdentity] = useState(false);
  const [hoverFlows, setHoverFlows] = useState(false);
  const [particleEffect, setParticleEffect] = useState(false);

  // Función para calcular el nivel de poder basado en diferentes formatos posibles de plubot.powers
  const calculatePowerLevel = (powers) => {
    if (!powers) return 0;

    // Si powers es un string (formato: 'poder1,poder2,poder3')
    if (typeof powers === 'string') {
      return powers.split(',').filter(p => p.trim()).length;
    }

    // Si powers es un array
    if (Array.isArray(powers)) {
      return powers.length;
    }

    // Si powers es un objeto (por ejemplo, si viene como un objeto JSON)
    if (typeof powers === 'object') {
      return Object.keys(powers).length;
    }

    return 0;
  };

  // Efecto para mostrar partículas al abrir el modal
  useEffect(() => {
    const timer = setTimeout(() => {
      setParticleEffect(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);
  const handleEditIdentity = () => {
    if (!plubot.id) {
      showNotification('Error: ID del Plubot no válido', 'error');
      return;
    }
    // Efecto de sonido (opcional)
    const audio = new Audio('/assets/sounds/click.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});


    setEditModalPlubot(null);
    // Usar la ruta correcta para editar la identidad del Plubot
    navigate(`/plubot/edit/personalization?plubotId=${plubot.id}`);
  };

  return (
    <div className="modal-overlay modal-overlay-immediate" onClick={() => setEditModalPlubot(null)}>
      {/* Efecto de partículas */}
      {particleEffect && (
        <div className="edit-modal-particles">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 5}s`,
            }} />
          ))}
        </div>
      )}

      <div
        className="edit-modal-content-styles cyber-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decoración de esquinas */}
        <div className="corner-decoration top-left" />
        <div className="corner-decoration top-right" />
        <div className="corner-decoration bottom-left" />
        <div className="corner-decoration bottom-right" />

        <button
          className="modal-close-styles"
          onClick={() => setEditModalPlubot(null)}
        >
          <span className="close-icon">✖</span>
        </button>

        <div className="edit-modal-header">
          <div className="edit-modal-avatar">
            <div className="avatar-hologram">
              <div className="hologram-ring" />
              <div className="hologram-ring" />
              <div className="hologram-image">
                <img src={plubotLogo} alt="Plubot Logo" className="plubot-logo" />
              </div>
            </div>
          </div>

          <h3 className="edit-modal-title-styles">
            <span className="edit-modal-title-glow">Personalizar</span> {plubot.name || 'Plubot'}
          </h3>
        </div>

        <p className="edit-modal-paragraph">
          Selecciona una opción para modificar las características de tu Plubot.
        </p>

        <div className="edit-modal-buttons-container">
          <button
            className={`edit-modal-identity-button cyber-button ${hoverIdentity ? 'hover' : ''}`}
            onClick={handleEditIdentity}
            onMouseEnter={() => setHoverIdentity(true)}
            onMouseLeave={() => setHoverIdentity(false)}
          >
            <div className="button-glitch" />
            <span className="edit-modal-icon identity-icon">🎨</span>
            <span className="button-text">Editar Identidad</span>
            <div className="button-scanner" />
          </button>

          <button
            className={`edit-modal-flows-button cyber-button ${hoverFlows ? 'hover' : ''}`}
            onClick={() => {
              if (!plubot.id) {
                showNotification('Error: ID del Plubot no válido. Por favor, crea un nuevo plubot.', 'error');
                setEditModalPlubot(null);
                return;
              }

              // Efecto de sonido (opcional)
              const audio = new Audio('/assets/sounds/click.mp3');
              audio.volume = 0.3;
              audio.play().catch(() => {});


              handleEditFlows(plubot.id);
            }}
            onMouseEnter={() => setHoverFlows(true)}
            onMouseLeave={() => setHoverFlows(false)}
          >
            <div className="button-glitch" />
            <span className="edit-modal-icon flows-icon">🔄</span>
            <span className="button-text">Editar Flujos</span>
            <div className="button-scanner" />
          </button>
        </div>

        <div className="modal-power-level">
          <div className="power-bar">
            <div className="power-fill" style={{
              width: `${Math.min(100, calculatePowerLevel(plubot.powers) * 20)}%`,
            }} />
          </div>
          <span className="power-text">Nivel de Poder</span>
        </div>

        {/* Indicador visual para mostrar que el modal está completo */}
        <div className="modal-footer-decoration">
          <div className="footer-line" />
        </div>
      </div>
    </div>
  );
};

export default EditPlubotModal;
