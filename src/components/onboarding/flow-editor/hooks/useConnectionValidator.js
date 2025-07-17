import { useMemo, useCallback } from 'react';

/**
 * Hook personalizado para validar conexiones entre nodos.
 * Define reglas para determinar qué tipos de nodos pueden conectarse entre sí.
 * @param {Array} nodes - Lista de nodos en el flujo.
 * @param {Array} edges - Lista de aristas en el flujo.
 * @returns {Object} - Función `isValidConnection` para validar conexiones.
 */
export default function useConnectionValidator(nodes, edges) {
  // Mapa de conexiones válidas por tipo de nodo
  const validConnections = useMemo(
    () => ({
      start: [
        'message',
        'decision',
        'action',
        'httpRequest',
        'power',
        'discord',
        'ai',
        'aiNodePro',
        'emotionDetection',
      ],
      message: [
        'message',
        'end',
        'decision',
        'action',
        'option',
        'httpRequest',
        'power',
        'discord',
        'ai',
        'aiNodePro',
        'emotionDetection',
      ],
      decision: [
        'message',
        'end',
        'action',
        'option',
        'httpRequest',
        'power',
        'discord',
        'ai',
        'aiNodePro',
      ],
      action: [
        'message',
        'end',
        'decision',
        'option',
        'httpRequest',
        'power',
        'discord',
        'ai',
        'aiNodePro',
      ],
      option: [
        'message',
        'decision',
        'action',
        'httpRequest',
        'end',
        'ai',
        'aiNodePro',
      ],
      httpRequest: [
        'message',
        'decision',
        'action',
        'end',
        'option',
        'power',
        'discord',
        'ai',
        'aiNodePro',
      ],
      power: [
        'message',
        'end',
        'decision',
        'action',
        'option',
        'httpRequest',
        'discord',
        'ai',
        'aiNodePro',
      ],
      discord: [
        'message',
        'end',
        'decision',
        'action',
        'option',
        'httpRequest',
        'power',
        'discord',
        'ai',
        'aiNodePro',
      ],
      ai: [
        'message',
        'decision',
        'action',
        'end',
        'httpRequest',
        'power',
        'discord',
        'ai',
        'aiNodePro',
        'emotionDetection',
      ],
      aiNodePro: [
        'message',
        'decision',
        'action',
        'end',
        'httpRequest',
        'power',
        'discord',
        'ai',
        'aiNodePro',
        'emotionDetection',
      ],
      emotionDetection: [
        'message',
        'end',
        'decision',
        'action',
        'option',
        'httpRequest',
        'power',
        'discord',
        'ai',
        'aiNodePro',
      ],
      end: [],
    }),
    [],
  );

  // Función para validar si una conexión entre handles es válida
  const isValidConnection = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) {
        return false;
      }

      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      if (!sourceNode || !targetNode) {
        return false;
      }

      const targetAllowedTypes = validConnections[sourceNode.type];
      if (!targetAllowedTypes) {
        return false;
      }

      if (targetNode.type === 'start') {
        return false;
      }

      if (sourceNode.type === 'end') {
        return false;
      }

      const normalizedSourceHandle = connection.sourceHandle || 'default';
      const normalizedTargetHandle = connection.targetHandle || 'default';
      const existingEdge = edges.find(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target &&
          (edge.sourceHandle || 'default') === normalizedSourceHandle &&
          (edge.targetHandle || 'default') === normalizedTargetHandle,
      );

      if (existingEdge) {
        return false;
      }

      return targetAllowedTypes.includes(targetNode.type);
    },
    [nodes, edges, validConnections],
  );

  return { isValidConnection };
}
