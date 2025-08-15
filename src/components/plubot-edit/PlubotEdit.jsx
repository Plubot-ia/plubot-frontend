import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import FlowEditor from '../onboarding/flow-editor/FlowEditor';

import usePlubotData from './hooks/usePlubotData';

// No-operation function for props that are not used in this context.
// eslint-disable-next-line no-empty-function
const noOp = () => {};

const PlubotEdit = () => {
  const [searchParameters] = useSearchParams();
  const plubotId = searchParameters.get('plubotId');
  const navigate = useNavigate();
  const { nodes, edges, name, isLoading, error, setNodes, setEdges } = usePlubotData(plubotId);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#1a1a1a',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: 20,
            border: '1px solid black',
          }}
        >
          Cargando datos del Plubot...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#1a1a1a',
        }}
      >
        <div
          style={{
            background: '#ffcccc',
            padding: 20,
            border: '1px solid black',
            textAlign: 'center',
          }}
        >
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/profile')}>Volver al perfil</button>
        </div>
      </div>
    );
  }

  return (
    <FlowEditor
      nodes={nodes}
      edges={edges}
      setNodes={setNodes}
      setEdges={setEdges}
      selectedNode={undefined}
      setSelectedNode={noOp}
      setByteMessage={noOp}
      showSimulation={false}
      setShowSimulation={noOp}
      setShowConnectionEditor={noOp}
      setSelectedConnection={noOp}
      setConnectionProperties={noOp}
      handleError={noOp}
      plubotId={plubotId}
      name={name}
      notifyByte={noOp}
    />
  );
};

export default PlubotEdit;
