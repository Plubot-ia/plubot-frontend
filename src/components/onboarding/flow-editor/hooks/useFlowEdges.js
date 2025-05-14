import { useState, useCallback, useEffect, useRef } from 'react';
import { applyEdgeChanges, addEdge } from 'reactflow';
import { EDGE_COLORS } from '@/utils/nodeConfig';
import { connectionExists } from '../utils/flowEditorUtils';
import { DEFAULT_EDGE_STYLE } from '../utils/flowEditorConstants';

/**
 * Hook personalizado para la gestión de aristas en el editor de flujos
 * @param {Array} initialEdges - Aristas iniciales
 * @param {Function} setEdges - Función para actualizar aristas en el componente padre
 * @param {Function} addToHistory - Función para añadir cambios al historial
 * @returns {Object} - Métodos y estado para gestionar aristas
 */
const useFlowEdges = (initialEdges, setEdges, addToHistory) => {
  // Estado interno para aristas
  const [internalEdges, setInternalEdges] = useState(initialEdges || []);
  
  // Map para acceso rápido a aristas por ID
  const edgesMapRef = useRef(new Map());
  
  // Inicializar el mapa de aristas
  useEffect(() => {
    const edgesMap = new Map();
    initialEdges.forEach(edge => {
      edgesMap.set(edge.id, edge);
    });
    edgesMapRef.current = edgesMap;
    setInternalEdges(initialEdges);
  }, [initialEdges]);

  /**
   * Maneja cambios en las aristas (eliminar, seleccionar)
   */
  const onEdgesChange = useCallback((changes) => {
    setInternalEdges(edges => {
      const newEdges = applyEdgeChanges(changes, edges);
      
      // Actualizar el mapa de aristas
      const edgesMap = edgesMapRef.current;
      changes.forEach(change => {
        if (change.type === 'remove') {
          const removedEdge = edgesMap.get(change.id);
          edgesMap.delete(change.id);
          
          // Registrar eliminación en el historial
          if (removedEdge) {
            addToHistory({
              type: 'removeEdge',
              edges: [removedEdge],
            });
          }
        } else {
          const updatedEdge = newEdges.find(e => e.id === change.id);
          if (updatedEdge) {
            edgesMap.set(change.id, updatedEdge);
          }
        }
      });
      
      // Propagar cambios al componente padre
      setTimeout(() => setEdges(newEdges), 0);
      return newEdges;
    });
  }, [setEdges, addToHistory]);

  /**
   * Maneja la conexión de dos nodos
   */
  const onConnect = useCallback((params) => {
    // Verificar si la conexión ya existe
    if (connectionExists(internalEdges, params)) {
      return;
    }
    
    // Crear nueva arista con estilo por defecto
    // Importante: Preservar los IDs completos de los nodos source y target
    const newEdge = {
      ...params,
      id: `edge-${params.source}-${params.target}-${Date.now()}`,
      style: {
        ...DEFAULT_EDGE_STYLE,
        stroke: EDGE_COLORS[params.sourceHandle] || EDGE_COLORS.default,
      },
      animated: true,
      type: 'smoothstep',
      // Guardar los IDs originales para evitar problemas al guardar/cargar
      sourceOriginal: params.source,
      targetOriginal: params.target
    };
    
    setInternalEdges(edges => {
      const newEdges = addEdge(newEdge, edges);
      edgesMapRef.current.set(newEdge.id, newEdge);
      setTimeout(() => setEdges(newEdges), 0);
      
      // Registrar adición en el historial
      addToHistory({
        type: 'addEdge',
        edges: [newEdge],
      });
      
      return newEdges;
    });
  }, [internalEdges, setEdges, addToHistory]);

  /**
   * Elimina todas las aristas conectadas a un nodo
   */
  const removeConnectedEdges = useCallback((nodeId) => {
    setInternalEdges(edges => {
      const edgesToRemove = edges.filter(
        edge => edge.source === nodeId || edge.target === nodeId
      );
      
      if (edgesToRemove.length === 0) return edges;
      
      const newEdges = edges.filter(
        edge => edge.source !== nodeId && edge.target !== nodeId
      );
      
      // Actualizar el mapa de aristas
      edgesToRemove.forEach(edge => {
        edgesMapRef.current.delete(edge.id);
      });
      
      setTimeout(() => setEdges(newEdges), 0);
      
      // Registrar eliminación en el historial
      addToHistory({
        type: 'removeEdge',
        edges: edgesToRemove,
      });
      
      return newEdges;
    });
  }, [setEdges, addToHistory]);

  return {
    edges: internalEdges,
    edgesMap: edgesMapRef.current,
    onEdgesChange,
    onConnect,
    removeConnectedEdges,
  };
};

export default useFlowEdges;
