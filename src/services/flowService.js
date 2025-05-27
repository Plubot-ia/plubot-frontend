/**
 * Servicio para manejar las operaciones de flujo de manera optimizada.
 * Este servicio proporciona métodos para cargar, guardar y gestionar flujos
 * utilizando actualizaciones incrementales y persistencia de IDs.
 */
import { v4 as uuidv4 } from 'uuid';
import instance from '@/utils/axiosConfig';
// Importar utilidades de optimización de flujo
import { calculateFlowDiff, optimizeFlow, validateFlow } from '@/utils/flowOptimizer';
// Importar sistema centralizado de manejo de errores
import { captureError, handleError, recoverFromBackup, ERROR_TYPES } from '@/utils/errorHandler';

/**
 * Genera un ID único para un nodo o arista.
 * @param {string} prefix - Prefijo para el ID ('node', 'edge', etc.)
 * @returns {string} ID único en formato '{prefix}-{uuid}'
 */
export const generateId = (prefix = 'node') => {
  return `${prefix}-${uuidv4()}`;
};

/**
 * Calcula las diferencias entre dos estados de flujo de manera optimizada.
 * @param {Object} oldState - Estado anterior del flujo {nodes: [], edges: []}
 * @param {Object} newState - Nuevo estado del flujo {nodes: [], edges: []}
 * @returns {Object} Diferencias entre los estados
 */
export const computeFlowDiff = (oldState, newState) => {
  // Validar parámetros de entrada
  if (!oldState || !newState) {
    console.warn('computeFlowDiff: Parámetros inválidos');
    return {
      nodes_to_create: [],
      nodes_to_update: [],
      nodes_to_delete: [],
      edges_to_create: [],
      edges_to_update: [],
      edges_to_delete: [],
      stats: { total: { nodes: 0, edges: 0 }, changes: {} }
    };
  }
  
  // Utilizar la implementación optimizada del flowOptimizer
  return calculateFlowDiff(oldState, newState);
};

/**
 * Determina si un nodo ha cambiado comparando sus propiedades relevantes.
 * @param {Object} oldNode - Nodo en estado anterior
 * @param {Object} newNode - Nodo en nuevo estado
 * @returns {boolean} True si el nodo ha cambiado, False en caso contrario
 */
const hasNodeChanged = (oldNode, newNode) => {
  // Comparar posición
  const oldPos = oldNode.position || {};
  const newPos = newNode.position || {};
  
  if (oldPos.x !== newPos.x || oldPos.y !== newPos.y) {
    return true;
  }
  
  // Comparar datos
  const oldData = oldNode.data || {};
  const newData = newNode.data || {};
  
  if (oldData.label !== newData.label || oldData.message !== newData.message) {
    return true;
  }
  
  // Comparar tipo
  if (oldNode.type !== newNode.type) {
    return true;
  }
  
  return false;
};

/**
 * Determina si una arista ha cambiado comparando sus propiedades relevantes.
 * @param {Object} oldEdge - Arista en estado anterior
 * @param {Object} newEdge - Arista en nuevo estado
 * @returns {boolean} True si la arista ha cambiado, False en caso contrario
 */
const hasEdgeChanged = (oldEdge, newEdge) => {
  // Comparar conexiones
  if (oldEdge.source !== newEdge.source ||
      oldEdge.target !== newEdge.target ||
      oldEdge.sourceHandle !== newEdge.sourceHandle ||
      oldEdge.targetHandle !== newEdge.targetHandle) {
    return true;
  }
  
  // Comparar etiqueta
  if (oldEdge.label !== newEdge.label) {
    return true;
  }
  
  // Comparar tipo
  if (oldEdge.type !== newEdge.type) {
    return true;
  }
  
  // Comparar estilo (simplificado)
  const oldStyle = oldEdge.style || {};
  const newStyle = newEdge.style || {};
  
  if (oldStyle.stroke !== newStyle.stroke || oldStyle.strokeWidth !== newStyle.strokeWidth) {
    return true;
  }
  
  return false;
};

/**
 * Servicio para manejar operaciones de flujo.
 */
