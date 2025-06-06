import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import instance from '../utils/axiosConfig';
import { validateConnections, analyzeFlowRoutes, generateNodeSuggestions } from '@/utils/flowValidation';
import { prepareEdgesForSaving, backupEdgesToLocalStorage } from '../components/onboarding/flow-editor/utils/edgeFixUtil';

// Estado inicial
const initialState = {
  // Datos del plubot
  plubotData: null,
  isDataLoaded: false,
  isLoading: false,
  error: null,
  
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
  selectedConnection: null,
  connectionProperties: {},
  routeAnalysisData: null,
  nodeSuggestions: [],
  importData: '',
  exportFormat: 'json',
  
  // Mensajes y notificaciones
  byteMessage: '',
  lastSavedTimestamp: null,
};

// Crear el store de Zustand
const useTrainingStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Acciones para datos del plubot
      setPlubotData: (data) => set({ plubotData: data }),
      setIsDataLoaded: (isLoaded) => set({ isDataLoaded: isLoaded }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // Acciones para estados de UI
      setShowSimulation: (show) => set({ showSimulation: show }),
      toggleSimulation: () => set((state) => ({ showSimulation: !state.showSimulation })),
      setShowTemplateSelector: (show) => set({ showTemplateSelector: show }),
      setShowExportMode: (show) => set({ showExportMode: show }),
      setShowConnectionEditor: (show) => set({ showConnectionEditor: show }),
      setShowRouteAnalysis: (show) => set({ showRouteAnalysis: show }),
      setShowVersionHistoryPanel: (show) => set({ showVersionHistoryPanel: show }),
      setShowSuggestionsModal: (show) => set({ showSuggestionsModal: show }),
      setShowEmbedModal: (show) => set({ showEmbedModal: show }),
      
      // Acciones para los botones del EpicHeader
      openShareModal: () => {
        set({ showEmbedModal: true });
        set({ byteMessage: '🔗 Comparte tu Plubot con otros' });
      },
      openSimulateModal: () => {
        set({ showSimulation: true });
        set({ byteMessage: '🎮 Modo simulación activado' });
      },
      openTemplatesModal: () => {
        set({ showTemplateSelector: true });
        set({ byteMessage: '📋 Selecciona una plantilla para tu flujo' });
      },
      openHistoryPanel: () => {
        set({ showVersionHistoryPanel: true });
        set({ byteMessage: '🗓 Historial de versiones de tu flujo' });
      },
      openSettingsModal: () => {
        set({ showExportMode: true });
        set({ byteMessage: '⚙️ Configura tu flujo o exporta/importa datos' });
      },
      
      // Acciones para modales
      setSelectedConnection: (connection) => set({ selectedConnection: connection }),
      setConnectionProperties: (props) => set({ connectionProperties: props }),
      setRouteAnalysisData: (data) => set({ routeAnalysisData: data }),
      setNodeSuggestions: (suggestions) => set({ nodeSuggestions: suggestions }),
      setImportData: (data) => set({ importData: data }),
      setExportFormat: (format) => set({ exportFormat: format }),
      
      // Acciones para mensajes
      setByteMessage: (message) => {
        // Determinar si el mensaje debe ir a StatusBubble o ByteAssistant
        // Los mensajes de operaciones, confirmaciones y errores van a StatusBubble
        // Los mensajes informativos y conversacionales van a ByteAssistant
        const isStatusMessage = (
          /[\u2705\u274C\u26A0\uFE0F]/.test(message) || // Emojis de verificación, error o advertencia
          /guardado|guardando|error|cargando|generando|completado|actualizado|eliminado|creado|listo/i.test(message)
        );
        
        // Establecer el mensaje en el store para que lo recoja el componente adecuado
        set({ byteMessage: message });
        
        // Devolver true si el mensaje fue enviado a StatusBubble para fines de debugging
        return isStatusMessage;
      },
      clearByteMessage: () => set({ byteMessage: '' }),
      setLastSavedTimestamp: () => set({ lastSavedTimestamp: new Date().toISOString() }),
      
      // Acciones compuestas
      closeAllModals: () => set({
        showTemplateSelector: false,
        showExportMode: false,
        showConnectionEditor: false,
        showRouteAnalysis: false,
        showSuggestionsModal: false,
        showEmbedModal: false,
      }),
      
      // Acciones para validación de flujo
      validateConnections: async (nodes, edges) => {
        const validationResult = validateConnections(nodes, edges);
        set({ byteMessage: validationResult.message });
        return validationResult;
      },
      
      analyzeFlowRoutes: async (nodes, edges) => {
        const routeAnalysis = analyzeFlowRoutes(nodes, edges);
        set({ 
          routeAnalysisData: routeAnalysis,
          showRouteAnalysis: true 
        });
        return routeAnalysis;
      },
      
      generateNodeSuggestions: async (nodes, edges) => {
        const suggestions = generateNodeSuggestions(nodes, edges);
        set({ 
          nodeSuggestions: suggestions,
          showSuggestionsModal: true 
        });
        return suggestions;
      },
      
      // Acciones para cargar/guardar datos
      loadPlubotData: async (plubotId) => {
        if (!plubotId) {
          console.error('Error: Se intentó cargar un plubot sin ID');
          set({ 
            error: 'ID del plubot no válido',
            isLoading: false 
          });
          return null;
        }
        
        set({ isLoading: true, error: null });
        try {
          console.log('[TrainingStore] Cargando plubot con ID:', plubotId);
          
          // Usar la instancia configurada de Axios que ya maneja la autenticación
          const response = await instance.get(`/api/plubots/${plubotId}`);
          
          if (response.data) {
            console.log('[TrainingStore] Datos del plubot cargados:', response.data);
            set({ 
              plubotData: response.data,
              isDataLoaded: true,
              isLoading: false 
            });
            return response.data;
          }
        } catch (error) {
          console.error('Error loading plubot data:', error);
          set({ 
            error: error.message || 'Error al cargar los datos del plubot',
            isLoading: false 
          });
        }
        return null;
      },
      
      saveFlowData: async (plubotId, nodes, edges, name) => {
        if (!plubotId) {
          console.error('Error: Se intentó guardar un flujo sin ID de plubot');
          set({ 
            error: 'ID del plubot no válido',
            isLoading: false 
          });
          return null;
        }
        
        set({ isLoading: true, error: null });
        try {
          // Preparar los datos para guardar
          const processedNodes = [...nodes];
          const processedEdges = prepareEdgesForSaving(edges);
          
          // Hacer backup de las aristas en localStorage
          backupEdgesToLocalStorage(edges, plubotId);
          
          console.log('[TrainingStore] Guardando flujo para plubot ID:', plubotId);
          
          const payload = {
            name: name || get().plubotData?.name || 'Sin nombre',
            nodes: processedNodes,
            edges: processedEdges,
          };
          
          // Usar la instancia configurada de Axios que ya maneja la autenticación
          const response = await instance.post(`/api/plubots/${plubotId}/flow`, payload);
          
          if (response.data) {
            // Actualizar el estado con los datos guardados
            set({ 
              plubotData: {
                ...get().plubotData,
                ...response.data,
              },
              byteMessage: '💾 Flujo guardado correctamente',
              lastSavedTimestamp: new Date().toISOString(),
              isLoading: false 
            });
            
            // Limpiar el mensaje después de 3 segundos
            setTimeout(() => {
              set((state) => {
                if (state.byteMessage === '💾 Flujo guardado correctamente') {
                  return { byteMessage: '' };
                }
                return state;
              });
            }, 3000);
            
            return response.data;
          }
        } catch (error) {
          console.error('Error saving flow data:', error);
          set({ 
            error: error.message || 'Error al guardar los datos del flujo',
            byteMessage: '❌ Error al guardar el flujo',
            isLoading: false 
          });
        }
        return null;
      },
      
      // Resetear al estado inicial
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
    }
  )
);

export default useTrainingStore;
