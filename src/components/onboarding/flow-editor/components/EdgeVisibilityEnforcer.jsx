import React, { useEffect, useCallback } from 'react';
import { fixAllEdgeHandles, nodesExistInDOM } from '../utils/handleFixer';
import { useReactFlow } from 'reactflow';
import useFlowStore from '@/stores/useFlowStore';

/**
 * Componente EdgeVisibilityEnforcer - Versión mejorada
 * 
 * Este componente se encarga de asegurar que todas las aristas sean visibles
 * en el canvas de ReactFlow, forzando su actualización visual cuando sea necesario.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.edges - Aristas actuales
 * @param {Function} props.setEdges - Función para establecer las aristas
 */
const EdgeVisibilityEnforcer = () => {
  // Obtener la instancia de ReactFlow
  const reactFlowInstance = useReactFlow();
  
  // Obtener aristas y setEdges del store de Zustand
  const edges = useFlowStore(state => state.edges);
  const setEdges = useFlowStore(state => state.setEdges);
  
  // Función para forzar la actualización visual de las aristas
  const forceEdgeVisualUpdate = useCallback(() => {
    if (!edges || !Array.isArray(edges)) return;
    
    // Verificar si hay aristas válidas antes de forzar la actualización
    const currentEdges = [...edges];
    const validEdges = currentEdges.filter(edge => nodesExistInDOM(edge));
    
    if (validEdges.length !== currentEdges.length) {
      console.log(`EdgeVisibilityEnforcer: ${currentEdges.length - validEdges.length} aristas ignoradas por nodos inexistentes`);
    }
    
    // Corregir los handles de las aristas válidas, forzando el uso de 'default'
    const fixedEdges = validEdges.map(edge => ({
      ...edge,
      sourceHandle: 'default',
      targetHandle: 'default'
    }));
    
    // Si hay diferencias entre las aristas originales y las corregidas, actualizar el estado
    if (JSON.stringify(edges) !== JSON.stringify(fixedEdges)) {
      console.log(`EdgeVisibilityEnforcer: Corrigiendo handles de ${fixedEdges.length} aristas válidas`);
      setEdges(fixedEdges);
    }
    
    // Emitir un evento personalizado para forzar la actualización visual
    document.dispatchEvent(new CustomEvent('elite-edge-update-required', { 
      detail: { 
        allEdges: true,
        timestamp: Date.now(),
        forced: true,
        fixedHandles: true,
        validEdgesOnly: true
      } 
    }));
    
    // Forzar un pequeño cambio en el viewport para refrescar la vista
    const reactFlowViewport = document.querySelector('.react-flow__viewport');
    if (reactFlowViewport) {
      const transform = reactFlowViewport.style.transform;
      if (transform) {
        reactFlowViewport.style.transform = `${transform} scale(0.9999)`;
        setTimeout(() => {
          reactFlowViewport.style.transform = transform;
        }, 50);
      }
    }
  }, [edges, setEdges]);
  
  // Efecto principal para corregir aristas
  useEffect(() => {
    if (!edges || !Array.isArray(edges) || edges.length === 0) return;
    
    // Ejecutar la corrección inmediatamente
    forceEdgeVisualUpdate();
    
    // Forzar la actualización visual después de un breve retraso
    // para asegurar que todos los componentes estén montados
    const timer = setTimeout(() => {
      forceEdgeVisualUpdate();
    }, 500);
    
    // Configurar un intervalo para verificar periódicamente la visibilidad
    // de las aristas (cada 5 segundos)
    const interval = setInterval(() => {
      forceEdgeVisualUpdate();
    }, 5000);
    
    // Escuchar eventos de cambio en el viewport que podrían afectar la visibilidad
    const handleViewportChange = () => {
      setTimeout(forceEdgeVisualUpdate, 100);
    };
    
    document.addEventListener('reactflow-viewport-change', handleViewportChange);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener('reactflow-viewport-change', handleViewportChange);
    };
  }, [edges, forceEdgeVisualUpdate]);
  
  // Este componente no renderiza nada visible
  return null;
};

export default EdgeVisibilityEnforcer;
