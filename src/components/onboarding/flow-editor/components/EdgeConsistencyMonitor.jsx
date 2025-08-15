import PropTypes from 'prop-types';
import { useCallback, useEffect } from 'react';

import { fixAllEdgeHandles, nodesExistInDOM } from '../utils/handleFixer';

/**
 * Componente EdgeConsistencyMonitor - Versión mejorada
 *
 * Este componente monitorea la consistencia de las aristas y asegura que
 * todas las aristas válidas se mantengan en el estado de ReactFlow.
 *
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.edges - Aristas actuales
 * @param {Function} props.setEdges - Función para establecer las aristas
 */
const EdgeConsistencyMonitor = ({ edges, setEdges }) => {
  // Función para verificar la consistencia de las aristas, extraída y optimizada
  const checkEdgeConsistency = useCallback(() => {
    const localEdges = localStorage.getItem('plubot-flow-edges');
    if (!localEdges) return;

    try {
      const parsedLocalEdges = JSON.parse(localEdges);
      const nodeIds = new Set(
        [...document.querySelectorAll('.react-flow__node')].map((node) => node.dataset.id),
      );

      const validLocalEdges = parsedLocalEdges.filter((edge) => {
        const sourceExists = nodeIds.has(edge.source);
        const targetExists = nodeIds.has(edge.target);
        return sourceExists && targetExists && nodesExistInDOM(edge);
      });

      const fixedEdges = fixAllEdgeHandles(validLocalEdges);

      if (JSON.stringify(fixedEdges) !== JSON.stringify(parsedLocalEdges)) {
        localStorage.setItem('plubot-flow-edges', JSON.stringify(fixedEdges));
      }

      if (edges.length === 0 && fixedEdges.length > 0) {
        setEdges(fixedEdges);
        return;
      }

      if (fixedEdges.length > edges.length) {
        const missingEdges = fixedEdges.filter(
          (localEdge) => !edges.some((edge) => edge.id === localEdge.id),
        );
        if (missingEdges.length > 0) {
          setEdges((currentEdges) => [...fixAllEdgeHandles(currentEdges), ...missingEdges]);
        }
      } else {
        const validCurrentEdges = edges.filter((edge) => nodesExistInDOM(edge));
        const fixedCurrentEdges = fixAllEdgeHandles(validCurrentEdges);
        if (JSON.stringify(fixedCurrentEdges) !== JSON.stringify(edges)) {
          setEdges(fixedCurrentEdges);
        }
      }
    } catch {
      // Ignorar errores de parseo de localStorage corrupto
    }
  }, [edges, setEdges]);

  useEffect(() => {
    if (!edges || !Array.isArray(edges) || !setEdges) return;

    const timer = setTimeout(checkEdgeConsistency, 1000);
    const handleEdgesChanged = () => setTimeout(checkEdgeConsistency, 100);

    document.addEventListener('edges-changed', handleEdgesChanged);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('edges-changed', handleEdgesChanged);
    };
  }, [edges, setEdges, checkEdgeConsistency]);

  // Este componente no renderiza nada visible, se usa undefined para cumplir con la regla `no-null`.
};

EdgeConsistencyMonitor.propTypes = {
  edges: PropTypes.arrayOf(PropTypes.object).isRequired,
  setEdges: PropTypes.func.isRequired,
};

export default EdgeConsistencyMonitor;
