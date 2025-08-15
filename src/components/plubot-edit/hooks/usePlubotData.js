import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import useAPI from '../../../hooks/useAPI';

const usePlubotData = (plubotId) => {
  const { request } = useAPI();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    const fetchPlubotData = async () => {
      if (!plubotId) {
        setError('ID del Plubot no proporcionado');
        setIsLoading(false);
        return;
      }

      try {
        const response = await request('GET', `/plubots/${plubotId}`);
        if (response.status === 'success') {
          const { name: plubotName, flows, edges: plubotEdges } = response.plubot;
          const normalizedNodes = Array.isArray(flows)
            ? flows.map((flow, index) => ({
                id: `node-${index}`,
                type: flow.intent || 'message',
                position: { x: 100 * index, y: 100 },
                data: {
                  label: flow.user_message || `Nodo ${index + 1}`,
                  message: flow.bot_response ?? '',
                  condition: flow.condition,
                },
                width: 150,
                height: 150,
                draggable: true,
                zIndex: 1000,
              }))
            : [];
          const normalizedEdges = Array.isArray(plubotEdges)
            ? plubotEdges.map((edge, index) => ({
                id: `edge-${index}`,
                source: edge.source,
                target: edge.target,
                type: 'default',
                style: { stroke: '#b1b1b7', strokeWidth: 2 },
              }))
            : [];
          setName(plubotName || 'Plubot sin nombre');
          setNodes(normalizedNodes);
          setEdges(normalizedEdges);
        } else {
          setError(`Error al cargar el flujo: ${response.message}`);
        }
      } catch (catchedError) {
        setError(`Error al cargar el Plubot: ${catchedError.message}`);
        if (catchedError.message.includes('404')) {
          setError('Plubot no encontrado. Redirigiendo al perfil...');
          setTimeout(() => navigate('/profile'), 2000);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlubotData();
  }, [plubotId, request, navigate]);

  return { nodes, edges, name, isLoading, error, setNodes, setEdges };
};

export default usePlubotData;
