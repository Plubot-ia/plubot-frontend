import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // Cambiar useParams por useSearchParams
import useAPI from '../../hooks/useAPI';
import FlowEditor from '../onboarding/flow-editor/FlowEditor';

const PlubotEdit = () => {
  const [searchParams] = useSearchParams(); // Usar useSearchParams
  const plubotId = searchParams.get('plubotId'); // Obtener plubotId de los parámetros de consulta
  const { request } = useAPI();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlubotData = async () => {
      if (!plubotId) {
        setError('ID del Plubot no proporcionado');
        setIsLoading(false);
        return;
      }

      try {
        const response = await request('GET', `/api/plubots/${plubotId}`);
        if (response.status === 'success') {
          const { name, flows, edges } = response.plubot;
          const normalizedNodes = Array.isArray(flows) ? flows.map((flow, index) => ({
            id: `node-${index}`,
            type: flow.intent || 'message',
            position: { x: 100 * index, y: 100 },
            data: {
              label: flow.user_message || `Nodo ${index + 1}`,
              message: flow.bot_response || '',
              condition: flow.condition,
            },
            width: 150,
            height: 150,
            draggable: true,
            zIndex: 1000,
          })) : [];
          const normalizedEdges = Array.isArray(edges) ? edges.map((edge, index) => ({
            id: `edge-${index}`,
            source: edge.source,
            target: edge.target,
            type: 'default',
            style: { stroke: '#b1b1b7', strokeWidth: 2 },
          })) : [];
          setName(name || 'Plubot sin nombre');
          setNodes(normalizedNodes);
          setEdges(normalizedEdges);
        } else {
          setError('Error al cargar el flujo: ' + response.message);
        }
      } catch (error) {
        setError(`Error al cargar el Plubot: ${error.message}`);
        if (error.message.includes('404')) {
          setError('Plubot no encontrado. Redirigiendo al perfil...');
          setTimeout(() => navigate('/profile'), 2000);
        }
      } finally {
        setIsLoading(false);
      }

    };

    fetchPlubotData();
  }, [plubotId, request, navigate]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a' }}>
        <div style={{ background: 'white', padding: 20, border: '1px solid black' }}>
          Cargando datos del Plubot...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a' }}>
        <div style={{ background: '#ffcccc', padding: 20, border: '1px solid black', textAlign: 'center' }}>
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
      selectedNode={null}
      setSelectedNode={() => {}}
      setByteMessage={() => {}}
      showSimulation={false}
      setShowSimulation={() => {}}
      setShowConnectionEditor={() => {}}
      setSelectedConnection={() => {}}
      setConnectionProperties={() => {}}
      handleError={() => {}}
      plubotId={plubotId}
      name={name}
      notifyByte={() => {}}
    />
  );
};

export default PlubotEdit;