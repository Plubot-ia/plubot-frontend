import { debounce } from 'lodash';

import { sanitizeFlowState } from '@/components/onboarding/flow-editor/utils/flow-sanitizer';
import { flowStateManager } from '@/components/onboarding/flow-editor/utils/flowCacheManager';
import flowService from '@/services/flowService';

import logger from '../../services/loggerService';
import { migrateMessageNodeHandles } from '../../utils/handleMigration';

import {
  validateEdgesIntegrity,
  validateEdgeNodeReferences,
  prepareLoadingState,
  prepareLoadedState,
  prepareErrorState,
} from './persistenceSlice.helpers';

export const createPersistenceSlice = (set, get) => ({
  isSaving: false,
  lastSaved: undefined,
  plubotId: undefined,
  flowName: 'Flujo sin título',
  isLoaded: false,
  loadError: false,
  isBackupLoaded: false,
  hasChanges: false,

  setPlubotId: (id) => set({ plubotId: id }),
  setFlowName: (name) => set({ flowName: name }),
  setHasChanges: (hasChanges) => set({ hasChanges }),

  _saveFlowToServer: async (flowState) => {
    try {
      const response = await flowService.saveFlow(flowState.plubotId, flowState);
      set({ lastSaved: new Date(), isSaving: false, hasChanges: false });

      // Log de éxito
      // Flow saved successfully, response);

      return response;
    } catch (error) {
      logger.error('Error saving flow:', error);
      set({ isSaving: false });
      throw error; // Re-lanzar el error para que se maneje en el nivel superior
    }
  },

  // 🔧 SANITIZACIÓN ESTRICTA: Limpiar edges antes de guardar
  _sanitizeEdgesForBackend: (edges) => {
    if (!Array.isArray(edges)) return [];

    return edges
      .filter((edge) => {
        // Filtrar edges completamente inválidos
        return edge && edge.id && edge.source && edge.target;
      })
      .map((edge) => {
        const sanitizedEdge = {
          id: edge.id,
          source: edge.source,
          target: edge.target,
        };

        // 🚨 SANITIZACIÓN CRÍTICA: Solo incluir campos si tienen valores válidos
        // IMPORTANTE: No asignar campos undefined/null - omitirlos completamente

        // sourceHandle: solo si es válido y no vacío
        if (
          edge.sourceHandle &&
          typeof edge.sourceHandle === 'string' &&
          edge.sourceHandle.trim() !== ''
        ) {
          sanitizedEdge.sourceHandle = edge.sourceHandle;
        }

        // targetHandle: solo si es válido y no vacío
        if (
          edge.targetHandle &&
          typeof edge.targetHandle === 'string' &&
          edge.targetHandle.trim() !== ''
        ) {
          sanitizedEdge.targetHandle = edge.targetHandle;
        }

        // type: solo si es válido y no vacío
        if (edge.type && typeof edge.type === 'string' && edge.type.trim() !== '') {
          sanitizedEdge.type = edge.type;
        }

        // Incluir otros campos opcionales si existen
        if (edge.animated !== undefined) sanitizedEdge.animated = edge.animated;
        if (edge.style) sanitizedEdge.style = edge.style;
        if (edge.markerEnd) sanitizedEdge.markerEnd = edge.markerEnd;
        if (edge.data) sanitizedEdge.data = edge.data;

        return sanitizedEdge;
      });
  },

  saveFlow: async () => {
    const state = get();
    const { plubotId, nodes, edges, viewport, flowName } = state;

    if (!plubotId) {
      throw new Error('No se puede guardar sin un plubotId');
    }

    set({ isSaving: true });

    // 🔧 SANITIZACIÓN CRÍTICA: Limpiar edges antes de enviar al backend
    const sanitizedEdges = get()._sanitizeEdgesForBackend(edges);

    const flowState = {
      plubotId,
      flowName,
      nodes: [...nodes], // Crear copia para evitar mutaciones
      edges: sanitizedEdges,
      viewport,
    };

    // Hacer el guardado asíncrono y esperar respuesta
    try {
      await get()._saveFlowToServer(flowState);
      // Flujo guardado exitosamente
    } catch (error) {
      // Save failed
      throw error;
    }
  },

  loadFlow: async (plubotId) => {
    // 1. Limpieza síncrona: Prepara el store para la nueva carga
    get().clearHistory();
    set(prepareLoadingState());

    try {
      // 2. Carga asíncrona de datos
      const flowData = await flowService.loadFlow(plubotId);

      // 3. Validar integridad de edges y sanitizar datos
      const validatedEdges = validateEdgesIntegrity(flowData.edges);

      // 3.5. Migrar handles antiguos (default -> output) para MessageNode
      const migratedEdges = migrateMessageNodeHandles(validatedEdges, flowData.nodes);

      const sanitizedData = sanitizeFlowState({
        ...flowData,
        edges: migratedEdges,
      });

      // 4. Validar referencias entre nodos y edges
      const { validEdges } = validateEdgeNodeReferences(sanitizedData.edges, sanitizedData.nodes);

      // 5. Actualización atómica del estado
      // DEBUG: Log de carga de aristas (temporalmente deshabilitado)
       // Loading flowEdges:', {
      //   count: validEdges.length,
      //   uniqueIds: [...new Set(validEdges.map((edge) => edge.id))].length,
      //   edges: validEdges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
      // });
      get().setEdges(validEdges);
      set(prepareLoadedState(sanitizedData, plubotId, flowData));
    } catch (error) {
      logger.error('Error loading flow:', error);
      set(prepareErrorState());
    }
  },

  backupState: debounce((plubotId, nodes, edges) => {
    if (!plubotId) return;
    flowStateManager.saveBackup(plubotId, { nodes, edges });
  }, 1000),

  restoreFromBackup: (plubotId) => {
    const backup = flowStateManager.getBackup(plubotId);
    if (backup) {
      set({ ...backup, isBackupLoaded: true });
    }
  },
});
