/**
 * Servicio para manejar las operaciones de flujo de manera optimizada.
 * Este servicio proporciona métodos para cargar, guardar y gestionar flujos
 * utilizando actualizaciones incrementales y persistencia de IDs.
 */
import { v4 as uuidv4 } from 'uuid';

// Importar sistema de registro de eventos

import instance from '@/utils/axios-config.js';
// Importar utilidades de optimización de flujo
import { captureError, handleError } from '@/utils/error-handler.js';
import { calculateFlowDiff } from '@/utils/flow-optimizer.js';

// Importar sistema centralizado de manejo de errores

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
      stats: { total: { nodes: 0, edges: 0 }, changes: {} },
    };
  }

  // Utilizar la implementación optimizada del flow-optimizer
  return calculateFlowDiff(oldState, newState);
};

/**
 * Servicio para manejar operaciones de flujo.
 */
const flowService = {
  /**
   * Valida los parámetros de entrada para loadFlow
   * @param {string} plubotId - ID del plubot
   * @throws {Error} Si el plubotId es inválido
   */
  _validateLoadFlowParams(plubotId) {
    if (!plubotId) {
      const error = new Error(
        'El ID del Plubot es inválido para cargar el flujo.',
      );
      captureError(error, 'loadFlow:invalid-id');
      handleError(error);
      throw error;
    }
  },

  /**
   * Construye el mensaje de error apropiado para respuestas inválidas
   * @param {Object} response - Respuesta del servidor
   * @returns {string} Mensaje de error descriptivo
   */
  _buildFlowErrorMessage(response) {
    if (response?.data?.message) {
      return response.data.message;
    } else if (response?.data?.status) {
      return `Error al cargar el flujo: status backend '${response.data.status}'.`;
    }
    return 'Error al cargar el flujo: Respuesta inesperada del servidor.';
  },

  /**
   * Valida la respuesta del servidor para loadFlow
   * @param {Object} response - Respuesta del servidor
   * @returns {Object} Datos del flujo si la respuesta es válida
   * @throws {Error} Si la respuesta es inválida
   */
  _validateFlowResponse(response) {
    if (
      response &&
      response.data &&
      response.data.status === 'success' &&
      response.data.data
    ) {
      return response.data.data;
    } else {
      const errorMessage = this._buildFlowErrorMessage(response);
      throw new Error(errorMessage);
    }
  },

  /**
   * Transforma los datos del flujo para compatibilidad con metadata
   * @param {Object} flowData - Datos del flujo del servidor
   * @returns {Object} Datos del flujo transformados
   */
  _transformFlowData(flowData) {
    // Adaptaciones para compatibilidad
    if (flowData.nodes) {
      flowData.nodes = flowData.nodes.map((node) => {
        if (node.node_metadata) {
          node.metadata = node.node_metadata;
        }
        return node;
      });
    }
    if (flowData.edges) {
      flowData.edges = flowData.edges.map((edge) => {
        if (edge.edge_metadata) {
          edge.metadata = edge.edge_metadata;
        }
        return edge;
      });
    }
    return flowData;
  },

  /**
   * Maneja errores específicos de loadFlow
   * @param {Error} error - Error capturado
   * @param {string} plubotId - ID del plubot para contexto
   * @throws {Error} Re-lanza el error después del manejo
   */
  _handleLoadFlowError(error, plubotId) {
    const errorInfo = captureError(error, `loadFlow:${plubotId}`);
    handleError(errorInfo);
    throw error;
  },

  /**
   * Carga el flujo de un plubot.
   * @param {string} plubotId - ID del plubot
   * @returns {Promise<Object>} Datos del flujo {nodes: [], edges: [], name: string}
   */
  async loadFlow(plubotId) {
    this._validateLoadFlowParams(plubotId);

    try {
      const response = await instance.get(`/flow/${plubotId}`);
      const flowData = this._validateFlowResponse(response);
      return this._transformFlowData(flowData);
    } catch (error) {
      this._handleLoadFlowError(error, plubotId);
    }
  },

  /**
   * Guarda el flujo completo de un plubot. Es más robusto y fiable que el guardado incremental.
   * @param {string} plubotId - ID del plubot
   * @param {Object} flowData - Datos del flujo {nodes, edges, name}
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async saveFlow(plubotId, flowData) {
    if (!plubotId || !flowData) {
      throw new Error('Parámetros de entrada inválidos para saveFlow');
    }

    try {
      // Adapta la estructura de datos para el backend
      const adaptedFlowData = {
        ...flowData,
        nodes: flowData.nodes.map((node) => {
          const adapted = { ...node };
          if (adapted.metadata) {
            adapted.node_metadata = adapted.metadata;
            delete adapted.metadata;
          }
          return adapted;
        }),
        edges: flowData.edges.map((edge) => {
          const adapted = { ...edge };
          if (adapted.metadata) {
            adapted.edge_metadata = adapted.metadata;
            delete adapted.metadata;
          }
          return adapted;
        }),
      };

      const response = await instance.patch(
        `/flow/${plubotId}`,
        adaptedFlowData,
      );
      return response.data;
    } catch (error) {
      const errorInfo = captureError(error, `saveFlow:${plubotId}`);
      handleError(errorInfo);
      throw error;
    }
  },

  /**
   * Obtiene la lista de copias de seguridad disponibles para un plubot.
   * @param {string} plubotId - ID del plubot
   * @returns {Promise<Array>} Lista de copias de seguridad
   */
  async listBackups(plubotId) {
    try {
      const response = await instance.get(`/flow/${plubotId}/backup`);
      if (response.data.status === 'success') {
        return response.data.backups;
      }
      throw new Error(
        response.data.message || 'Error al obtener las copias de seguridad',
      );
    } catch (error) {
      captureError(error, `listBackups:${plubotId}`);
      throw error;
    }
  },

  /**
   * Restaura una copia de seguridad para un plubot.
   * @param {string} plubotId - ID del plubot
   * @param {string} backupId - ID de la copia de seguridad
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async restoreBackup(plubotId, backupId) {
    try {
      const response = await instance.post(
        `/flow/${plubotId}/backup/${backupId}`,
      );
      return response.data;
    } catch (error) {
      captureError(error, `restoreBackup:${plubotId}:${backupId}`);
      throw error;
    }
  },
};

export default flowService;
