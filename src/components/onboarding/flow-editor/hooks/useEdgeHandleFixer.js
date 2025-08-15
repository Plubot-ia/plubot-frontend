/**
 * Hook para validar y corregir handles de aristas en tiempo real
 */
import { useEffect, useCallback, useRef } from 'react';
import { useStoreApi } from 'reactflow';

import { fixAllEdgeHandles } from '../utils/handleFixer';

/**
 * Hook que valida y corrige los handles de las aristas
 * Soluciona el problema "Couldn't create edge for source handle id: 'default'"
 * OPTIMIZED: Using useStoreApi instead of useReactFlow to prevent re-renders
 */
const useEdgeHandleFixer = () => {
  const store = useStoreApi();
  const getEdges = useCallback(() => store.getState().edges, [store]);
  const setEdges = useCallback(
    (edges) => {
      store.setState({
        edges: typeof edges === 'function' ? edges(store.getState().edges) : edges,
      });
    },
    [store],
  );
  // Bandera para evitar bucle infinito
  const validationRunning = useRef(false);
  const validationTimeout = useRef(null);

  // Función para validar y corregir handles con protección contra bucles
  const validateAndFixHandles = useCallback(() => {
    // Evitar ejecuciones múltiples y bucles infinitos
    if (validationRunning.current) {
      return;
    }

    try {
      validationRunning.current = true;

      // Limpiar timeout previo si existe
      if (validationTimeout.current) {
        clearTimeout(validationTimeout.current);
      }

      // Usar un timeout para garantizar que no haya actualizaciones continuas
      validationTimeout.current = setTimeout(() => {
        const currentEdges = getEdges();
        if (!currentEdges || currentEdges.length === 0) {
          validationRunning.current = false;
          return;
        }

        // Comparar aristas antes de aplicar cambios para evitar actualizaciones innecesarias
        const edgeIdsString = currentEdges
          .map((edge) => edge.id)
          .sort()
          .join(',');
        const fixedEdges = fixAllEdgeHandles(currentEdges);
        const fixedEdgeIdsString = fixedEdges
          .map((edge) => edge.id)
          .sort()
          .join(',');

        // Solo actualizar si realmente hay cambios para evitar bucles
        if (edgeIdsString !== fixedEdgeIdsString && fixedEdges.length > 0) {
          setEdges(fixedEdges);
        }

        validationRunning.current = false;
      }, 300); // Delay para evitar actualizaciones en cascada
    } catch {
      validationRunning.current = false;
    }
  }, [getEdges, setEdges]);

  // Validar handles al iniciar y cuando cambian las aristas
  useEffect(() => {
    // Ejecutar al montar el componente
    validateAndFixHandles();

    // Escuchar eventos de ReactFlow para validar handles cuando sea necesario
    const handleEdgeUpdate = () => {
      // Reducir el retraso para una corrección más inmediata
      setTimeout(validateAndFixHandles, 20);
    };

    // Registrar listener para eventos de ReactFlow
    document.addEventListener('edge-update-required', handleEdgeUpdate);

    // Limpiar listener al desmontar
    return () => {
      document.removeEventListener('edge-update-required', handleEdgeUpdate);
    };
  }, [validateAndFixHandles]);

  return {
    validateAndFixHandles,
  };
};

export default useEdgeHandleFixer;
