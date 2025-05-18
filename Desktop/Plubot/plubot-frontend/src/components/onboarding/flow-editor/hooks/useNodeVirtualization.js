import { useState, useEffect, useCallback, useRef } from 'react';
import { useReactFlow } from 'reactflow';

/**
 * Hook para virtualización de nodos - solo renderiza los nodos visibles en el viewport
 * @param {Array} nodes - Lista de nodos del flujo
 * @param {Object} viewport - Información del viewport (x, y, zoom)
 * @returns {Object} - Nodos visibles filtrados y funciones para manejar interacciones
 */
const useNodeVirtualization = (nodes, viewport) => {
  // Estado para almacenar los nodos visibles
  const [visibleNodes, setVisibleNodes] = useState(nodes);
  // Estado para almacenar nodos con los que se está interactuando
  const [interactingNodeIds, setInteractingNodeIds] = useState({});
  // Referencia al viewport actual
  const { getViewport } = useReactFlow();
  // Margen adicional alrededor del viewport para pre-cargar nodos
  const VIEWPORT_MARGIN = 300;
  // Tiempo en ms que un nodo permanece visible después de interactuar con él
  const INTERACTION_TIMEOUT = 1500;
  
  // Función para determinar si un nodo está dentro del viewport
  const isNodeInViewport = useCallback((node, vp) => {
    if (!node || !node.position || !vp) return false;
    
    // Verificar que las posiciones son números válidos
    if (typeof node.position.x !== 'number' || 
        typeof node.position.y !== 'number' || 
        isNaN(node.position.x) || 
        isNaN(node.position.y)) {
      return false;
    }
    
    // Calcular los límites del viewport con margen
    const vpLeft = -vp.x / vp.zoom - VIEWPORT_MARGIN;
    const vpTop = -vp.y / vp.zoom - VIEWPORT_MARGIN;
    const vpRight = vpLeft + window.innerWidth / vp.zoom + VIEWPORT_MARGIN * 2;
    const vpBottom = vpTop + window.innerHeight / vp.zoom + VIEWPORT_MARGIN * 2;
    
    // Obtener las dimensiones del nodo (valores por defecto si no están definidos)
    const nodeWidth = node.width || 150;
    const nodeHeight = node.height || 100;
    
    // Comprobar si el nodo está dentro del viewport
    return (
      node.position.x < vpRight &&
      node.position.x + nodeWidth > vpLeft &&
      node.position.y < vpBottom &&
      node.position.y + nodeHeight > vpTop
    );
  }, [VIEWPORT_MARGIN]);
  
  // Función para registrar interacción con un nodo
  const registerNodeInteraction = useCallback((nodeId) => {
    if (!nodeId) return;
    
    // Actualizar el tiempo de la última interacción con este nodo
    // Usar una función de actualización para evitar cierres sobre estados antiguos
    setInteractingNodeIds(prev => {
      const now = Date.now();
      // Solo actualizar si ha pasado al menos 100ms desde la última actualización
      // para evitar actualizaciones excesivas
      if (!prev[nodeId] || now - prev[nodeId] > 100) {
        return {
          ...prev,
          [nodeId]: now
        };
      }
      return prev;
    });
  }, []);
  
  // Función para registrar interacciones con múltiples nodos
  const registerNodesInteraction = useCallback((nodeIds) => {
    if (!nodeIds || !nodeIds.length) return;
    
    const now = Date.now();
    
    // Usar una función de actualización para evitar cierres sobre estados antiguos
    setInteractingNodeIds(prev => {
      // Verificar si realmente hay cambios para evitar actualizaciones innecesarias
      let hasChanges = false;
      const updates = {};
      
      nodeIds.forEach(nodeId => {
        // Solo actualizar si ha pasado al menos 100ms desde la última actualización
        if (!prev[nodeId] || now - prev[nodeId] > 100) {
          updates[nodeId] = now;
          hasChanges = true;
        }
      });
      
      // Solo actualizar el estado si hay cambios reales
      return hasChanges ? { ...prev, ...updates } : prev;
    });
  }, []);
  
  // Referencia para almacenar el estado previo y evitar actualizaciones innecesarias
  const prevNodesRef = useRef([]);
  const prevViewportRef = useRef(null);
  
  // Efecto para actualizar los nodos visibles cuando cambia el viewport o los nodos
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    
    // Verificar si realmente necesitamos actualizar
    const currentViewport = viewport || getViewport();
    if (!currentViewport) return;
    
    // Comprobar si los nodos o el viewport han cambiado significativamente
    const nodesChanged = nodes.length !== prevNodesRef.current.length;
    const viewportChanged = !prevViewportRef.current || 
                           Math.abs(currentViewport.x - prevViewportRef.current.x) > 5 ||
                           Math.abs(currentViewport.y - prevViewportRef.current.y) > 5 ||
                           Math.abs(currentViewport.zoom - prevViewportRef.current.zoom) > 0.1;
    
    // Solo actualizar si hay cambios significativos
    if (!nodesChanged && !viewportChanged && Object.keys(interactingNodeIds).length === 0) {
      return;
    }
    
    // Actualizar referencias
    prevNodesRef.current = [...nodes];
    prevViewportRef.current = {...currentViewport};
    
    // Filtrar los nodos que están en el viewport o con los que se está interactuando
    const currentTime = Date.now();
    
    // Filtrar nodos visibles o con interacción reciente
    const visibleNodesList = nodes.filter(node => {
      if (!node || !node.id) return false;
      
      // Incluir nodos seleccionados siempre
      if (node.selected) return true;
      
      // Incluir nodos con hover
      if (node.__rf?.hovered) {
        // No registramos interacción aquí para evitar bucles infinitos
        return true;
      }
      
      // Incluir el nodo si está en el viewport
      const inViewport = isNodeInViewport(node, currentViewport);
      
      // Incluir el nodo si se está interactuando con él
      const isInteracting = interactingNodeIds[node.id] && 
                          (currentTime - interactingNodeIds[node.id]) < INTERACTION_TIMEOUT;
      
      // Incluir nodos de tipos especiales siempre
      const isSpecialType = node.type === 'start' || node.type === 'end';
      
      return inViewport || isInteracting || isSpecialType;
    });
    
    // Asegurarse de que los nodos mantienen sus posiciones originales
    const preservedNodes = visibleNodesList.map(node => ({
      ...node,
      // Asegurarse de que position es un objeto válido y se copia para evitar referencias
      position: node.position ? { ...node.position } : { x: 0, y: 0 },
      // Preservar propiedades internas de ReactFlow
      __rf: node.__rf ? { ...node.__rf } : undefined
    }));
    
    // Actualizar el estado con los nodos visibles
    setVisibleNodes(preservedNodes);
    
    // Limpiar los nodos con interacción expirada (solo si hay interacciones registradas)
    if (Object.keys(interactingNodeIds).length > 0) {
      const updatedInteractingNodes = {};
      Object.entries(interactingNodeIds).forEach(([id, timestamp]) => {
        if (currentTime - timestamp < INTERACTION_TIMEOUT) {
          updatedInteractingNodes[id] = timestamp;
        }
      });
      setInteractingNodeIds(updatedInteractingNodes);
    }
  }, [nodes, viewport, getViewport, isNodeInViewport, interactingNodeIds, INTERACTION_TIMEOUT]);
  
  // Devolver los nodos visibles y funciones para registrar interacciones
  return {
    visibleNodes,
    registerNodeInteraction,
    registerNodesInteraction
  };
};

export default useNodeVirtualization;
