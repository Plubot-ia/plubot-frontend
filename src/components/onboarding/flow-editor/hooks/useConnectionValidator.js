import { useMemo, useCallback } from 'react';

import { normalizeSourceHandle, areHandlesEquivalent } from '../../../../config/handleConfig';
import { NODE_CONNECTION_RULES } from '../config/node-connection-rules.js';

/**
 * Hook personalizado para validar conexiones entre nodos.
 * Define reglas para determinar qué tipos de nodos pueden conectarse entre sí.
 * @param {Array} nodes - Lista de nodos en el flujo.
 * @param {Array} edges - Lista de aristas en el flujo.
 * @returns {Object} - Función `isValidConnection` para validar conexiones.
 */
export default function useConnectionValidator(nodes, edges) {
  // Mapa de conexiones válidas por tipo de nodo (extraído a archivo de configuración)
  const validConnections = useMemo(() => NODE_CONNECTION_RULES, []);

  // Helpers para reducir complejidad de isValidConnection
  const _validateConnectionBasics = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) {
        return { isValid: false };
      }

      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      if (!sourceNode || !targetNode) {
        return { isValid: false };
      }

      return { isValid: true, sourceNode, targetNode };
    },
    [nodes],
  );

  const _validateNodeTypes = useCallback(
    (sourceNode, targetNode) => {
      const targetAllowedTypes = validConnections[sourceNode.type];
      if (!targetAllowedTypes) {
        return false;
      }

      if (targetNode.type === 'start' || sourceNode.type === 'end') {
        return false;
      }

      return targetAllowedTypes.includes(targetNode.type);
    },
    [validConnections],
  );

  const _checkDuplicateConnection = useCallback(
    (connection) => {
      const normalizedSourceHandle = normalizeSourceHandle(connection.sourceHandle);
      const normalizedTargetHandle = connection.targetHandle || 'input';

      const existingEdge = edges.find(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target &&
          areHandlesEquivalent(edge.sourceHandle, normalizedSourceHandle) &&
          areHandlesEquivalent(edge.targetHandle, normalizedTargetHandle),
      );

      return !existingEdge;
    },
    [edges],
  );

  // Función para validar si una conexión entre handles es válida
  const isValidConnection = useCallback(
    (connection) => {
      // Validar aspectos básicos de la conexión
      const basicValidation = _validateConnectionBasics(connection);
      if (!basicValidation.isValid) {
        return false;
      }

      const { sourceNode, targetNode } = basicValidation;

      // Verificar que no sea una conexión duplicada
      if (!_checkDuplicateConnection(connection)) {
        return false;
      }

      // Validar tipos de nodos y conexiones permitidas
      return _validateNodeTypes(sourceNode, targetNode);
    },
    [_validateConnectionBasics, _checkDuplicateConnection, _validateNodeTypes],
  );

  return { isValidConnection };
}
