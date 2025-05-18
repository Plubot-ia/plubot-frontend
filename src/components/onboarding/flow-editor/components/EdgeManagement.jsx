import React, { useCallback } from 'react';
import { EDGE_COLORS } from '@/utils/nodeConfig';
import { DEFAULT_EDGE_STYLE } from '../utils/flowEditorConstants';

/**
 * Componente para la gestión de aristas en el editor de flujos
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.edgesState - Estado y funciones para gestionar aristas
 * @param {Function} props.setStatusMessage - Función para establecer mensajes de estado
 */
const EdgeManagement = ({
  edgesState,
  setStatusMessage,
}) => {
  const { edges, onConnect, removeConnectedEdges } = edgesState;

  /**
   * Maneja la conexión entre dos nodos
   */
  const handleConnect = useCallback((params) => {
    // Asegurarse de que los IDs originales se preserven
    const enhancedParams = {
      ...params,
      sourceOriginal: params.source,
      targetOriginal: params.target
    };
    
    onConnect(enhancedParams);
    // Solo mostrar mensajes críticos como confirmaciones de guardado
    // setStatusMessage('Conexión creada');
  }, [onConnect]);

  /**
   * Elimina todas las conexiones de un nodo
   */
  const handleRemoveConnections = useCallback((nodeId) => {
    if (!nodeId) return;
    
    removeConnectedEdges(nodeId);
    setStatusMessage('Conexiones eliminadas');
  }, [removeConnectedEdges, setStatusMessage]);

  return null; // Este componente no renderiza nada, solo proporciona funcionalidad
};

export default EdgeManagement;

// Exportar las funciones para usar directamente
export const useEdgeManagement = (props) => {
  const { edgesState, setStatusMessage } = props;
  const { edges, onConnect, removeConnectedEdges } = edgesState;

  /**
   * Maneja la conexión entre dos nodos
   */
  const handleConnect = useCallback((params) => {
    // Asegurarse de que los IDs originales se preserven
    const enhancedParams = {
      ...params,
      sourceOriginal: params.source,
      targetOriginal: params.target
    };
    
    onConnect(enhancedParams);
    // Solo mostrar mensajes críticos como confirmaciones de guardado
    // setStatusMessage('Conexión creada');
  }, [onConnect]);

  /**
   * Elimina todas las conexiones de un nodo
   */
  const handleRemoveConnections = useCallback((nodeId) => {
    if (!nodeId) return;
    
    removeConnectedEdges(nodeId);
    setStatusMessage('Conexiones eliminadas');
  }, [removeConnectedEdges, setStatusMessage]);

  /**
   * Obtiene el color de una arista según su tipo
   */
  const getEdgeColor = useCallback((type) => {
    return EDGE_COLORS[type] || EDGE_COLORS.default;
  }, []);

  /**
   * Obtiene el estilo para una arista según su tipo
   */
  const getEdgeStyle = useCallback((type) => {
    return {
      ...DEFAULT_EDGE_STYLE,
      stroke: getEdgeColor(type),
    };
  }, [getEdgeColor]);

  return {
    handleConnect,
    handleRemoveConnections,
    getEdgeColor,
    getEdgeStyle,
  };
};
