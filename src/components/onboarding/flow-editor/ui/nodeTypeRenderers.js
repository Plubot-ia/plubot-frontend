/**
 * Helpers individuales para renderizar diferentes tipos de nodo
 * Divide la complejidad del switch gigante en funciones pequeñas
 */

export const renderStartNode = (_data) => (
  <div className='node-content start-node-content'>
    <div className='node-title'>Inicio</div>
    <div className='node-description'>Punto de entrada del flujo</div>
  </div>
);

export const renderEndNode = (_data) => (
  <div className='node-content end-node-content'>
    <div className='node-title'>Fin</div>
    <div className='node-description'>Punto de salida del flujo</div>
  </div>
);

export const renderMessageNode = (data) => (
  <div className='node-content message-node-content'>
    <div className='node-title'>Mensaje</div>
    <div className='node-description'>{data.label || 'Nodo de mensaje'}</div>
  </div>
);

export const renderDecisionNode = (data) => (
  <div className='node-content decision-node-content'>
    <div className='node-title'>Decisión</div>
    <div className='node-description'>{data.label || 'Nodo de decisión'}</div>
  </div>
);

export const renderActionNode = (data) => (
  <div className='node-content action-node-content'>
    <div className='node-title'>Acción</div>
    <div className='node-description'>{data.label || 'Nodo de acción'}</div>
  </div>
);

export const renderOptionNode = (data) => (
  <div className='node-content option-node-content'>
    <div className='node-title'>Opción</div>
    <div className='node-description'>{data.label || 'Nodo de opción'}</div>
  </div>
);

export const renderHttpRequestNode = (data) => (
  <div className='node-content httprequest-node-content'>
    <div className='node-title'>HTTP Request</div>
    <div className='node-description'>{data.label || 'Solicitud HTTP'}</div>
  </div>
);

export const renderWebhookNode = (data) => (
  <div className='node-content webhook-node-content'>
    <div className='node-title'>Webhook</div>
    <div className='node-description'>{data.label || 'Nodo Webhook'}</div>
  </div>
);

export const renderDatabaseNode = (data) => (
  <div className='node-content database-node-content'>
    <div className='node-title'>Base de Datos</div>
    <div className='node-description'>{data.label || 'Nodo de BD'}</div>
  </div>
);

export const renderAiNode = (data) => (
  <div className='node-content ai-node-content'>
    <div className='node-title'>IA</div>
    <div className='node-description'>{data.label || 'Nodo de IA'}</div>
  </div>
);

export const renderNlpNode = (data) => (
  <div className='node-content nlp-node-content'>
    <div className='node-title'>NLP</div>
    <div className='node-description'>{data.label || 'Nodo NLP'}</div>
  </div>
);

export const renderComplexConditionNode = (data) => (
  <div className='node-content complex-condition-node-content'>
    <div className='node-title'>Condición Compleja</div>
    <div className='node-description'>{data.label || 'Condición compleja'}</div>
  </div>
);

export const renderPowerNode = (data) => (
  <div className='node-content power-node-content'>
    <div className='node-title'>Power Node</div>
    <div className='node-description'>{data.label || 'Nodo avanzado'}</div>
  </div>
);

export const renderDefaultNode = (data) => (
  <div className='node-content message-node-content'>
    <div className='node-title'>Nodo Base</div>
    <div className='node-description'>{data.label || 'Nodo Base'}</div>
  </div>
);

export const renderGenericNode = (type, data, id) => {
  const cssType = type ? type.toLowerCase().replaceAll(/[_\s]+/g, '-') : 'message';
  const displayType = type ? type.replaceAll(/[_\s]+/g, ' ') : 'Nodo';

  return (
    <div className={`node-content ${cssType}-node-content`}>
      <div className='node-title'>{displayType}</div>
      <div className='node-description'>{data.label || `${displayType} ${id.slice(0, 6)}`}</div>
    </div>
  );
};
