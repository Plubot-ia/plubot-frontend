import PropTypes from 'prop-types';

import { powers } from '@/data/powers';

// --- Helper Functions ---
const getPowerDetails = (powerId) => {
  const power = powers.find((p) => p.id === powerId);
  return power
    ? { title: power.title, icon: power.icon, description: power.description }
    : { title: powerId, icon: '⚡', description: 'Desconocido' };
};

const getAvailablePower = (currentPowers) => {
  const availablePowers = powers.filter((p) => !currentPowers?.includes(p.id));
  return availablePowers.length > 0 ? availablePowers[0] : undefined;
};

// --- Sub-components ---

const ModalHeader = ({ plubot }) => (
  <>
    <div className='plubot-icon-container plubot-icon-container-styles'>
      <div className='plubot-icon plubot-icon-styles'>
        {plubot.powers?.length > 0 ? getPowerDetails(plubot.powers[0]).icon : '🤖'}
      </div>
    </div>
    <h3 id='plubot-modal-title' className='modal-title text-glow modal-title-styles'>
      {plubot.name ?? 'Plubot'}
    </h3>
    <p className='modal-paragraph-id'>
      <strong>ID:</strong> {plubot.id}
    </p>
    <p className='modal-paragraph-integrations'>
      Tu Plubot actualmente está conectado a{' '}
      <span className='modal-integrations-highlight'>
        {plubot.powers?.length > 0
          ? plubot.powers.map((id) => getPowerDetails(id).title).join(', ')
          : 'ninguna integración'}
      </span>
      .
    </p>
  </>
);
ModalHeader.propTypes = {
  plubot: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    powers: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

const ActivePowers = ({ powerIds }) => (
  <div className='modal-powers-container'>
    <h4 className='modal-powers-title'>Poderes Activos</h4>
    <ul className='modal-powers-list'>
      {powerIds.map((powerId) => {
        const details = getPowerDetails(powerId);
        return (
          <li key={powerId} className='modal-power-item'>
            <span className='modal-power-icon'>{details.icon}</span>
            <div>
              <div className='modal-power-name'>{details.title}</div>
              <div className='modal-power-description'>{details.description}</div>
            </div>
          </li>
        );
      })}
    </ul>
  </div>
);
ActivePowers.propTypes = {
  powerIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const ConfiguredFlows = ({ flows }) => (
  <div className='modal-flows-container'>
    <h4 className='modal-flows-title'>Flujos Configurados</h4>
    <ul className='modal-flows-list'>
      {flows.map((flow) => (
        <li
          key={flow.id ?? `flow-${flow.intent}-${flow.user_message ?? 'default'}`}
          className='modal-flow-item'
        >
          <div className='modal-flow-name'>
            Flujo {flow.position ?? 'N/A'} ({flow.intent})
          </div>
          <div className='modal-flow-description'>
            <strong>Mensaje del usuario:</strong> {flow.user_message ?? 'N/A'}
            <br />
            <strong>Respuesta del bot:</strong> {flow.bot_response ?? 'N/A'}
            <br />
            <strong>Condición:</strong> {flow.condition ?? 'Ninguna'}
            <br />
            <strong>Posición:</strong> {flow.position ?? 'N/A'}
          </div>
        </li>
      ))}
    </ul>
  </div>
);
ConfiguredFlows.propTypes = {
  flows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      intent: PropTypes.string,
      user_message: PropTypes.string,
      bot_response: PropTypes.string,
      condition: PropTypes.string,
      position: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ).isRequired,
};

const EdgeConnections = ({ edges }) => (
  <div className='modal-edges-container'>
    <h4 className='modal-edges-title'>Conexiones</h4>
    <ul className='modal-edges-list'>
      {edges.map((edge) => (
        <li key={`edge-${edge.source}-${edge.target}`} className='modal-edge-item'>
          <div className='modal-edge-description'>
            <strong>Conexión:</strong> Desde nodo {edge.source} hacia nodo {edge.target}
          </div>
        </li>
      ))}
    </ul>
  </div>
);
EdgeConnections.propTypes = {
  edges: PropTypes.arrayOf(
    PropTypes.shape({
      source: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      target: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
  ).isRequired,
};

const AvailablePower = ({ currentPowers }) => {
  const available = getAvailablePower(currentPowers);
  if (!available) {
    return (
      <div className='modal-all-powers-container'>
        <p>Tu Plubot ya tiene todas las integraciones disponibles. ¡Sigue creando!</p>
      </div>
    );
  }
  return (
    <div className='modal-available-power-container'>
      <div className='modal-available-power-bg' />
      <p className='modal-available-power-text'>
        ¡Agrega <strong className='modal-available-power-highlight'>{available.title}</strong> para
        desbloquear la capacidad de {available.description.toLowerCase()}!
      </p>
    </div>
  );
};
AvailablePower.propTypes = {
  currentPowers: PropTypes.arrayOf(PropTypes.string).isRequired,
};

// --- Main Component ---

const PlubotDetailsModal = ({ plubot, setModalPlubot, navigate }) => (
  <div
    className='modal-overlay modal-overlay-immediate'
    onClick={() => setModalPlubot(undefined)}
    onKeyDown={(event) => event.key === 'Enter' && setModalPlubot(undefined)}
    role='button'
    tabIndex='0'
    aria-label='Cerrar modal'
    onKeyUp={(event) => event.key === 'Escape' && setModalPlubot(undefined)}
  >
    <div
      className='modal-content animated animate-in modal-content-styles'
      role='dialog'
      aria-labelledby='plubot-modal-title'
    >
      <button className='modal-close glow-effect' onClick={() => setModalPlubot(undefined)}>
        ✖
      </button>
      <ModalHeader plubot={plubot} />
      {plubot.powers?.length > 0 && <ActivePowers powerIds={plubot.powers} />}
      {plubot.flows?.length > 0 ? (
        <ConfiguredFlows flows={plubot.flows} />
      ) : (
        <div className='modal-empty-flows'>
          <p>No hay flujos configurados.</p>
        </div>
      )}
      {plubot.edges?.length > 0 ? (
        <EdgeConnections edges={plubot.edges} />
      ) : (
        <div className='modal-empty-edges'>
          <p>No hay conexiones definidas.</p>
        </div>
      )}
      <AvailablePower currentPowers={plubot.powers ?? []} />
      <button
        className='cyber-button glow-effect modal-modify-plubot-button'
        onClick={() => navigate('/factory')}
      >
        MODIFICAR PLUBOT
      </button>
    </div>
  </div>
);

PlubotDetailsModal.propTypes = {
  plubot: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    powers: PropTypes.arrayOf(PropTypes.string),
    flows: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        intent: PropTypes.string,
        user_message: PropTypes.string,
        bot_response: PropTypes.string,
        condition: PropTypes.string,
        position: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
    edges: PropTypes.arrayOf(
      PropTypes.shape({
        source: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        target: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      }),
    ),
  }).isRequired,
  setModalPlubot: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
};

export default PlubotDetailsModal;
