import React, { useEffect, useRef } from 'react';
import { fixAllEdgeHandles, processEdgesFromBackend, nodesExistInDOM } from '../utils/handleFixer';

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
  // Referencia para almacenar las aristas anteriores
  const prevEdgesRef = useRef([]);
  
  useEffect(() => {
    // Si no hay aristas o no hay función para establecerlas, no hacer nada
    if (!edges || !Array.isArray(edges) || !setEdges) return;
    
    // Guardar las aristas actuales para comparación futura
    prevEdgesRef.current = [...edges];
    
    // Función para verificar la consistencia de las aristas
    const checkEdgeConsistency = () => {
      // Recuperar aristas del localStorage como respaldo
      const localEdges = localStorage.getItem('plubot-flow-edges');
      if (!localEdges) return;
      
      try {
        const parsedLocalEdges = JSON.parse(localEdges);
        
        // Obtener los IDs de los nodos actuales para verificar aristas huérfanas
        const nodeIds = new Set();
        document.querySelectorAll('.react-flow__node').forEach(node => {
          const nodeId = node.getAttribute('data-id');
          if (nodeId) nodeIds.add(nodeId);
        });
        
        console.log('EdgeConsistencyMonitor: Nodos actuales en el DOM:', Array.from(nodeIds));
        
        // Filtrar aristas huérfanas (aquellas cuyos nodos de origen o destino no existen)
        const validLocalEdges = parsedLocalEdges.filter(edge => {
          // Verificar que los IDs de los nodos existan en el conjunto de nodos actuales
          const sourceExists = nodeIds.has(edge.source);
          const targetExists = nodeIds.has(edge.target);
          const basicValid = sourceExists && targetExists && edge.source && edge.target;
          
          if (!basicValid) {
            return false;
          }
          
          // Verificar que los nodos existan en el DOM
          const existsInDOM = nodesExistInDOM(edge);
          if (!existsInDOM) {
            console.warn(`EdgeConsistencyMonitor: Arista ${edge.id} ignorada porque sus nodos no existen en el DOM`);
          }
          
          return existsInDOM;
        });
        
        console.log(`EdgeConsistencyMonitor: Filtradas ${parsedLocalEdges.length - validLocalEdges.length} aristas huérfanas o inválidas`);
        
        // Corregir los handles de las aristas válidas
        const fixedEdges = fixAllEdgeHandles(validLocalEdges);
        
        // Guardar las aristas válidas y corregidas de nuevo en localStorage
        if (validLocalEdges.length !== parsedLocalEdges.length || JSON.stringify(fixedEdges) !== JSON.stringify(validLocalEdges)) {
          localStorage.setItem('plubot-flow-edges', JSON.stringify(fixedEdges));
          console.log('EdgeConsistencyMonitor: Aristas corregidas y guardadas en localStorage');
        }
        
        // Si no hay aristas en el estado actual pero sí en localStorage, restaurarlas
        if (edges.length === 0 && fixedEdges.length > 0) {
          console.log('EdgeConsistencyMonitor: Restaurando aristas válidas desde localStorage');
          setEdges(fixedEdges);
          return;
        }
        
        // Verificar si hay aristas válidas en localStorage que no estén en el estado actual
        if (fixedEdges.length > edges.length) {
          // Encontrar aristas que faltan en el estado actual
          const missingEdges = fixedEdges.filter(localEdge => {
            return !edges.some(edge => edge.id === localEdge.id);
          });
          
          if (missingEdges.length > 0) {
            console.log(`EdgeConsistencyMonitor: Encontradas ${missingEdges.length} aristas faltantes válidas`);
            // Añadir las aristas faltantes al estado actual
            setEdges(prevEdges => {
              // Corregir los handles de las aristas existentes
              const fixedPrevEdges = fixAllEdgeHandles(prevEdges);
              // Combinar con las aristas faltantes
              return [...fixedPrevEdges, ...missingEdges];
            });
          }
        } else {
          // Filtrar aristas actuales cuyos nodos no existen en el DOM
          const validCurrentEdges = edges.filter(edge => {
            const exists = nodesExistInDOM(edge);
            if (!exists) {
              console.warn(`EdgeConsistencyMonitor: Arista ${edge.id} actual ignorada porque sus nodos no existen en el DOM`);
            }
            return exists;
          });
          
          // Verificar si las aristas actuales válidas tienen handles correctos
          const fixedCurrentEdges = fixAllEdgeHandles(validCurrentEdges);
          
          // Si hay diferencias entre las aristas originales y las filtradas/corregidas
          if (JSON.stringify(fixedCurrentEdges) !== JSON.stringify(edges)) {
            console.log(`EdgeConsistencyMonitor: Corrigiendo handles de ${fixedCurrentEdges.length} aristas actuales válidas`);
            setEdges(fixedCurrentEdges);
          }
        }
      } catch (error) {
        console.error('EdgeConsistencyMonitor: Error al procesar aristas desde localStorage', error);
      }
    };
    
    // Verificar la consistencia después de un breve retraso
    const timer = setTimeout(checkEdgeConsistency, 1000);
    
    // Escuchar eventos de cambio en las aristas
    const handleEdgesChanged = () => {
      setTimeout(checkEdgeConsistency, 100);
    };
    
    document.addEventListener('edges-changed', handleEdgesChanged);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('edges-changed', handleEdgesChanged);
    };
  }, [edges, setEdges]);
  
  // Este componente no renderiza nada visible
  return null;
};

export default EdgeConsistencyMonitor;
