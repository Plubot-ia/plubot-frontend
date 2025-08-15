import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import {
  validateConnections,
  analyzeFlowRoutes,
  generateNodeSuggestions,
} from '@/utils/flow-validation.js';

import instance from '../utils/axios-config';

// --- Constantes ---
const statusKeywords = [
  'guardado',
  'guardando',
  'error',
  'cargando',
  'generando',
  'completado',
  'actualizado',
  'eliminado',
  'creado',
  'listo',
];
// eslint-disable-next-line security/detect-non-literal-regexp
const STATUS_MESSAGE_REGEX = new RegExp(statusKeywords.join('|'), 'i');

// Estado inicial
const initialState = {
  // Datos del plubot
  plubotData: undefined,
  isDataLoaded: false,
  isLoading: false,
  error: undefined,

  // Estados de UI
  showSimulation: false,
  showTemplateSelector: false,
  showExportMode: false,
  showConnectionEditor: false,
  showRouteAnalysis: false,
  showVersionHistoryPanel: false,
  showSuggestionsModal: false,
  showEmbedModal: false,

  // Datos para modales
  selectedConnection: undefined,
  connectionProperties: {},
  routeAnalysisData: undefined,
  nodeSuggestions: [],
  importData: '',
  exportFormat: 'json',

  // Mensajes y notificaciones
  byteMessage: '',
  lastSavedTimestamp: undefined,
};

// --- Creadores de Acciones ---

const createDataActions = (set) => ({
  setPlubotData: (data) => set({ plubotData: data }),
  setIsDataLoaded: (isLoaded) => set({ isDataLoaded: isLoaded }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
});

const createUIActions = (set) => ({
  setShowSimulation: (show) => set({ showSimulation: show }),
  toggleSimulation: () => set((state) => ({ showSimulation: !state.showSimulation })),
  setShowTemplateSelector: (show) => set({ showTemplateSelector: show }),
  setShowExportMode: (show) => set({ showExportMode: show }),
  setShowConnectionEditor: (show) => set({ showConnectionEditor: show }),
  setShowRouteAnalysis: (show) => set({ showRouteAnalysis: show }),
  setShowVersionHistoryPanel: (show) => set({ showVersionHistoryPanel: show }),
  setShowSuggestionsModal: (show) => set({ showSuggestionsModal: show }),
  setShowEmbedModal: (show) => set({ showEmbedModal: show }),
  closeAllModals: () =>
    set({
      showTemplateSelector: false,
      showExportMode: false,
      showConnectionEditor: false,
      showRouteAnalysis: false,
      showSuggestionsModal: false,
      showEmbedModal: false,
    }),
});

const createModalActions = (set) => ({
  openShareModal: () => {
    set({
      showEmbedModal: true,
      byteMessage: '🔗 Comparte tu Plubot con otros',
    });
  },
  openSimulateModal: () => {
    set({ showSimulation: true, byteMessage: '🎮 Modo simulación activado' });
  },
  openTemplatesModal: () => {
    set({
      showTemplateSelector: true,
      byteMessage: '📋 Selecciona una plantilla para tu flujo',
    });
  },
  openHistoryPanel: () => {
    set({
      showVersionHistoryPanel: true,
      byteMessage: '🗓 Historial de versiones de tu flujo',
    });
  },
  openSettingsModal: () => {
    set({
      showExportMode: true,
      byteMessage: '⚙️ Configura tu flujo o exporta/importa datos',
    });
  },
  setSelectedConnection: (connection) => set({ selectedConnection: connection }),
  setConnectionProperties: (properties) => set({ connectionProperties: properties }),
  setRouteAnalysisData: (data) => set({ routeAnalysisData: data }),
  setNodeSuggestions: (suggestions) => set({ nodeSuggestions: suggestions }),
  setImportData: (data) => set({ importData: data }),
  setExportFormat: (format) => set({ exportFormat: format }),
});

const createMessageActions = (set) => ({
  setByteMessage: (message) => {
    // Determinar si el mensaje debe ir a StatusBubble o ByteAssistant
    // Los mensajes de operaciones, confirmaciones y errores van a StatusBubble
    if (STATUS_MESSAGE_REGEX.test(message)) {
      set({
        byteMessage: message,
        lastSavedTimestamp: new Date().toISOString(),
      });
    } else {
      // Otros mensajes van a ByteAssistant
      set({ byteMessage: message });
    }
  },
  clearByteMessage: () => set({ byteMessage: '' }),
  setLastSavedTimestamp: () => set({ lastSavedTimestamp: new Date().toISOString() }),
});

const createValidationActions = (set) => ({
  validateConnections: async (nodes, edges) => {
    const validationResult = validateConnections(nodes, edges);
    set({ byteMessage: validationResult.message });
    return validationResult;
  },
  analyzeFlowRoutes: async (nodes, edges) => {
    const routeAnalysis = analyzeFlowRoutes(nodes, edges);
    set({ routeAnalysisData: routeAnalysis, showRouteAnalysis: true });
    return routeAnalysis;
  },
  generateNodeSuggestions: async (nodes, edges) => {
    const suggestions = generateNodeSuggestions(nodes, edges);
    set({ nodeSuggestions: suggestions, showSuggestionsModal: true });
    return suggestions;
  },
});

const createAPIActions = (set, _get) => ({
  loadPlubotData: async (plubotId) => {
    if (!plubotId) {
      set({ error: 'ID del plubot no válido', isLoading: false });
      return;
    }
    set({ isLoading: true, error: undefined });
    try {
      const response = await instance.get(`/plubots/${plubotId}`);
      if (response.data) {
        set({
          plubotData: response.data,
          isDataLoaded: true,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: error.message || 'Error al cargar los datos del plubot',
        isLoading: false,
      });
    }
  },
});

// --- Store Principal ---

const useTrainingStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      ...createDataActions(set),
      ...createUIActions(set),
      ...createModalActions(set),
      ...createMessageActions(set),
      ...createValidationActions(set),
      ...createAPIActions(set, get),
      reset: () => set(initialState),
    }),
    {
      name: 'training-screen-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        plubotData: state.plubotData,
        isDataLoaded: state.isDataLoaded,
        showSimulation: state.showSimulation,
        showVersionHistoryPanel: state.showVersionHistoryPanel,
      }),
    },
  ),
);

export default useTrainingStore;
