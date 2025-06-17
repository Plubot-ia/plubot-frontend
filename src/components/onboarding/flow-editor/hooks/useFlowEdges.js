import { useState, useCallback, useEffect, useRef } from 'react';
import { applyEdgeChanges, addEdge } from 'reactflow';
import { EDGE_COLORS } from '@/utils/nodeConfig';
import { connectionExists } from '../utils/flowEditorUtils';
import { DEFAULT_EDGE_STYLE } from '../utils/flowEditorConstants';
import useFlowStore from '@/stores/useFlowStore';
import { processEdgesFromBackend } from '../utils/handleFixer';

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
  
  // Proceso seguro para inicializar las aristas
  const initEdges = useCallback((initialEdges) => {
    if (!initialEdges || !Array.isArray(initialEdges)) {
      console.log('[useFlowEdges] Inicializando con aristas vacías');
      setInternalEdges([]);
      return;
    }
    
    // Procesar aristas para asegurar handles válidos (pero solo una vez)
    const processedEdges = processEdgesFromBackend(initialEdges);
    
    console.log(`[useFlowEdges] Inicializando ${processedEdges.length} aristas`);
    setInternalEdges(processedEdges);
  }, []);

  // Inicializar el mapa de aristas
  useEffect(() => {
    initEdges(initialEdges);
  }, [initialEdges, initEdges]);

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
      console.log('Conexión ya existe, ignorando:', params);
      return;
    }
    
    // Validar que los parámetros de conexión sean válidos
    if (!params.source || !params.target) {
      console.error('Intento de conexión con source o target inválidos:', params);
      return;
    }
    
    // Asegurar que los handles siempre estén definidos
    // Estos nombres son importantes para prevenir errores con ReactFlow
    const sourceHandle = params.sourceHandle || 'output';
    const targetHandle = params.targetHandle || 'input';
    
    console.log(`Creando nueva arista: ${params.source} -> ${params.target}, sourceHandle: ${sourceHandle}, targetHandle: ${targetHandle}`);
    
    // Crear nueva arista con estilo por defecto y handles validados
    const newEdge = {
      ...params,
      id: `edge-${params.source}-${params.target}-${Date.now()}`,
      sourceHandle,
      targetHandle,
      type: 'default', // Usar siempre 'default' para compatibilidad con EliteEdge
      animated: false,
      style: { stroke: '#00e0ff', strokeWidth: 2 },
      // Agregar datos adicionales para asegurar que la arista se muestre correctamente
      data: {
        ...params.data,
        isEnergyHose: true, // Marcar como manguera energética
        flowSpeed: 0.5, // Velocidad del flujo
        flowColor: '#00e0ff', // Color del flujo
      },
      // Guardar los IDs originales para evitar problemas al guardar/cargar
      sourceOriginal: params.source,
      targetOriginal: params.target
    };
    
    setInternalEdges(edges => {
      const newEdges = addEdge(newEdge, edges);
      edgesMapRef.current.set(newEdge.id, newEdge);
      addToHistory({ edges: newEdges });
      
      // Actualizar el estado de forma asíncrona para evitar problemas de renderizado
      setTimeout(() => {
        setEdges(newEdges);
        
        // Forzar que se use EliteEdge para renderizar esta arista
        // Esto garantiza que se vea como una manguera energética desde el principio
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('elite-edge-update-required', { 
            detail: { id: newEdge.id } 
          }));
        }, 50);
      }, 0);
      
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
