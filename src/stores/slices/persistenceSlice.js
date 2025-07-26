import { debounce } from 'lodash';

import { sanitizeFlowState } from '@/components/onboarding/flow-editor/utils/flow-sanitizer';
import { flowStateManager } from '@/components/onboarding/flow-editor/utils/flowCacheManager';
import flowService from '@/services/flowService';

import logger from '../../services/loggerService';

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
    // 1. Limpieza síncrona: Prepara el store para la nueva carga
    get().clearHistory();
    set(prepareLoadingState());

    try {
      // 2. Carga asíncrona de datos
      const flowData = await flowService.loadFlow(plubotId);

      // 3. Validar integridad de edges y sanitizar datos
      const validatedEdges = validateEdgesIntegrity(flowData.edges);
      const sanitizedData = sanitizeFlowState({
        ...flowData,
        edges: validatedEdges,
      });

      // 4. Validar referencias entre nodos y edges
      const { validEdges } = validateEdgeNodeReferences(
        sanitizedData.edges,
        sanitizedData.nodes,
      );

      // 5. Actualización atómica del estado
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
