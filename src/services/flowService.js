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
      const response = await instance.get(`/flow/${plubotId}`);

      if (response && response.data && response.data.status === 'success' && response.data.data) {
        const flowData = response.data.data;

        // Adaptaciones para compatibilidad
        if (flowData.nodes) {
          flowData.nodes = flowData.nodes.map(node => {
            if (node.node_metadata) {
              node.metadata = node.node_metadata;
            }
            return node;
          });
        }
        if (flowData.edges) {
          flowData.edges = flowData.edges.map(edge => {
            if (edge.edge_metadata) {
              edge.metadata = edge.edge_metadata;
            }
            return edge;
          });
        }
        return flowData;
      } else {
        let errorMessage = 'Error al cargar el flujo: Respuesta inesperada del servidor.';
        if (response?.data?.message) {
          errorMessage = response.data.message;
        } else if (response?.data?.status) {
          errorMessage = `Error al cargar el flujo: status backend '${response.data.status}'.`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Centralizar el manejo de errores y propagar
      const errorInfo = captureError(error, `loadFlow:${plubotId}`);
      handleError(errorInfo);
      throw error;
    }
  },

  /**
   * Guarda el flujo de un plubot utilizando actualizaciones incrementales y optimización.
   * @param {number} plubotId - ID del plubot
   * @param {Object} currentState - Estado actual del flujo {nodes: [], edges: []}
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async saveFlow(plubotId, currentState) {
    const backupId = `flow_backup_${Date.now()}`;
    
    try {
      if (!plubotId || !currentState || !Array.isArray(currentState.nodes) || !Array.isArray(currentState.edges)) {
        throw new Error('Parámetros de entrada inválidos para saveFlow');
      }

      const optimizedState = optimizeFlow(currentState);
      const validationResult = validateFlow(optimizedState);

      if (!validationResult.valid && validationResult.errors.length > 0) {
        throw new Error(`Error de validación: ${validationResult.errors.join(', ')}`);
      }

      try {
        localStorage.setItem(backupId, JSON.stringify({ plubotId, ...optimizedState }));
      } catch (e) {
        // No bloquear si falla el guardado en localStorage
      }

      const adaptNodes = (nodes) => nodes.map(node => {
        const nodeCopy = { ...node };
        if (nodeCopy.metadata) {
          nodeCopy.node_metadata = nodeCopy.metadata;
          delete nodeCopy.metadata;
        }
        return nodeCopy;
      });

      const adaptEdges = (edges) => edges.map(edge => {
        const edgeCopy = { ...edge };
        if (edgeCopy.metadata) {
          edgeCopy.edge_metadata = edgeCopy.metadata;
          delete edgeCopy.metadata;
        }
        return edgeCopy;
      });

      const payload = {
        nodes: adaptNodes(optimizedState.nodes),
        edges: adaptEdges(optimizedState.edges),
        name: currentState.name,
      };

      const MAX_RETRIES = 3;
      let lastError = null;

      for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
        try {
          const response = await instance.patch(`/flow/${plubotId}`, payload);
          localStorage.removeItem(backupId); // Eliminar backup en éxito
          return { ...response.data, backupId, timestamp: new Date().toISOString() };
        } catch (error) {
          lastError = error;
          const errorInfo = captureError(error, `saveFlow:${plubotId}:retry${retryCount + 1}`);

          if (errorInfo.type === ERROR_TYPES.AUTH) {
            throw error; // No reintentar en error de autenticación
          }

          if (errorInfo.type === ERROR_TYPES.NETWORK && retryCount < MAX_RETRIES - 1) {
            const waitTime = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            break; // Salir del bucle para otros errores o si se superan los reintentos
          }
        }
      }

      throw lastError;
    } catch (error) {
      const errorInfo = captureError(error, `saveFlow:${plubotId}`);
      const errorActions = handleError(errorInfo);

      if (errorActions.shouldRecover) {
        try {
          const recoveredData = recoverFromBackup(backupId);
          if (recoveredData) {
            return { success: false, recovered: true, error: error.message, backupId, recoveredData };
          }
        } catch (recoveryError) {
          // La recuperación falló, se propagará el error original
        }
      }
      throw error;
    }
  },

  /**
   * Guarda el flujo completo de un plubot (usado para casos especiales).
   * @param {number} plubotId - ID del plubot
   * @param {Object} flowData - Datos del flujo {nodes: [], edges: [], name: string}
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async saveFullFlow(plubotId, flowData) {
    try {
      const adaptedFlowData = JSON.parse(JSON.stringify(flowData));
      if (adaptedFlowData.nodes) {
        adaptedFlowData.nodes = adaptedFlowData.nodes.map(node => {
          if (node.metadata) {
            node.node_metadata = node.metadata;
            delete node.metadata;
          }
          return node;
        });
      }
      if (adaptedFlowData.edges) {
        adaptedFlowData.edges = adaptedFlowData.edges.map(edge => {
          if (edge.metadata) {
            edge.edge_metadata = edge.metadata;
            delete edge.metadata;
          }
          return edge;
        });
      }
      const response = await instance.patch(`/flow/${plubotId}`, adaptedFlowData);
      return response.data;
    } catch (error) {
      captureError(error, `saveFullFlow:${plubotId}`);
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
      const response = await instance.get(`/flow/${plubotId}/backup`);
      if (response.data.status === 'success') {
        return response.data.backups;
      }
      throw new Error(response.data.message || 'Error al obtener las copias de seguridad');
    } catch (error) {
      captureError(error, `listBackups:${plubotId}`);
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
      const response = await instance.post(`/flow/${plubotId}/backup/${backupId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default flowService;
