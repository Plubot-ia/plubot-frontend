import React, { useEffect, useCallback, useRef } from 'react';
import { useStore } from 'reactflow';
import { recoverEdgesFromLocalStorage } from '../utils/edgeRecoveryUtil';
import { fixAllEdgeHandles, nodesExistInDOM } from '../utils/handleFixer';
import useFlowStore from '@/stores/useFlowStore';
import useTrainingStore from '@/stores/useTrainingStore';

/**
 * Componente EdgeRecoveryMonitor - VERSIÓN MEJORADA
 * 
 * Monitorea y recupera aristas perdidas con manejo mejorado de IDs originales
 * y detección de nodos para evitar problemas de visibilidad
 */
const EdgeRecoveryMonitor = () => {
  // Obtener nodos y aristas del store de Flow
  const { nodes, edges, setEdges } = useFlowStore();
  
  // Obtener nodos del store de ReactFlow como respaldo
  const storeNodes = useStore(state => state.nodes || []);
  
  // Referencias para controlar la recuperación
  const lastRecoveryAttemptRef = useRef(0);
  const recoveryThrottleMs = 5000; // 5 segundos entre intentos
  const recoveryEnabledRef = useRef(false);
  const recoveryAttemptsRef = useRef(0);
  const maxRecoveryAttempts = 3; // Número máximo de intentos de recuperación

  // Mapa de nodos para búsqueda rápida
  const getNodeMap = useCallback(() => {
    const map = new Map();
    nodes.forEach(node => {
      if (node && node.id) {
        map.set(String(node.id), node);
        // Si hay un ID original, también lo mapeamos
        if (node.data?.originalId) {
          map.set(String(node.data.originalId), node);
        }
      }
    });
    return map;
  }, [nodes]);

  // Función mejorada para verificar si un nodo existe
  const nodeExists = useCallback((nodeId) => {
    if (!nodeId) return false;
    const nodeMap = getNodeMap();
    return nodeMap.has(String(nodeId));
  }, [getNodeMap]);

  // Función para encontrar un nodo por ID o ID original
  const findNode = useCallback((nodeId) => {
    if (!nodeId) return null;
    const nodeMap = getNodeMap();
    return nodeMap.get(String(nodeId)) || null;
  }, [getNodeMap]);

  // Función para recuperar aristas con manejo mejorado de IDs
  const recoverEdges = useCallback(async (force = false) => {
    // Verificar si la recuperación está habilitada o si es forzada
    if (!recoveryEnabledRef.current && !force) return;
    
    // Verificar límite de intentos
    if (recoveryAttemptsRef.current >= maxRecoveryAttempts && !force) {
      console.log('EdgeRecoveryMonitor: Límite de intentos de recuperación alcanzado');
      return;
    }
    
    const now = Date.now();
    if (now - lastRecoveryAttemptRef.current < recoveryThrottleMs && !force) {
      return; // Evitar intentos demasiado frecuentes
    }
    
    // Actualizar contadores
    lastRecoveryAttemptRef.current = now;
    recoveryAttemptsRef.current++;
    
    console.log(`EdgeRecoveryMonitor: Iniciando recuperación (intento ${recoveryAttemptsRef.current}/${maxRecoveryAttempts})`);
    
    // Obtener el ID del plubot de la URL
    const plubotId = window.location.search.match(/plubotId=([^&]*)/)?.[1];
    if (!plubotId) {
      console.warn('EdgeRecoveryMonitor: No se encontró plubotId en la URL');
      return;
    }
    
    // Obtener aristas recuperadas
    const recoveredEdges = recoverEdgesFromLocalStorage(plubotId) || [];
    console.log(`EdgeRecoveryMonitor: Recuperadas ${recoveredEdges.length} aristas desde localStorage`);
    
    // Si no hay aristas recuperadas, no hay nada que hacer
    if (recoveredEdges.length === 0) {
      console.log('EdgeRecoveryMonitor: No se encontraron aristas para recuperar');
      return;
    }
    
    // Procesar aristas recuperadas
    const processedEdges = [];
    const nodeMap = getNodeMap();
    
    recoveredEdges.forEach(edge => {
      try {
        if (!edge || !edge.id) {
          console.warn('EdgeRecoveryMonitor: Arista sin ID, ignorando');
          return;
        }
        
        // Obtener IDs de origen y destino, con manejo de IDs originales
        let sourceId = edge.source || edge.data?.sourceOriginal || '';
        let targetId = edge.target || edge.data?.targetOriginal || '';
        
        // Verificar si los nodos existen
        const sourceExists = nodeExists(sourceId);
        const targetExists = nodeExists(targetId);
        
        // Si ambos nodos existen, usar la arista tal cual
        if (sourceExists && targetExists) {
          processedEdges.push({
            ...edge,
            source: String(sourceId),
            target: String(targetId),
            sourceHandle: edge.sourceHandle || 'default',
            targetHandle: edge.targetHandle || 'default',
            data: {
              ...(edge.data || {}),
              sourceId: String(sourceId),
              targetId: String(targetId),
              sourceOriginal: edge.data?.sourceOriginal || sourceId,
              targetOriginal: edge.data?.targetOriginal || targetId,
              isRecovered: true,
              recoveryTimestamp: Date.now()
            }
          });
          return;
        }
        
        // Intentar encontrar nodos por ID original si están disponibles
        const sourceNode = findNode(edge.data?.sourceOriginal || sourceId);
        const targetNode = findNode(edge.data?.targetOriginal || targetId);
        
        if (sourceNode && targetNode) {
          // Si encontramos ambos nodos usando IDs originales, actualizar los IDs
          processedEdges.push({
            ...edge,
            source: String(sourceNode.id),
            target: String(targetNode.id),
            sourceHandle: edge.sourceHandle || 'default',
            targetHandle: edge.targetHandle || 'default',
            data: {
              ...(edge.data || {}),
              sourceId: String(sourceNode.id),
              targetId: String(targetNode.id),
              sourceOriginal: edge.data?.sourceOriginal || sourceId,
              targetOriginal: edge.data?.targetOriginal || targetId,
              isRecovered: true,
              recoveryTimestamp: Date.now(),
              recoveryNote: 'Recuperada usando IDs originales'
            }
          });
          console.log(`EdgeRecoveryMonitor: Arista ${edge.id} recuperada usando IDs originales`);
        } else {
          console.warn(`EdgeRecoveryMonitor: No se pudo recuperar la arista ${edge.id} - nodos no encontrados`);
        }
      } catch (error) {
        console.error(`EdgeRecoveryMonitor: Error al procesar arista ${edge?.id}:`, error);
      }
    });
    
    // Si hay aristas procesadas, aplicarlas al estado
    if (processedEdges.length > 0) {
      console.log(`EdgeRecoveryMonitor: Aplicando ${processedEdges.length} aristas recuperadas`);
      
      try {
        // Esperar un breve momento para asegurar que los nodos estén en el DOM
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Corregir los handles de las aristas
        const fixedEdges = fixAllEdgeHandles(processedEdges);
        
        if (fixedEdges.length === 0) {
          console.warn('EdgeRecoveryMonitor: No se pudieron corregir las aristas recuperadas');
          return;
        }
        
        // Actualizar el estado con las aristas recuperadas
        setEdges(prevEdges => {
          // Filtrar aristas duplicadas y mantener solo las válidas
          const existingIds = new Set(prevEdges.map(e => e.id));
          const newEdges = fixedEdges.filter(e => e && e.id && !existingIds.has(e.id));
          
          if (newEdges.length === 0) {
            console.log('EdgeRecoveryMonitor: No hay aristas nuevas para agregar');
            return prevEdges;
          }
          
          console.log(`EdgeRecoveryMonitor: Agregando ${newEdges.length} aristas nuevas`);
          
          // Combinar las aristas existentes con las nuevas
          const updatedEdges = [...prevEdges];
          
          // Actualizar o agregar cada arista nueva
          newEdges.forEach(newEdge => {
            const existingIndex = updatedEdges.findIndex(e => e.id === newEdge.id);
            if (existingIndex >= 0) {
              // Actualizar arista existente
              updatedEdges[existingIndex] = { ...updatedEdges[existingIndex], ...newEdge };
            } else {
              // Agregar nueva arista
              updatedEdges.push(newEdge);
            }
          });
          
          return updatedEdges;
        });
        
        // Notificar que se recuperaron aristas
        const recoveryEvent = new CustomEvent('edges-recovered', {
          detail: {
            count: fixedEdges.length,
            timestamp: Date.now(),
            recoveredEdges: fixedEdges,
            forceRecovery: force,
            success: true
          }
        });
        
        document.dispatchEvent(recoveryEvent);
        
        // Forzar actualización visual
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          
          // Verificar que las aristas se hayan aplicado correctamente
          const edgeElements = document.querySelectorAll('.react-flow__edge');
          console.log(`EdgeRecoveryMonitor: Se renderizaron ${edgeElements.length} aristas en el DOM`);
          
          // Si no se renderizaron las aristas, forzar una nueva recuperación
          if (edgeElements.length === 0 && recoveryAttemptsRef.current < maxRecoveryAttempts) {
            console.log('EdgeRecoveryMonitor: No se renderizaron aristas, reintentando...');
            recoveryAttemptsRef.current++;
            recoverEdges(true);
          }
        }, 500);
        
        // Si se recuperaron aristas, reiniciar el contador de intentos
        recoveryAttemptsRef.current = 0;
        return true;
      } catch (error) {
        console.error('Error al aplicar aristas recuperadas:', error);
        return false;
      }
    } else {
      console.log('EdgeRecoveryMonitor: No se pudieron recuperar aristas válidas');
      
      // Si no se encontraron aristas y no es un intento forzado, incrementar el contador
      if (!force) {
        recoveryAttemptsRef.current++;
      }
      
      return false;
    }
  }, [getNodeMap, nodeExists, findNode, setEdges]);
  
  // Efecto para habilitar la recuperación después de un retraso inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      recoveryEnabledRef.current = true;
      console.log('EdgeRecoveryMonitor: Recuperación de aristas habilitada');
      recoverEdges(); // Intentar recuperación inicial
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [recoverEdges]);
  
  // Efecto para manejar la recuperación forzada
  useEffect(() => {
    const handleForceRecovery = (event) => {
      console.log('EdgeRecoveryMonitor: Evento de recuperación forzada recibido', event?.detail);
      recoverEdges(true); // Forzar recuperación
    };
    
    // Registrar listeners para eventos de recuperación
    document.addEventListener('force-edge-recovery', handleForceRecovery);
    
    // Verificar aristas periódicamente
    const intervalId = setInterval(() => {
      recoverEdges();
    }, 10000); // Verificar cada 10 segundos
    
    // Limpieza
    return () => {
      document.removeEventListener('force-edge-recovery', handleForceRecovery);
      clearInterval(intervalId);
    };
  }, [recoverEdges]);
  
  // Este componente no renderiza nada visible
  return null;
};

export default EdgeRecoveryMonitor;
