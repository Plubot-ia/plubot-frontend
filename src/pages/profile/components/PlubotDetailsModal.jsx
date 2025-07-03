import React from 'react';

import { powers } from '@/data/powers';

/**
 * Componente que muestra los detalles de un plubot en un modal
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.plubot - Datos del plubot a mostrar
 * @param {Function} props.setModalPlubot - Función para cerrar el modal
 * @param {Function} props.navigate - Función de navegación
 */
const PlubotDetailsModal = ({ plubot, setModalPlubot, navigate }) => {
  const getPowerDetails = (powerId) => {
    const power = powers.find((p) => p.id === powerId);
    return power
      ? { title: power.title, icon: power.icon, description: power.description }
      : { title: powerId, icon: '⚡', description: 'Desconocido' };
  };

  const getAvailablePower = (currentPowers) => {
    const availablePowers = powers.filter(
      (p) => !currentPowers?.includes(p.id),
    );
    return availablePowers.length > 0 ? availablePowers[0] : null;
  };

  return (
    <div
      className='modal-overlay modal-overlay-immediate'
      onClick={() => setModalPlubot(null)}
      onKeyDown={(e) => e.key === 'Enter' && setModalPlubot(null)}
      role='button'
      tabIndex='0'
      aria-label='Cerrar modal'
      onKeyUp={(e) => e.key === 'Escape' && setModalPlubot(null)}
    >
      <div
        className='modal-content animated animate-in modal-content-styles'
        // Nota: No se asignan eventos aquí para cumplir con accesibilidad.
        // La propagación se maneja de otra forma si es necesario.
        role='dialog'
        aria-labelledby='plubot-modal-title'
      >
        <button
          className='modal-close glow-effect'
          onClick={() => setModalPlubot(null)}
        >
          ✖
        </button>
        <div className='plubot-icon-container plubot-icon-container-styles'>
          <div className='plubot-icon plubot-icon-styles'>
            {plubot.powers && plubot.powers.length > 0
              ? getPowerDetails(plubot.powers[0]).icon
              : '🤖'}
          </div>
        </div>
        <h3
          id='plubot-modal-title'
          className='modal-title text-glow modal-title-styles'
        >
          {plubot.name || 'Plubot'}
        </h3>
        <p className='modal-paragraph-id'>
          <strong>ID:</strong> {plubot.id}
        </p>
        <p className='modal-paragraph-integrations'>
          Tu Plubot actualmente está conectado a{' '}
          <span className='modal-integrations-highlight'>
            {plubot.powers && plubot.powers.length > 0
              ? plubot.powers
                  .map((powerId) => getPowerDetails(powerId).title)
                  .join(', ')
              : 'ninguna integración'}
          </span>
          .
        </p>
        {plubot.powers && plubot.powers.length > 0 && (
          <div className='modal-powers-container'>
            <h4 className='modal-powers-title'>Poderes Activos</h4>
            <ul className='modal-powers-list'>
              {plubot.powers.map((powerId) => (
                <li key={powerId} className='modal-power-item'>
                  <span className='modal-power-icon'>
                    {getPowerDetails(powerId).icon}
                  </span>
                  <div>
                    <div className='modal-power-name'>
                      {getPowerDetails(powerId).title}
                    </div>
                    <div className='modal-power-description'>
                      {getPowerDetails(powerId).description}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {plubot.flows && plubot.flows.length > 0 ? (
          <div className='modal-flows-container'>
            <h4 className='modal-flows-title'>Flujos Configurados</h4>
            <ul className='modal-flows-list'>
              {plubot.flows.map((flow) => (
                <li
                  key={
                    flow.id ||
                    `flow-${flow.intent}-${flow.user_message || 'default'}`
                  }
                  className='modal-flow-item'
                >
                  <div className='modal-flow-name'>
                    Flujo {flow.position || 'N/A'} ({flow.intent})
                  </div>
                  <div className='modal-flow-description'>
                    <strong>Mensaje del usuario:</strong>{' '}
                    {flow.user_message || 'N/A'}
                    <br />
                    <strong>Respuesta del bot:</strong>{' '}
                    {flow.bot_response || 'N/A'}
                    <br />
                    <strong>Condición:</strong> {flow.condition || 'Ninguna'}
                    <br />
                    <strong>Posición:</strong> {flow.position || 'N/A'}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className='modal-empty-flows'>
            <p>
              No hay flujos configurados para este Plubot. Configúralos en el
              editor de flujos.
            </p>
          </div>
        )}
        {plubot.edges && plubot.edges.length > 0 ? (
          <div className='modal-edges-container'>
            <h4 className='modal-edges-title'>Conexiones</h4>
            <ul className='modal-edges-list'>
              {plubot.edges.map((edge) => (
                <li
                  key={`edge-${edge.source}-${edge.target}`}
                  className='modal-edge-item'
                >
                  <div className='modal-edge-description'>
                    <strong>Conexión:</strong> Desde nodo {edge.source} hacia
                    nodo {edge.target}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className='modal-empty-edges'>
            <p>No hay conexiones definidas para este Plubot.</p>
          </div>
        )}
        {(() => {
          const availablePower = getAvailablePower(plubot.powers || []);
          return availablePower ? (
            <div className='modal-available-power-container'>
              <div className='modal-available-power-bg' />
              <p className='modal-available-power-text'>
                ¡Agrega{' '}
                <strong className='modal-available-power-highlight'>
                  {availablePower.title}
                </strong>{' '}
                para desbloquear la capacidad de{' '}
                {availablePower.description.toLowerCase()}!
              </p>
            </div>
          ) : (
            <div className='modal-all-powers-container'>
              <p>
                Tu Plubot ya tiene todas las integraciones disponibles. ¡Sigue
                creando!
              </p>
            </div>
          );
        })()}
        <button
          className='cyber-button glow-effect modal-modify-plubot-button'
          onClick={() => navigate('/factory')}
        >
          MODIFICAR PLUBOT
        </button>
      </div>
    </div>
  );
};

export default PlubotDetailsModal;
