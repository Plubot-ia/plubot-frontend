import React, { useEffect, useRef } from 'react';
import { recoverEdgesFromLocalStorage, forceEdgeVisualUpdate, saveEdgesToLocalStorage } from '../utils/edgeRecoveryUtil';
import useFlowStore from '@/stores/useFlowStore';
import useTrainingStore from '@/stores/useTrainingStore';

// Variables globales para controlar la frecuencia de operaciones
// Estas variables se mantienen entre renderizados
let lastSaveTime = 0;
let lastCheckTime = 0;
let lastEventResponseTime = 0;

// Tiempos de throttling
const SAVE_THROTTLE_MS = 15000; // 15 segundos
const CHECK_THROTTLE_MS = 30000; // 30 segundos
const EVENT_THROTTLE_MS = 10000; // 10 segundos

/**
 * Componente EdgeSyncManager - VERSIÓN SIMPLIFICADA
 * 
 * Este componente se encarga de sincronizar las aristas entre el estado de la aplicación
 * y localStorage, con limitaciones de frecuencia para evitar operaciones excesivas.
 */
const EdgeSyncManager = () => {
  // Obtener nodos y aristas del store de Flow
  const { edges, setEdges } = useFlowStore();
  // Obtener el ID del plubot de la URL
  const getPlubotId = () => {
    return window.location.search.match(/plubotId=([^&]*)/)?.[1];
  };
  
  // Efecto para sincronizar aristas cuando cambian
  useEffect(() => {
    const plubotId = getPlubotId();
    if (!plubotId || !edges || edges.length === 0) return;
    
    // Guardar aristas con un pequeño retraso y limitación de frecuencia
    const timeoutId = setTimeout(() => {
      const now = Date.now();
      if (now - lastSaveTime < SAVE_THROTTLE_MS) {
        return; // Evitar guardados demasiado frecuentes
      }
      
      lastSaveTime = now;
      saveEdgesToLocalStorage(plubotId, edges);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [edges]);
  
  // Efecto para recuperar aristas al cargar el componente
  useEffect(() => {
    const plubotId = getPlubotId();
    if (!plubotId) return;
    
    // Función para verificar y recuperar aristas si es necesario
    const checkAndRecoverEdges = () => {
      // Si no hay aristas en el estado, intentar recuperarlas de localStorage
      if (!edges || edges.length === 0) {
        const recoveredEdges = recoverEdgesFromLocalStorage(plubotId);
        
        if (recoveredEdges && Array.isArray(recoveredEdges) && recoveredEdges.length > 0) {
          // Verificar que las aristas tengan los campos necesarios
          const validEdges = recoveredEdges.filter(edge => 
            edge && edge.id && edge.source && edge.target
          );
          
          if (validEdges.length > 0 && setEdges) {
            // Actualizar el estado con las aristas recuperadas
            setTimeout(() => {
              setEdges(validEdges);
            }, 500);
          }
        }
      }
      
      // Verificar si hay aristas en el DOM (con limitación de frecuencia)
      setTimeout(() => {
        const now = Date.now();
        if (now - lastCheckTime < CHECK_THROTTLE_MS) {
          return; // Evitar verificaciones demasiado frecuentes
        }
        
        lastCheckTime = now;
        
        // Solo verificar si hay aristas en el estado y faltan muchas en el DOM
        if (edges && edges.length > 3) {
          const edgeElements = document.querySelectorAll('.react-flow__edge');
          const missingEdges = edges.length - edgeElements.length;
          
          if (missingEdges > 3) {
            forceEdgeVisualUpdate();
          }
        }
      }, 5000);
    };
    
    // Verificar aristas al iniciar
    checkAndRecoverEdges();
    
    // Escuchar eventos de guardado de aristas (con limitación de frecuencia)
    const handleEdgesSaved = () => {
      const now = Date.now();
      if (now - lastEventResponseTime < EVENT_THROTTLE_MS) {
        return; // Evitar respuestas demasiado frecuentes
      }
      
      lastEventResponseTime = now;
      setTimeout(forceEdgeVisualUpdate, 1000);
    };
    
    document.addEventListener('edges-saved', handleEdgesSaved);
    
    return () => {
      document.removeEventListener('edges-saved', handleEdgesSaved);
    };
  }, [edges, setEdges]);
  
  // Este componente no renderiza nada visible
  return null;
};

export default EdgeSyncManager;