const flowService = {
  /**
   * Carga el flujo de un plubot.
   * @param {number} plubotId - ID del plubot
   * @returns {Promise<Object>} Datos del flujo {nodes: [], edges: [], name: string}
   */
  async loadFlow(plubotId) {
    try {
      const response = await instance.get(`/api/flow/${plubotId}`);
      
      if (response.data.status === 'success') {
        const flowData = response.data.data;
        
        // Adaptar los nodos para usar metadata en lugar de node_metadata (para compatibilidad con el frontend)
        if (flowData.nodes) {
          flowData.nodes = flowData.nodes.map(node => {
            if (node.node_metadata) {
              node.metadata = node.node_metadata;
              // No eliminamos node_metadata para mantener compatibilidad con el backend
            }
            return node;
          });
        }
        
        // Adaptar las aristas para usar metadata en lugar de edge_metadata (para compatibilidad con el frontend)
        if (flowData.edges) {
          flowData.edges = flowData.edges.map(edge => {
            if (edge.edge_metadata) {
              edge.metadata = edge.edge_metadata;
              // No eliminamos edge_metadata para mantener compatibilidad con el backend
            }
            return edge;
          });
        }
        
        return flowData;
      }
      
      throw new Error(response.data.message || 'Error al cargar el flujo');
    } catch (error) {
      console.error('Error al cargar el flujo:', error);
      throw error;
    }
  },
  
  /**
   * Guarda el flujo de un plubot utilizando actualizaciones incrementales y optimización.
   * @param {number} plubotId - ID del plubot
   * @param {Object} currentState - Estado actual del flujo {nodes: [], edges: []}
   * @param {Object} previousState - Estado anterior del flujo {nodes: [], edges: []}
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async saveFlow(plubotId, currentState, previousState) {
    // Crear respaldo local antes de intentar guardar
    const backupId = `flow_backup_${Date.now()}`;
    
    try {
      // Validar parámetros de entrada
      if (!plubotId) {
        throw new Error('No se proporcionó un ID de plubot válido');
      }
      
      if (!currentState || !Array.isArray(currentState.nodes) || !Array.isArray(currentState.edges)) {
        throw new Error('Estado actual del flujo inválido');
      }
      
      // Crear una copia optimizada del estado actual (eliminar datos temporales y nodos desconectados)
      const optimizedState = optimizeFlow(currentState);
      console.log(`[FlowService] Flujo optimizado: ${optimizedState.stats.nodesRemoved} nodos y ${optimizedState.stats.edgesRemoved} aristas eliminadas`);
      
      // Validar el flujo antes de guardar
      const validationResult = validateFlow(optimizedState);
      if (!validationResult.valid) {
        console.warn('[FlowService] Advertencias de validación:', validationResult.warnings);
        if (validationResult.errors.length > 0) {
          throw new Error(`Error de validación: ${validationResult.errors.join(', ')}`);
        }
      }
      
      // Guardar respaldo local del estado optimizado
      localStorage.setItem(backupId, JSON.stringify({
        timestamp: Date.now(),
        plubotId,
        ...optimizedState,
        validation: validationResult
      }));
      
      // Calcular diferencias para optimizar la carga
      const diff = computeFlowDiff(
        previousState || { nodes: [], edges: [] },
        optimizedState
      );
      
      // Verificar si hay cambios que guardar
      const hasChanges = 
        diff.nodes_to_create.length > 0 || 
        diff.nodes_to_update.length > 0 || 
        diff.nodes_to_delete.length > 0 || 
        diff.edges_to_create.length > 0 || 
        diff.edges_to_update.length > 0 || 
        diff.edges_to_delete.length > 0;
      
      // Mostrar estadísticas de cambios si los hay
      if (hasChanges) {
        console.log(`[FlowService] Guardando cambios: ${diff.stats.changes.nodesCreated} nodos creados, ${diff.stats.changes.nodesUpdated} actualizados, ${diff.stats.changes.nodesDeleted} eliminados`);
      }
      
      // Si no hay cambios, retornar éxito sin hacer petición al servidor
      if (!hasChanges && previousState) {
        console.log('[FlowService] No hay cambios que guardar');
        return {
          success: true,
          message: 'No hay cambios que guardar',
          timestamp: new Date().toISOString(),
          backupId
        };
      }

      // Adaptar los nodos para usar node_metadata en lugar de metadata
      const adaptNodes = (nodes) => {
        return nodes.map(node => {
          const nodeCopy = { ...node };
          if (nodeCopy.metadata) {
            nodeCopy.node_metadata = nodeCopy.metadata;
            delete nodeCopy.metadata;
          }
          return nodeCopy;
        });
      };

      // Adaptar las aristas para usar edge_metadata en lugar de metadata
      const adaptEdges = (edges) => {
        return edges.map(edge => {
          const edgeCopy = { ...edge };
          if (edgeCopy.metadata) {
            edgeCopy.edge_metadata = edgeCopy.metadata;
            delete edgeCopy.metadata;
          }
          return edgeCopy;
        });
      };

      // Aplicar adaptaciones a todos los nodos y aristas
      if (diff.nodes_to_create.length > 0) {
        diff.nodes_to_create = adaptNodes(diff.nodes_to_create);
      }

      if (diff.nodes_to_update.length > 0) {
        diff.nodes_to_update = adaptNodes(diff.nodes_to_update);
      }

      if (diff.edges_to_create.length > 0) {
        diff.edges_to_create = adaptEdges(diff.edges_to_create);
      }

      if (diff.edges_to_update.length > 0) {
        diff.edges_to_update = adaptEdges(diff.edges_to_update);
      }
      
      // Preparar el payload para la API
      const payload = {
        diff,
        name: currentState.name
      };
      
      // Implementar reintentos con backoff exponencial
      const MAX_RETRIES = 3;
      let retryCount = 0;
      let lastError = null;
      
      while (retryCount < MAX_RETRIES) {
        try {
          // Enviar solo las diferencias
          const response = await instance.patch(`/api/flow/${plubotId}`, payload);

          // Eliminar respaldo local después de guardar exitosamente
          try {
            localStorage.removeItem(backupId);
          } catch (e) {
            console.warn('Error al eliminar respaldo local:', e);
          }

          // Devolver respuesta exitosa con metadatos
          return {
            ...response.data,
            backupId,
            optimizationStats: diff.stats,
            validationResult: validationResult,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          lastError = error;
          retryCount++;

          // Capturar y clasificar el error para análisis
          const errorInfo = captureError(error, `saveFlow:${plubotId}:retry${retryCount}`);
          
          // Si es un error de red, reintentar con backoff
          if (errorInfo.type === ERROR_TYPES.NETWORK && retryCount < MAX_RETRIES) {
            const waitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
            console.log(`[FlowService] Reintento ${retryCount}/${MAX_RETRIES} en ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else if (errorInfo.type === ERROR_TYPES.AUTH) {
            // Error de autenticación, no reintentar
            console.error('[FlowService] Error de autenticación al guardar flujo');
            throw error;
          } else if (retryCount >= MAX_RETRIES) {
            // No más reintentos
            break;
          }
        }
      }

      // Si llegamos aquí, todos los reintentos fallaron
      const finalError = lastError || new Error('Error al guardar el flujo después de múltiples intentos');
      throw finalError;
    } catch (error) {
      // Usar el sistema centralizado de manejo de errores
      const errorInfo = captureError(error, `saveFlow:${plubotId}`);
      
      // Verificar si podemos recuperar del error
      const errorActions = handleError(errorInfo);
      
      // Si podemos recuperar, intentar una vez más usando el respaldo
      if (errorActions.shouldRecover) {
        try {
          console.log('[FlowService] Intentando recuperar del error usando respaldo local...');
          const recoveredData = recoverFromBackup(backupId);
          if (recoveredData) {
            return {
              success: false,
              recovered: true,
              error: error.message,
              backupId,
              timestamp: new Date().toISOString(),
              recoveredData
            };
          }
        } catch (recoveryError) {
          console.error('[FlowService] Error durante la recuperación:', recoveryError);
        }
      }
      
      // Propagar el error con información para manejo por parte del componente
      throw error;
    }
  },

  /**
   * Guarda el flujo completo de un plubot.
   * @param {number} plubotId - ID del plubot
   * @param {Object} flowData - Datos del flujo {nodes: [], edges: [], name: string}
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async saveFullFlow(plubotId, flowData) {
    try {
      // Crear una copia profunda del objeto para no modificar el original
      const adaptedFlowData = JSON.parse(JSON.stringify(flowData));
      
      // Adaptar los nodos para usar node_metadata en lugar de metadata
      if (adaptedFlowData.nodes) {
        adaptedFlowData.nodes = adaptedFlowData.nodes.map(node => {
          if (node.metadata) {
            node.node_metadata = node.metadata;
            delete node.metadata;
          }
          return node;
        });
      }
      
      // Adaptar las aristas para usar edge_metadata en lugar de metadata
      if (adaptedFlowData.edges) {
        adaptedFlowData.edges = adaptedFlowData.edges.map(edge => {
          if (edge.metadata) {
            edge.edge_metadata = edge.metadata;
            delete edge.metadata;
          }
          return edge;
        });
      }
      
      const response = await instance.patch(`/api/flow/${plubotId}`, adaptedFlowData);
      return response.data;
    } catch (error) {
      console.error('Error al guardar el flujo completo:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene la lista de copias de seguridad disponibles para un plubot.
   * @param {number} plubotId - ID del plubot
   * @returns {Promise<Array>} Lista de copias de seguridad
   */
  async listBackups(plubotId) {
    try {
      const response = await instance.get(`/api/flow/${plubotId}/backup`);
      
      if (response.data.status === 'success') {
        return response.data.backups;
      }
      
      throw new Error(response.data.message || 'Error al obtener las copias de seguridad');
    } catch (error) {
      console.error('Error al obtener las copias de seguridad:', error);
      throw error;
    }
  },
  
  /**
   * Restaura una copia de seguridad para un plubot.
   * @param {number} plubotId - ID del plubot
   * @param {string} backupId - ID de la copia de seguridad
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async restoreBackup(plubotId, backupId) {
    try {
      const response = await instance.post(`/api/flow/${plubotId}/backup/${backupId}`);
      return response.data;
    } catch (error) {
      console.error('Error al restaurar la copia de seguridad:', error);
      throw error;
    }
  }
};

export default flowService;
