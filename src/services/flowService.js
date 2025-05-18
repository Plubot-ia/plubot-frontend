/**
 * Servicio para manejar las operaciones de flujo de manera optimizada.
 * Este servicio proporciona métodos para cargar, guardar y gestionar flujos
 * utilizando actualizaciones incrementales y persistencia de IDs.
 */
import { v4 as uuidv4 } from 'uuid';
import instance from '@/utils/axiosConfig';

/**
 * Genera un ID único para un nodo o arista.
 * @param {string} prefix - Prefijo para el ID ('node', 'edge', etc.)
 * @returns {string} ID único en formato '{prefix}-{uuid}'
 */
export const generateId = (prefix = 'node') => {
  return `${prefix}-${uuidv4()}`;
};

/**
 * Calcula las diferencias entre dos estados de flujo.
 * @param {Object} oldState - Estado anterior del flujo {nodes: [], edges: []}
 * @param {Object} newState - Nuevo estado del flujo {nodes: [], edges: []}
 * @returns {Object} Diferencias entre los estados
 */
export const computeFlowDiff = (oldState, newState) => {
  const oldNodes = oldState.nodes || [];
  const newNodes = newState.nodes || [];
  const oldEdges = oldState.edges || [];
  const newEdges = newState.edges || [];
  
  // Mapas para búsqueda rápida
  const oldNodesMap = new Map(oldNodes.map(node => [node.id, node]));
  const newNodesMap = new Map(newNodes.map(node => [node.id, node]));
  const oldEdgesMap = new Map(oldEdges.map(edge => [edge.id, edge]));
  const newEdgesMap = new Map(newEdges.map(edge => [edge.id, edge]));
  
  // Calcular diferencias en nodos
  const nodesToCreate = [];
  const nodesToUpdate = [];
  const nodesToDelete = [];
  
  // Nodos nuevos o actualizados
  newNodes.forEach(node => {
    if (!oldNodesMap.has(node.id)) {
      nodesToCreate.push(node);
    } else {
      const oldNode = oldNodesMap.get(node.id);
      if (hasNodeChanged(oldNode, node)) {
        nodesToUpdate.push(node);
      }
    }
  });
  
  // Nodos eliminados
  oldNodes.forEach(node => {
    if (!newNodesMap.has(node.id)) {
      nodesToDelete.push(node.id);
    }
  });
  
  // Calcular diferencias en aristas
  const edgesToCreate = [];
  const edgesToUpdate = [];
  const edgesToDelete = [];
  
  // Aristas nuevas o actualizadas
  newEdges.forEach(edge => {
    if (!oldEdgesMap.has(edge.id)) {
      edgesToCreate.push(edge);
    } else {
      const oldEdge = oldEdgesMap.get(edge.id);
      if (hasEdgeChanged(oldEdge, edge)) {
        edgesToUpdate.push(edge);
      }
    }
  });
  
  // Aristas eliminadas
  oldEdges.forEach(edge => {
    if (!newEdgesMap.has(edge.id)) {
      edgesToDelete.push(edge.id);
    }
  });
  
  return {
    nodes_to_create: nodesToCreate,
    nodes_to_update: nodesToUpdate,
    nodes_to_delete: nodesToDelete,
    edges_to_create: edgesToCreate,
    edges_to_update: edgesToUpdate,
    edges_to_delete: edgesToDelete
  };
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
   * Guarda el flujo de un plubot utilizando actualizaciones incrementales.
   * @param {number} plubotId - ID del plubot
   * @param {Object} currentState - Estado actual del flujo {nodes: [], edges: []}
   * @param {Object} previousState - Estado anterior del flujo {nodes: [], edges: []}
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async saveFlow(plubotId, currentState, previousState) {
    try {
      // Si no hay estado anterior, enviar todo el flujo
      if (!previousState || !previousState.nodes || !previousState.edges) {
        return this.saveFullFlow(plubotId, currentState);
      }
      
      // Calcular diferencias
      const diff = computeFlowDiff(previousState, currentState);
      
      // Verificar si hay cambios
      const hasChanges = 
        diff.nodes_to_create.length > 0 ||
        diff.nodes_to_update.length > 0 ||
        diff.nodes_to_delete.length > 0 ||
        diff.edges_to_create.length > 0 ||
        diff.edges_to_update.length > 0 ||
        diff.edges_to_delete.length > 0;
      
      if (!hasChanges) {
        console.log('No hay cambios que guardar');
        return { status: 'success', message: 'No hay cambios que guardar' };
      }
      
      // Adaptar los nodos para usar node_metadata en lugar de metadata
      if (diff.nodes_to_create.length > 0) {
        diff.nodes_to_create = diff.nodes_to_create.map(node => {
          if (node.metadata) {
            node.node_metadata = node.metadata;
            delete node.metadata;
          }
          return node;
        });
      }
      
      if (diff.nodes_to_update.length > 0) {
        diff.nodes_to_update = diff.nodes_to_update.map(node => {
          if (node.metadata) {
            node.node_metadata = node.metadata;
            delete node.metadata;
          }
          return node;
        });
      }
      
      // Adaptar las aristas para usar edge_metadata en lugar de metadata
      if (diff.edges_to_create.length > 0) {
        diff.edges_to_create = diff.edges_to_create.map(edge => {
          if (edge.metadata) {
            edge.edge_metadata = edge.metadata;
            delete edge.metadata;
          }
          return edge;
        });
      }
      
      if (diff.edges_to_update.length > 0) {
        diff.edges_to_update = diff.edges_to_update.map(edge => {
          if (edge.metadata) {
            edge.edge_metadata = edge.metadata;
            delete edge.metadata;
          }
          return edge;
        });
      }
      
      // Enviar solo las diferencias
      const response = await instance.patch(`/api/flow/${plubotId}`, {
        diff,
        name: currentState.name
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al guardar el flujo:', error);
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
