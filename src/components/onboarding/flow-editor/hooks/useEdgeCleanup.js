/**
 * @file useEdgeCleanup.js
 * @description Hook especializado para limpiar automáticamente edges con handles undefined
 * y resolver ReactFlow Error #008 de forma sistemática y preventiva
 * @version 1.0.0
 */

import { useEffect, useCallback } from 'react';

import useFlowStore from '../../../../stores/use-flow-store';

/**
 * Hook para limpieza automática de edges con handles undefined
 * Resuelve ReactFlow Error #008 de forma preventiva y sistemática
 *
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoCleanup - Si debe ejecutar limpieza automática
 * @param {number} options.cleanupInterval - Intervalo de limpieza en ms (default: 5000)
 * @returns {Object} Funciones de limpieza manual
 */
export const useEdgeCleanup = ({ autoCleanup = true, cleanupInterval = 5000 } = {}) => {
  // Selectores del store
  const edges = useFlowStore((state) => state.edges);
  const cleanUpInvalidHandleEdges = useFlowStore((state) => state.cleanUpInvalidHandleEdges);
  const cleanUpEdges = useFlowStore((state) => state.cleanUpEdges);

  // Función para detectar edges problemáticos
  const detectProblematicEdges = useCallback(() => {
    const problematicEdges = edges.filter(
      (edge) => edge.sourceHandle === undefined || edge.targetHandle === undefined,
    );

    return problematicEdges;
  }, [edges]);

  // Función de limpieza manual
  const manualCleanup = useCallback(() => {
    const problematicEdges = detectProblematicEdges();

    if (problematicEdges.length > 0) {
      cleanUpInvalidHandleEdges();
    }
  }, [detectProblematicEdges, cleanUpInvalidHandleEdges]);

  // Función de limpieza completa (nodos + handles)
  const fullCleanup = useCallback(() => {
    cleanUpEdges();
  }, [cleanUpEdges]);

  // Efecto para limpieza automática
  useEffect(() => {
    if (!autoCleanup) {
      return;
    }

    // Verificar que las funciones del store estén disponibles
    if (!cleanUpInvalidHandleEdges) {
      return;
    }

    // Limpieza inicial inmediata
    const problematicEdges = detectProblematicEdges();

    // Limpieza estándar solo si se detectan edges con handles undefined
    if (problematicEdges.length > 0) {
      cleanUpInvalidHandleEdges();
    }

    // Configurar limpieza periódica
    const intervalId = setInterval(() => {
      const currentProblematicEdges = detectProblematicEdges();
      if (currentProblematicEdges.length > 0) {
        cleanUpInvalidHandleEdges();
      }
    }, cleanupInterval);

    return () => clearInterval(intervalId);
  }, [
    autoCleanup,
    cleanupInterval,
    detectProblematicEdges,
    cleanUpInvalidHandleEdges,
    edges.length,
  ]);

  // Efecto para monitorear cambios en edges
  useEffect(() => {
    const problematicCount = edges.filter(
      (edge) => edge.sourceHandle === undefined || edge.targetHandle === undefined,
    ).length;

    if (problematicCount > 0) {
      // Silent monitoring - no console output
    }
  }, [edges]);

  return {
    manualCleanup,
    fullCleanup,
    detectProblematicEdges,
    problematicEdgesCount: edges.filter(
      (edge) => edge.sourceHandle === undefined || edge.targetHandle === undefined,
    ).length,
  };
};

export default useEdgeCleanup;
