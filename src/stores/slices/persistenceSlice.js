import { debounce } from 'lodash';

import { sanitizeFlowState } from '@/components/onboarding/flow-editor/utils/flow-sanitizer';
import { flowStateManager } from '@/components/onboarding/flow-editor/utils/flowCacheManager';
import flowService from '@/services/flowService';

import logger from '../../services/loggerService';

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
      await flowService.saveFlow(flowState.plubotId, flowState);
      set({ lastSaved: new Date(), isSaving: false });
    } catch (error) {
      logger.error('Error saving flow:', error);
      set({ isSaving: false });
    }
  },

  saveFlow: () => {
    const { plubotId, nodes, edges, viewport, flowName } = get();
    if (!plubotId) return;

    set({ isSaving: true });
    const flowState = { plubotId, flowName, nodes, edges, viewport };
    get()._saveFlowToServer(flowState);
  },

  loadFlow: async (plubotId) => {
    // 1. Limpieza síncrona: Prepara el store para la nueva carga.
    get().clearHistory();
    set({
      isLoaded: false,
      loadError: false,
      nodes: [],
      edges: [],
      flowName: 'Cargando nombre...',
    });

    try {
      // 2. Carga asíncrona de datos
      const flowData = await flowService.loadFlow(plubotId);

      // Validar integridad de edges antes de sanitización
      if (flowData.edges) {
        for (const edge of flowData.edges) {
          // Skip edges with missing required properties
          if (!edge.id || !edge.source || !edge.target) {
            continue;
          }
          // Skip edges with undefined handles
          if (
            edge.sourceHandle === 'undefined' ||
            edge.targetHandle === 'undefined'
          ) {
            continue;
          }
        }
      }

      const sanitizedData = sanitizeFlowState(flowData);

      // Validar que los nodos referenciados en edges existen
      const nodeIds = new Set(sanitizedData.nodes?.map((n) => n.id) || []);
      const invalidEdges =
        sanitizedData.edges?.filter(
          (edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target),
        ) || [];

      // Log invalid edges for debugging if needed
      if (invalidEdges.length > 0) {
        // Could add logging here in the future
      }

      // 3. Actualización atómica del estado con los datos cargados
      get().setEdges(sanitizedData.edges);
      set({
        nodes: sanitizedData.nodes, // Los nodos se pueden setear directamente
        viewport: sanitizedData.viewport,
        plubotId,
        isLoaded: true,
        hasChanges: false,
        flowName: flowData.name || 'Flujo sin título',
      });
    } catch (error) {
      logger.error('Error loading flow:', error);
      set({ loadError: true, isLoaded: false, flowName: 'Error al cargar' });
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
