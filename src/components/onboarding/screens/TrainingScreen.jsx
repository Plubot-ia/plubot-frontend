import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import '@/assets/css/hide-watermark.css';
import { usePlubotCreation } from '@/context/PlubotCreationContext';
import { useGamification } from '@/context/GamificationContext';
import useAPI from '@/hooks/useAPI';
import { analyzeFlowRoutes, generateNodeSuggestions } from '@/utils/flowValidation';
import useDebounce from '@/hooks/useDebounce';
import { NODE_TYPES } from '@/utils/nodeConfig'; // Importación añadida para identificar DecisionNodes

// Zustand stores
import useFlowStore from '@/stores/useFlowStore';
import useTrainingStore from '@/stores/useTrainingStore';

// Componentes de carga inmediata
import FlowEditor from '../flow-editor/FlowEditor.jsx';
import EpicHeader from '../common/EpicHeader';
import StatusBubble from '../common/StatusBubble';

// Componentes con lazy loading
const NodePalette = lazy(() => import('../common/NodePalette'));
const ByteAssistant = lazy(() => import('../common/ByteAssistant'));
const CustomMiniMap = lazy(() => import('../flow-editor/ui/CustomMiniMap'));
const ConnectionEditor = lazy(() => import('../simulation/ConnectionEditor'));


// Modales con lazy loading
const SuggestionsModal = lazy(() => import('../modals/SuggestionsModal'));
const ImportExportModal = lazy(() => import('../modals/ImportExportModal'));
const EmbedModal = lazy(() => import('../modals/EmbedModal'));
const TemplateSelector = lazy(() => import('../modals/TemplateSelector'));
const EmergencyRecovery = lazy(() => import('../flow-editor/components/EmergencyRecovery'));

// Utilidades
import { backupEdgesToLocalStorage } from '../flow-editor/utils/edgeFixUtil';
import { EDGE_COLORS } from '@/utils/nodeConfig';

// Componente Modal que renderiza un modal específico con envoltura consistente
const Modal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{title}</h2>
        <button onClick={onClose} className="modal-close-btn">×</button>
        {children}
      </div>
    </div>
  );
};

// Componente para gestionar todos los modales de la aplicación
const ModalManager = ({ modals, modalProps, onClose }) => {
  const closeModal = (modalName) => () => onClose(modalName);
  
  return (
    <>
      {modals.showConnectionEditor && (
        <ConnectionEditor
          connection={modalProps.selectedConnection}
          properties={modalProps.connectionProperties}
          onSave={modalProps.onSaveConnection}
          onClose={closeModal('showConnectionEditor')}
        />
      )}
      
      <Modal 
        title="Sugerencias de Nodos" 
        isOpen={modals.showSuggestionsModal} 
        onClose={closeModal('showSuggestionsModal')}
      >
        <SuggestionsModal
          suggestions={modalProps.nodeSuggestions}
          onClose={closeModal('showSuggestionsModal')}
          onAddNode={modalProps.onAddSuggestedNode}
        />
      </Modal>
      
      <Modal 
        title="Seleccionar Plantilla" 
        isOpen={modals.showTemplateSelector} 
        onClose={closeModal('showTemplateSelector')}
      >
        <TemplateSelector
          onSelectTemplate={modalProps.onSelectTemplate}
          onClose={closeModal('showTemplateSelector')}
        />
      </Modal>
      
      <Modal 
        title="Exportar Flujo" 
        isOpen={modals.showExportMode} 
        onClose={closeModal('showExportMode')}
      >
        <ImportExportModal
          nodes={modalProps.nodes}
          edges={modalProps.edges}
          format={modalProps.exportFormat}
          onClose={closeModal('showExportMode')}
        />
      </Modal>
      
      <Modal 
        title="Incrustar Plubot" 
        isOpen={modals.showEmbedModal} 
        onClose={closeModal('showEmbedModal')}
      >
        <EmbedModal
          nodes={modalProps.nodes}
          edges={modalProps.edges}
          onClose={closeModal('showEmbedModal')}
        />
      </Modal>
    </>
  );
};

// El custom hook useFlowEditor ha sido reemplazado por los stores de Zustand

// Función auxiliar para extraer el ID del plubot de la URL
const extractPlubotIdFromUrl = (searchParams, pathname) => {
  // Primero intenta obtener el ID de los parámetros de la URL
  let plubotId = searchParams.get('plubotId');
  
  // Si no hay ID en los parámetros, intenta obtenerlo de la ruta
  if (!plubotId) {
    const pathParts = pathname.split('/');
    const lastSegment = pathParts[pathParts.length - 1];
    
    if (lastSegment && !isNaN(parseInt(lastSegment))) {
      plubotId = lastSegment;
    }
  }
  
  // Verificar si tenemos un ID válido
  if (plubotId && !isNaN(parseInt(plubotId))) {
    return plubotId;
  }
  
  // ID por defecto para desarrollo
  console.warn('No se encontró un ID válido en la URL. Usando ID por defecto: 130');
  return '130';
};

const TrainingScreen = () => {
  // Hooks y contextos
  const [searchParams] = useSearchParams();
  const { pathname } = window.location;
  const navigate = useNavigate();
  const { plubotData, updatePlubotData } = usePlubotCreation();
  const { addXp, addPluCoins } = useGamification();
  const { request } = useAPI();
  
  // Referencias y estado local
  const nodeCounters = useRef({});
  const lastSignificantChange = useRef({ nodes: [], edges: [] });
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Extraer el ID del plubot
  const plubotIdFromUrl = extractPlubotIdFromUrl(searchParams, pathname);
  
  // Obtener el estado y las acciones de los stores de Zustand
  const {
    nodes,
    edges,
    flowName,
    plubotId,
    selectedNode,
    selectedEdge,
    isUltraMode,
    onNodesChange,
    setNodes,
    setEdges,
    setFlowName,
    setPlubotId: storeSetPlubotId,
    resetFlow,
    setSelectedNode,
    onEdgesChange,
    onConnect,
    toggleUltraMode,
    undo,
    redo,
    canUndo,
    canRedo,
    getVisibleNodeCount,
    isLoaded, // Nueva dependencia
  } = useFlowStore();
  
  const {
    isLoading,
    error,
    byteMessage,
    showSimulation,
    showTemplateSelector,
    showExportMode,
    showConnectionEditor,
    showRouteAnalysis,
    showVersionHistoryPanel,
    showSuggestionsModal,
    showEmbedModal,
    selectedConnection,
    connectionProperties,
    nodeSuggestions,
    routeAnalysisData,
    importData,
    exportFormat,
    setPlubotData,
    setIsLoading,
    setError,
    setByteMessage,
    setShowSimulation,
    setShowTemplateSelector,
    setShowExportMode,
    setShowConnectionEditor,
    setShowRouteAnalysis,
    setShowVersionHistoryPanel,
    setShowSuggestionsModal,
    setShowEmbedModal,
    setSelectedConnection,
    setConnectionProperties,
    setNodeSuggestions,
    setRouteAnalysisData,
    setImportData,
    setExportFormat,
    toggleSimulation,
    // Obtenemos las funciones originales, pero no las usaremos
    openShareModal: originalOpenShareModal,
    openSimulateModal: originalOpenSimulateModal,
    openTemplatesModal: originalOpenTemplatesModal,
    openSettingsModal: originalOpenSettingsModal
  } = useTrainingStore();

  // Estado local para el modal de recuperación y los datos del backup
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [emergencyBackupData, setEmergencyBackupData] = useState(null);
  const [hadBackup, setHadBackup] = useState(false); // Nuevo estado para rastrear si había backup
  const userJustDismissedModal = useRef(false); // Para evitar que el modal reaparezca instantáneamente

  // Reemplazamos con versiones stub que no hacen nada para evitar conflictos con GlobalProvider
  const openShareModal = useCallback(() => {
    console.log('[TrainingScreen] openShareModal: Usando GlobalProvider en su lugar');
  }, []);
  
  const openSimulateModal = useCallback(() => {
    console.log('[TrainingScreen] openSimulateModal: Usando GlobalProvider en su lugar');
  }, []);
  
  const openTemplatesModal = useCallback(() => {
    console.log('[TrainingScreen] openTemplatesModal: Usando GlobalProvider en su lugar');
  }, []);
  
  const openSettingsModal = useCallback(() => {
    console.log('[TrainingScreen] openSettingsModal: Usando GlobalProvider en su lugar');
  }, []);

  // Efecto para inicializar el estado con los datos del plubot
  useEffect(() => {
    const storeState = useFlowStore.getState();
    const currentPlubotIdInStore = storeState.plubotId;
    const currentFlowNameInStore = storeState.flowName;
    const currentNodesInStore = storeState.nodes;
    const currentIsLoadedInStore = storeState.isLoaded;
    const setFlowNameFromStore = storeState.setFlowName; // Para el Caso 2

    console.log(
      `[TrainingScreen] useEffect TRIGGERED. ` +
      `plubotIdFromUrl: ${plubotIdFromUrl}, plubotData?.name: ${plubotData?.name}, ` +
      `Store State Before Logic: plubotId: ${currentPlubotIdInStore}, flowName: '${currentFlowNameInStore}', ` +
      `isLoaded: ${currentIsLoadedInStore}, nodes.length: ${currentNodesInStore?.length}`
    );

    // Caso 1: Hay un ID en la URL, y (no está cargado O el ID de la URL es diferente al del store)
    if (plubotIdFromUrl && (!currentIsLoadedInStore || plubotIdFromUrl !== currentPlubotIdInStore)) {
      console.log(`[TrainingScreen] Case 1: Needs to load or Plubot ID changed. URL ID: ${plubotIdFromUrl}`);
      const targetFlowName = plubotData?.name || `Plubot ${plubotIdFromUrl}`; // Nombre inicial tentativo
      console.log(`[TrainingScreen] Case 1: Calculated targetFlowName: '${targetFlowName}'. Calling resetFlow with skipLoad: false.`);
      try {
        window.__allowResetFromTrainingScreenForNewPlubot = true;
        console.log('[TrainingScreen] FLAG SET: __allowResetFromTrainingScreenForNewPlubot = true (Case 1)');
        resetFlow(plubotIdFromUrl, targetFlowName, { skipLoad: false });
      } finally {
        window.__allowResetFromTrainingScreenForNewPlubot = false;
        console.log('[TrainingScreen] FLAG CLEARED: __allowResetFromTrainingScreenForNewPlubot = false (Case 1)');
      }
    }
    // Caso 2: El flujo se cargó, es el Plubot correcto, pero está vacío
    else if (plubotIdFromUrl === currentPlubotIdInStore && currentIsLoadedInStore && (!currentNodesInStore || currentNodesInStore.length === 0)) {
      console.log(`[TrainingScreen] Case 2: Loaded, correct Plubot, but empty. URL ID: ${plubotIdFromUrl}. Initializing with default nodes/edges.`);
      setNodes(initialNodes); 
      setEdges(initialEdges); // initialEdges ahora tiene 11 aristas base

      // Después de establecer los nodos iniciales y las aristas base,
      // llamar a generateOptionNodes para cada DecisionNode por defecto.
      // Esto poblará DecisionNode.data.conditions, creará OptionNodes si es necesario,
      // y generará las aristas entre DecisionNode y OptionNode (4 aristas adicionales).
      const decisionNodesInDefault = initialNodes.filter(
        node => node.type === NODE_TYPES.decision
      );

      if (decisionNodesInDefault.length > 0) {
        console.log(`[TrainingScreen] Case 2: Found ${decisionNodesInDefault.length} DecisionNode(s) in default set. Calling generateOptionNodes for each.`);
        decisionNodesInDefault.forEach(decisionNode => {
          console.log(`[TrainingScreen] Case 2: Calling generateOptionNodes for DecisionNode ID: ${decisionNode.id}`);
          useFlowStore.getState().generateOptionNodes(decisionNode.id);
        });
        console.log(`[TrainingScreen] Case 2: Finished calling generateOptionNodes for default DecisionNodes. Total edges should now be 15.`);
      } else {
        console.log(`[TrainingScreen] Case 2: No DecisionNodes found in the default set. Skipping generateOptionNodes.`);
      }
      
      // Actualizar el nombre si el actual no es descriptivo para un flujo vacío inicializado.
      const currentStoreFlowName = useFlowStore.getState().flowName;
      const genericEmptyNamePattern = `Nuevo Flujo para ${plubotIdFromUrl}`;
      const errorNamePattern = `Error al cargar ${plubotIdFromUrl}`;
      
      if (
        currentStoreFlowName === 'Flujo sin título' || 
        currentStoreFlowName === genericEmptyNamePattern || 
        currentStoreFlowName === errorNamePattern || // Cubrir el caso donde loadFlow falló pero isLoaded es true
        (plubotData?.name && currentStoreFlowName !== plubotData.name) // Si tenemos un nombre mejor en plubotData
      ) {
        const newNameForEmpty = plubotData?.name || `Plubot ${plubotIdFromUrl}`;
        if (currentStoreFlowName !== newNameForEmpty) {
          console.log(`[TrainingScreen] Case 2: Updating flow name from '${currentStoreFlowName}' to '${newNameForEmpty}' for empty loaded flow.`);
          setFlowName(newNameForEmpty); 
        }
      }
    }
    // Caso 3: El flujo ya está cargado, es el Plubot correcto y tiene contenido
    else if (plubotIdFromUrl === currentPlubotIdInStore && currentIsLoadedInStore && currentNodesInStore && currentNodesInStore.length > 0) {
      console.log(`[TrainingScreen] Case 3: Already loaded, correct Plubot, has content. URL ID: ${plubotIdFromUrl}. No action needed here.`);
      // No es necesario hacer nada aquí, el flujo ya está como debería.
      // Asegurarse de que el nombre sea correcto si plubotData tiene uno más reciente (ej. después de crear y guardar)
      if (plubotData?.name && plubotData.name !== currentFlowNameInStore) {
        console.log(`[TrainingScreen] Case 3: plubotData.name ('${plubotData.name}') differs from store name ('${currentFlowNameInStore}'). Updating store name.`);
        setFlowNameFromStore(plubotData.name);
      }
    }
    // Caso 4: No hay ID en la URL (ej. creando un flujo nuevo desde cero sin un ID predefinido)
    else if (!plubotIdFromUrl) {
      console.log(`[TrainingScreen] Case 4: No plubotIdFromUrl. Resetting to 'Flujo sin título'.`);
      try {
        window.__allowResetFromTrainingScreenForNewPlubot = true;
        console.log('[TrainingScreen] FLAG SET: __allowResetFromTrainingScreenForNewPlubot = true (Case 4)');
        resetFlow(null, 'Flujo sin título', { skipLoad: true });
      } finally {
        window.__allowResetFromTrainingScreenForNewPlubot = false;
        console.log('[TrainingScreen] FLAG CLEARED: __allowResetFromTrainingScreenForNewPlubot = false (Case 4)');
      }
    }

    // Limpieza del efecto
  }, [
    plubotIdFromUrl,
    plubotId, // de useFlowStore
    isLoaded, // de useFlowStore
    nodes.length,    // de useFlowStore
    flowName, // de useFlowStore
    resetFlow, // acción de useFlowStore
    setNodes,  // acción de useFlowStore
    setEdges,  // acción de useFlowStore
    setFlowName, // acción de useFlowStore
    plubotData, // de usePlubotCreation context
    // initialNodes e initialEdges son estables (definidos como const arrays en el scope del componente)
    // por lo que no son estrictamente necesarios como dependencias si no cambian.
    // Si fueran props o estado, o se recrearan en cada render, sí serían necesarios.
  ]);

  // Estado local simplificado para mantener compatibilidad con el código existente
  const [state, setState] = useState({
    notification: null,
    errorMessage: null,
    isDataLoaded: false,
    isGenerating: false,
    flowStyles: { edgeStyles: { strokeWidth: 2, stroke: '#00e0ff', animated: false } }
  });
  
  // Propiedades de conexión por defecto - extraídas para mejorar legibilidad
  const defaultConnectionProperties = {
    animated: false,
    label: '',
    style: { stroke: '#00e0ff', strokeWidth: 2, strokeDasharray: '' },
    type: 'default'
  };
  
  // Ruta de análisis por defecto - extraída para mejorar legibilidad
  const defaultRouteAnalysis = { routes: [], errors: [] };

  // Nodos iniciales para el editor de flujo
  // Helper para generar IDs únicos simples para condiciones, en un contexto real se usaría algo más robusto como UUID
  const generateLocalId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

  const initialNodes = [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 250, y: 5 },
      data: { label: 'Inicio' },
    },
    {
      id: 'message-1',
      type: 'message',
      position: { x: 250, y: 100 },
      data: { label: 'Mensaje 1', message: '¡Hola! ¿En qué puedo ayudarte?' },
    },
    {
      id: 'decision-1',
      type: 'decision',
      position: { x: 250, y: 200 },
      data: {
        label: 'Decisión 1',
        question: '¿Qué quieres hacer?',
        conditions: [
          { id: 'd1-cond-0', text: 'Información', optionNodeId: 'option-1' },
          { id: 'd1-cond-1', text: 'Ayuda', optionNodeId: 'option-2' }
        ]
      },
    },
    {
      id: 'option-1',
      type: 'option',
      position: { x: 100, y: 300 },
      data: { label: 'Opción 1', condition: 'Información', sourceDecisionNode: 'decision-1', conditionId: 'd1-cond-0' },
    },
    {
      id: 'option-2',
      type: 'option',
      position: { x: 400, y: 300 },
      data: { label: 'Opción 2', condition: 'Ayuda', sourceDecisionNode: 'decision-1', conditionId: 'd1-cond-1' },
    },
    {
      id: 'action-1',
      type: 'action',
      position: { x: 100, y: 400 },
      data: { label: 'Acción 1', description: 'Mostrar información' },
    },
    {
      id: 'action-2',
      type: 'action',
      position: { x: 400, y: 400 },
      data: { label: 'Acción 2', description: 'Proporcionar ayuda' },
    },
    {
      id: 'message-2',
      type: 'message',
      position: { x: 100, y: 500 },
      data: { label: 'Mensaje 2', message: 'Aquí tienes la información solicitada.' },
    },
    {
      id: 'message-3',
      type: 'message',
      position: { x: 400, y: 500 },
      data: { label: 'Mensaje 3', message: 'Estoy aquí para ayudarte.' },
    },
    {
      id: 'decision-2',
      type: 'decision',
      position: { x: 250, y: 600 },
      data: {
        label: 'Decisión 2',
        question: '¿Necesitas algo más?',
        conditions: [
          { id: 'd2-cond-0', text: 'Sí', optionNodeId: 'option-3' },
          { id: 'd2-cond-1', text: 'No', optionNodeId: 'option-4' }
        ]
      },
    },
    {
      id: 'option-3',
      type: 'option',
      position: { x: 100, y: 700 },
      data: { label: 'Opción 3', condition: 'Sí', sourceDecisionNode: 'decision-2', conditionId: 'd2-cond-0' },
    },
    {
      id: 'option-4',
      type: 'option',
      position: { x: 400, y: 700 },
      data: { label: 'Opción 4', condition: 'No', sourceDecisionNode: 'decision-2', conditionId: 'd2-cond-1' },
    },
    {
      id: 'message-4',
      type: 'message',
      position: { x: 100, y: 800 },
      data: { label: 'Mensaje 4', message: '¿En qué más puedo ayudarte?' },
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 100, y: 900 },
      data: { label: 'Fin 1', endMessage: 'Gracias por usar nuestro servicio.' },
    },
    {
      id: 'end-2',
      type: 'end',
      position: { x: 400, y: 800 },
      data: { label: 'Fin 2', endMessage: '¡Hasta pronto!' },
    },
  ];

  // Aristas iniciales para el editor de flujo
  const initialEdges = [
    { id: 'e1', source: 'start-1', target: 'message-1', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e2', source: 'message-1', target: 'decision-1', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    // e3 (decision-1 to option-1) será generado por generateOptionNodes
    // e4 (decision-1 to option-2) será generado por generateOptionNodes
    { id: 'e5', source: 'option-1', target: 'action-1', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e6', source: 'option-2', target: 'action-2', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e7', source: 'action-1', target: 'message-2', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e8', source: 'action-2', target: 'message-3', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e9', source: 'message-2', target: 'decision-2', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e10', source: 'message-3', target: 'decision-2', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    // e11 (decision-2 to option-3) será generado por generateOptionNodes
    // e12 (decision-2 to option-4) será generado por generateOptionNodes
    { id: 'e13', source: 'option-3', target: 'message-4', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e14', source: 'message-4', target: 'end-1', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e15', source: 'option-4', target: 'end-2', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
  ];

  // Inicializar los nodos y aristas en el store de Zustand solo al cargar por primera vez
  // NOTA: Revisar si este useEffect sigue siendo necesario o si su lógica se solapa
  // con el nuevo useEffect de carga de flujo (especialmente el Caso 2).
  // Podría ser redundante o necesitar ajustes.
  const initialSetupDoneRef = useRef(false);
  
  useEffect(() => {
    if (initialSetupDoneRef.current) {
      return; // Evitar que se ejecute múltiples veces si las dependencias cambian por otras razones
    }

    const storeNodesEmpty = !nodes || nodes.length === 0;
    const storeEdgesEmpty = !edges || edges.length === 0;

    if (storeNodesEmpty && storeEdgesEmpty) {
      console.log('[TrainingScreen] Initial Setup: Setting initial nodes.');
      setNodes(initialNodes);
      // No marcar initialSetupDoneRef.current = true aquí todavía.
      // El efecto se volverá a ejecutar cuando 'nodes' cambie.
    } else if (!storeNodesEmpty && storeEdgesEmpty) {
      // Esta condición se cumplirá después de que setNodes haya actualizado el store y el efecto se reejecute.
      console.log('[TrainingScreen] Initial Setup: Nodes are set. Now setting initial edges.');
      setEdges(initialEdges);
      initialSetupDoneRef.current = true; // Marcar la configuración inicial como completada.
    } else if (!storeNodesEmpty && !storeEdgesEmpty) {
      // Si tanto nodos como aristas ya están presentes (ej. HMR, o ya se configuraron)
      console.log('[TrainingScreen] Initial Setup: Nodes and edges already present or set.');
      initialSetupDoneRef.current = true;
    }
  }, [nodes.length, edges, setNodes, setEdges, initialNodes, initialEdges]); // initialNodes e initialEdges deben ser estables

  useEffect(() => {
    document.body.classList.add('training-screen');
    return () => document.body.classList.remove('training-screen');
  }, []);

  const handleError = useCallback((errorMsg, consoleError = null) => {
    setByteMessage(`⚠️ Error: ${errorMsg}`);
    if (consoleError && process.env.NODE_ENV === 'development') {
      console.error(consoleError);
    }
  }, [setByteMessage]);
  
  /**
   * Verifica las precondiciones necesarias para guardar el flujo
   * @returns {boolean} true si se cumplen todas las precondiciones, false en caso contrario
   */
  const checkSavePrerequisites = useCallback(() => {
    // Verificar si ya hay un guardado en progreso
    if (isSaving) {
      console.log('[TrainingScreen] Ya hay un guardado en progreso');
      return false;
    }
    
    // Verificar si los datos del plubot están cargados
    const isDataLoaded = plubotData && Object.keys(plubotData).length > 0;
    if (!isDataLoaded) {
      setByteMessage('⏳ Datos aún cargando, espera un momento antes de guardar.');
      return false;
    }
    
    // Verificar si hay nodos para guardar
    if (!nodes.length) {
      setByteMessage('⚠️ No hay nodos en el editor');
      return false;
    }
    
    // Verificar si tenemos la función para actualizar datos y el ID del plubot
    if (!updatePlubotData || !plubotIdFromUrl) {
      console.error('Falta updatePlubotData o plubotIdFromUrl:', { updatePlubotData: !!updatePlubotData, plubotIdFromUrl });
      setByteMessage('⚠️ Error al guardar: falta el ID del Plubot.');
      return false;
    }
    
    return true;
  }, [isSaving, nodes.length, plubotData, plubotIdFromUrl, updatePlubotData, setByteMessage]);
  
  /**
   * Resuelve etiquetas duplicadas en los nodos
   * @param {Array} processedNodes - Los nodos a procesar
   * @returns {Array} Los nodos con etiquetas únicas
   */
  const resolveDuplicateLabels = useCallback((processedNodes) => {
    // Extraer mensajes de usuario de los nodos
    const userMessages = processedNodes.map((node, index) => ({
      user_message: node.data?.label || `Nodo ${index + 1}`,
      position: index,
      nodeId: node.id
    }));
    
    // Identificar duplicados
    const duplicates = userMessages.reduce((acc, curr, index, arr) => {
      const isDuplicated = arr.some(
        (other, otherIndex) => otherIndex !== index && other.user_message.toLowerCase() === curr.user_message.toLowerCase()
      );
      if (isDuplicated) acc.push(curr.user_message);
      return acc;
    }, []);
    
    // Si no hay duplicados, devolver los nodos originales
    if (duplicates.length === 0) return processedNodes;
    
    // Resolver duplicados
    setByteMessage(`⚠️ Hay mensajes duplicados. Resolviendo...`);
    
    const newNodes = [...processedNodes];
    const usedLabels = new Set(processedNodes.map(n => 
      n.data?.label ? n.data.label.toLowerCase() : `node-${n.id}`
    ));
    
    // Crear etiquetas únicas para los duplicados
    duplicates.forEach(duplicate => {
      const nodeIndex = newNodes.findIndex(n => n.data?.label === duplicate);
      if (nodeIndex !== -1) {
        let newLabel = duplicate;
        let counter = 1;
        
        while (usedLabels.has(newLabel.toLowerCase())) {
          newLabel = `${duplicate}-${counter}`;
          counter++;
        }
        
        usedLabels.add(newLabel.toLowerCase());
        
        if (newNodes[nodeIndex]) {
          newNodes[nodeIndex] = { 
            ...newNodes[nodeIndex], 
            data: { ...newNodes[nodeIndex].data, label: newLabel } 
          };
        }
      }
    });
    
    // Actualizar nodos con nombres únicos
    onNodesChange(newNodes.map((node, index) => ({
      type: 'replace',
      item: node,
      index
    })));
    
    console.log('[TrainingScreen] Duplicados resueltos');
    return newNodes;
  }, [onNodesChange, setByteMessage]);
  
  /**
   * Elimina nodos con IDs duplicados y asegura que las aristas sean válidas
   * @param {Array} updatedNodes - Los nodos a procesar
   * @returns {Object} Objeto con nodos y aristas válidos
   */
  const validateNodesAndEdges = useCallback((updatedNodes) => {
    // Eliminar nodos con IDs duplicados
    const uniqueNodes = [];
    const nodeIds = new Set();
    
    for (const node of updatedNodes) {
      if (!nodeIds.has(node.id)) {
        nodeIds.add(node.id);
        uniqueNodes.push(node);
      } else {
        console.warn(`[TrainingScreen] Nodo duplicado encontrado y eliminado: ${node.id}`);
      }
    }
    
    // Validar que cada arista tenga nodos fuente y destino existentes
    const validEdges = edges.filter(edge => {
      const isValid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
      if (!isValid) {
        console.warn(`[TrainingScreen] Arista inválida eliminada: ${edge.id} (${edge.source} → ${edge.target})`);
      }
      return isValid;
    });
    
    return { uniqueNodes, validEdges };
  }, [edges]);
  
  /**
   * Crea un backup local de los nodos y aristas
   * @param {Array} nodes - Los nodos a respaldar
   * @param {Array} edges - Las aristas a respaldar
   * @returns {string} El ID del backup creado
   */
  const createLocalBackup = useCallback((nodes, edges) => {
    const backupId = `backup_${plubotIdFromUrl}_${Date.now()}`;
    
    try {
      localStorage.setItem(backupId, JSON.stringify({
        nodes,
        edges,
        flowName: flowName || 'Flujo sin título',
        timestamp: Date.now()
      }));
      console.log(`[TrainingScreen] Backup local creado: ${backupId}`);
      return backupId;
    } catch (storageError) {
      console.warn('[TrainingScreen] No se pudo crear backup local:', storageError);
      return null;
    }
  }, [plubotIdFromUrl, flowName]);
  
  // Función principal para guardar el flujo
  const handleSaveFlow = useCallback(async () => {
    // Verificar precondiciones
    if (!checkSavePrerequisites()) {
      return false;
    }
    
    // Iniciar proceso de guardado
    setIsSaving(true);
    setByteMessage('💾 Guardando flujo...');

    try {
      // Hacer backup de aristas en localStorage
      if (edges && edges.length > 0) {
        backupEdgesToLocalStorage(edges);
      }
      
      // Copia profunda de nodos para evitar mutaciones
      const processedNodes = JSON.parse(JSON.stringify(nodes));
      
      // Resolver etiquetas duplicadas
      const nodesWithUniqueLabels = resolveDuplicateLabels(processedNodes);
      
      // Validar nodos y aristas
      const { uniqueNodes, validEdges } = validateNodesAndEdges(nodesWithUniqueLabels);
      
      // Crear backup local
      const backupId = createLocalBackup(uniqueNodes, validEdges);
      
      // Enviar datos al backend
      const response = await updatePlubotData({
        ...plubotData,
        flowData: {
          nodes: uniqueNodes,
          edges: validEdges,
          flowName: flowName || 'Flujo sin título'
        }
      });
      
      // Manejar la respuesta
      if (response && response.status === 'success') {
        setByteMessage('✅ Flujo guardado correctamente');
        setHasPendingChanges(false);
        
        // Limpiar backup después de 1 minuto si el guardado fue exitoso
        if (backupId) {
          setTimeout(() => {
            try {
              localStorage.removeItem(backupId);
            } catch (e) {
              console.warn('[TrainingScreen] Error al eliminar backup:', e);
            }
          }, 60000);
        }
        
        return true;
      } else {
        setByteMessage(`❌ Error al guardar: ${response?.error || 'Error desconocido'}`);
        return false;
      }
    } catch (error) {
      console.error('[TrainingScreen] Error al guardar el flujo:', error);
      setByteMessage(`❌ Error al guardar: ${error.message || 'Error desconocido'}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    checkSavePrerequisites,
    resolveDuplicateLabels,
    validateNodesAndEdges,
    createLocalBackup,
    nodes, edges, plubotData, plubotIdFromUrl, updatePlubotData,
    setByteMessage, setHasPendingChanges, setIsSaving,
    flowName, backupEdgesToLocalStorage
  ]);

  // Mantener compatibilidad con el código existente
async function saveFlowData() {
  return handleSaveFlow();
}
  
  // Función para manejar el deshacer (undo)
  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);
  
  // Función para manejar el rehacer (redo)
  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);
  
  // Función para alternar el modo ultra
  const handleToggleUltraMode = useCallback(() => {
    toggleUltraMode();
  }, [toggleUltraMode]);
  
  // Función para alternar el modo de simulación
  const handleToggleSimulation = useCallback(() => {
    toggleSimulation();
  }, [toggleSimulation]);
  
  // Función para manejar la importación desde el store
  const handleImportFromStore = useCallback((data) => {
    setImportData(data);
  }, [setImportData]);
  
  // Función para manejar la exportación desde el store
  const handleExportFromStore = useCallback((format) => {
    setExportFormat(format);
    setShowExportMode(true);
  }, [setExportFormat, setShowExportMode]);
  
  // Custom debounce hook
  const debouncedSave = useDebounce(handleSaveFlow, 10000); // 10 seconds
  
  // Función para actualizar el estado del componente cuando cambian los nodos o aristas
  useEffect(() => {
    // Comprobar que nodes y edges existen y son arrays antes de acceder a length
    const hasNodes = nodes && Array.isArray(nodes) && nodes.length > 0;
    const hasEdges = edges && Array.isArray(edges) && edges.length > 0;
    
    if (hasNodes || hasEdges) {
      // Guardar automáticamente cuando hay cambios significativos
      debouncedSave();
    }
  }, [nodes.length, edges, debouncedSave]);
  
  // Función para cerrar todos los modales (mantiene compatibilidad con código existente)
  // pero NO cierra los modales gestionados por GlobalProvider
  const closeAllModals = () => {
    // IMPORTANTE: Solo cerrar modales que NO estén gestionados por GlobalProvider
    // para evitar conflictos y modales fantasma
    
    // Modales específicos de TrainingScreen que se mantienen
    setShowConnectionEditor(false);
    setShowRouteAnalysis(false);
    setShowVersionHistoryPanel(false);
    
    // Los siguientes modales ahora son gestionados por GlobalProvider
    // por lo que NO los cerramos aquí para evitar conflictos
    // setShowSimulation(false);
    // setShowSuggestionsModal(false);
    // setShowTemplateSelector(false);  
    // setShowExportMode(false);
    // setShowEmbedModal(false);
    
    console.log('[TrainingScreen] closeAllModals: Cerrando solo modales no gestionados por GlobalProvider');
  };
  
  // Registrar/desregistrar la función closeAllModals globalmente para EpicHeader
  useEffect(() => {
    // Usar una variable temporal para evitar problemas de clausura
    const closeAllModalsFn = closeAllModals;
    window.closeAllModals = closeAllModalsFn;
    
    return () => {
      // Limpiar solo si no ha cambiado
      if (window.closeAllModals === closeAllModalsFn) {
        window.closeAllModals = null;
      }
    };
  }, [closeAllModals]);

  // Componente para gestionar los modales usando el componente Modal
  // IMPORTANTE: Este renderModals SOLO muestra modales que NO son gestionados por GlobalProvider
  const renderModals = useCallback(() => {
    // Definir solo los modales que NO están gestionados por GlobalProvider
    const modalConfigs = [
      // Estos modales son específicos de TrainingScreen y se mantienen
      {
        title: "Editor de Conexión",
        isOpen: showConnectionEditor,
        onClose: () => setShowConnectionEditor(false)
      },
      {
        title: "Análisis de Rutas",
        isOpen: showRouteAnalysis,
        onClose: () => setShowRouteAnalysis(false)
      },
      {
        title: "Historial de Versiones",
        isOpen: showVersionHistoryPanel,
        onClose: () => setShowVersionHistoryPanel(false)
      }
      
      // Los siguientes modales NO deben incluirse aquí porque ya son
      // gestionados por GlobalProvider - esto evita los modales fantasma
    ];
    
    return (
      <>
        {modalConfigs.map((config, index) => (
          config.isOpen && (
            <Modal 
              key={`modal-${index}`}
              title={config.title}
              isOpen={config.isOpen}
              onClose={config.onClose}
            />
          )
        ))}
      </>
    );
  }, [
    // Solo incluir dependencias para modales que realmente renderizamos
    showConnectionEditor,
    showRouteAnalysis,
    showVersionHistoryPanel,
    setShowConnectionEditor,
    setShowRouteAnalysis,
    setShowVersionHistoryPanel
  ]);

  const handleRecoverNodes = () => {
    const currentPlubotId = useFlowStore.getState().plubotId;
    console.log(`[TrainingScreen] handleRecoverNodes called for plubotId: ${currentPlubotId}`);
    if (emergencyBackupData && emergencyBackupData.nodes && emergencyBackupData.edges) {
      console.log(`[TrainingScreen] Restoring ${emergencyBackupData.nodes.length} nodes and ${emergencyBackupData.edges.length} edges from emergency backup data.`);
      useFlowStore.getState().setNodes(emergencyBackupData.nodes);
      useFlowStore.getState().setEdges(emergencyBackupData.edges);
      // Considerar limpiar el backup de localStorage aquí si se desea que solo se use una vez
      // localStorage.removeItem(`plubot-nodes-emergency-backup-${currentPlubotId}`);
      // setHadBackup(false); // Actualizar estado si se limpia el backup
    } else {
      console.warn('[TrainingScreen] No valid emergency backup data found in state to restore.');
    }
  };

  const handleDismissRecovery = () => {
    const currentPlubotId = useFlowStore.getState().plubotId;
    const targetFlowName = useFlowStore.getState().flowName || `Plubot ${currentPlubotId}`;
    console.log(`[TrainingScreen] handleDismissRecovery called for plubotId: ${currentPlubotId}. Had backup: ${hadBackup}`);
    
    const emergencyBackupKey = `plubot-nodes-emergency-backup-${currentPlubotId}`;
    localStorage.removeItem(emergencyBackupKey);
    setEmergencyBackupData(null);
    setHadBackup(false); // Importante: actualizar el estado

    // Siempre resetear a un flujo limpio (con nodos por defecto) al descartar, 
    // independientemente de si había un backup o no, porque el usuario eligió no restaurar o no había nada que restaurar.
    console.log('[TrainingScreen] Reseteando flujo a estado por defecto.');
    useFlowStore.getState().resetFlow(currentPlubotId, targetFlowName, { skipLoad: false, forceDefaultNodes: true });
  };

  // Wrappers para las acciones del modal EmergencyRecovery
  const wrappedHandleRecoverNodes = () => {
    userJustDismissedModal.current = true;
    setShowRecoveryModal(false);
    handleRecoverNodes();
  };

  const wrappedHandleDismissRecovery = () => {
    userJustDismissedModal.current = true;
    setShowRecoveryModal(false);
    handleDismissRecovery();
  };

  useEffect(() => {
    const currentPlubotId = useFlowStore.getState().plubotId;
    if (!currentPlubotId) return; // No hacer nada si no hay plubotId

    const allNodes = useFlowStore.getState().nodes;
    const emergencyBackupKey = `plubot-nodes-emergency-backup-${currentPlubotId}`;
    const backupJson = localStorage.getItem(emergencyBackupKey);
    
    let localEmergencyBackupData = null;
    let localHadBackup = false;

    if (backupJson) {
      try {
        localEmergencyBackupData = JSON.parse(backupJson);
        if (localEmergencyBackupData && localEmergencyBackupData.nodes && localEmergencyBackupData.edges) {
          localHadBackup = true;
        }
      } catch (error) {
        console.error('[TrainingScreen] Error al parsear emergency backup data:', error);
        localStorage.removeItem(emergencyBackupKey); // Eliminar backup corrupto
      }
    }
    
    setEmergencyBackupData(localEmergencyBackupData);
    setHadBackup(localHadBackup);

    // Lógica para mostrar el modal o actuar
    if ((!allNodes || allNodes.length === 0) && !showRecoveryModal && !userJustDismissedModal.current) {
      if (localHadBackup) {
        console.log('[TrainingScreen] Todos los nodos eliminados y existe backup. Mostrando modal de recuperación Quanta.');
        setShowRecoveryModal(true);
      } else {
        console.log('[TrainingScreen] Todos los nodos eliminados y NO existe backup. Forjando nuevo destino automáticamente.');
        // Si no hay backup, y se borran todos los nodos, iniciamos un nuevo flujo directamente.
        // handleDismissRecovery se encarga de resetear el flujo con nodos por defecto.
        handleDismissRecovery(); 
      }
    } else if (userJustDismissedModal.current) {
      userJustDismissedModal.current = false; // Resetear la bandera
    }
  }, [nodes.length, showRecoveryModal, plubotId]); // Depender de 'nodes' del store y 'plubotId' del store

  if (state.errorMessage) {
    return (
      <div className="ts-critical-error" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        background: 'rgba(10, 20, 35, 0.95)', 
        color: '#ff4444', 
        textAlign: 'center', 
        padding: '2rem' 
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textShadow: '0 0 5px #ff4444' }}>Error</h2>
        <p style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'rgba(0, 224, 255, 0.8)' }}>{state.errorMessage}</p>
        <button 
          className="ts-training-action-btn" 
          onClick={() => navigate('/profile')} 
          style={{ 
            background: 'rgba(0, 40, 80, 0.8)', 
            border: '2px solid #00e0ff', 
            padding: '0.8rem 1.5rem', 
            fontSize: '1rem', 
            color: '#e0e0ff' 
          }}>
          ← Volver al Perfil
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="ts-loading" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        background: 'rgba(10, 20, 35, 0.95)' 
      }}>
        <div className="loading-spinner" style={{ 
          width: '50px', 
          height: '50px', 
          border: '5px solid rgba(0, 224, 255, 0.3)', 
          borderTop: '5px solid #00e0ff', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
        <p style={{ marginTop: '20px', color: '#00e0ff' }}>Cargando editor de flujos...</p>
      </div>
    );
  }
  
  /**
   * Maneja el evento de soltar un nodo en el editor
   * @param {DragEvent} event - El evento de drag and drop
   */
  const handleNodeDrop = useCallback((event) => {
    // Prevenir comportamiento por defecto
    event.preventDefault();
    event.stopPropagation();
    
    // Obtener los límites del área de ReactFlow
    const reactFlowElement = document.querySelector('.react-flow');
    const reactFlowBounds = reactFlowElement?.getBoundingClientRect();
    
    if (!reactFlowBounds) {
      console.error('No se pudo encontrar el elemento .react-flow');
      setByteMessage('❌ Error: No se pudo encontrar el área del editor');
      return;
    }
    
    // Extraer datos del evento de arrastre
    const jsonData = extractDraggedData(event);
    if (!jsonData) return;
    
    // Calcular la posición de destino
    const dropPosition = calculateDropPosition(event, reactFlowBounds);
    
    // Crear el nuevo nodo
    createNodeFromData(jsonData, dropPosition);
  }, [setByteMessage, handleSaveFlow]);
  
  /**
   * Extrae los datos arrastrados del evento
   * @param {DragEvent} event - El evento de arrastre
   * @returns {string|null} - Los datos en formato JSON o null si no se encontraron
   */
  const extractDraggedData = useCallback((event) => {
    try {
      // Formatos posibles a probar
      const formats = [
        'application/reactflow',
        'text/plain',
        'application/json'
      ];
      
      // Intentar obtener datos de cada formato
      for (const format of formats) {
        const data = event.dataTransfer.getData(format);
        if (data) return data;
      }
      
      // No se encontraron datos
      console.warn('No se recibieron datos en el evento onDrop');
      setByteMessage('❌ No se recibieron datos del nodo arrastrado');
      return null;
    } catch (error) {
      console.error('Error al obtener datos del dataTransfer:', error);
      setByteMessage('❌ Error al procesar el nodo arrastrado');
      return null;
    }
  }, [setByteMessage]);
  
  /**
   * Calcula la posición donde se soltó el nodo
   * @param {DragEvent} event - El evento de arrastre
   * @param {DOMRect} reactFlowBounds - Los límites del área de ReactFlow
   * @returns {Object} - La posición calculada
   */
  /**
   * Calcula la posición donde se soltó un nodo, con validación robusta para evitar NaN
   * @param {DragEvent} event - El evento de arrastre
   * @param {DOMRect} reactFlowBounds - Los límites del área de ReactFlow
   * @returns {Object} - La posición calculada y validada
   */
  const calculateDropPosition = useCallback((event, reactFlowBounds) => {
    // Posición por defecto en caso de error (centro del viewport)
    const defaultPosition = { x: 250, y: 200 };
    
    try {
      const { reactFlowInstance } = useFlowStore.getState();
      
      // MÉTODO 1: Usar reactFlowInstance.project (preferido)
      if (reactFlowInstance && typeof reactFlowInstance.project === 'function') {
        console.log('[TrainingScreen] Calculando posición con reactFlowInstance.project');
        
        if (!event.clientX || !event.clientY) {
          console.warn('[TrainingScreen] Evento sin coordenadas válidas:', { clientX: event.clientX, clientY: event.clientY });
          return defaultPosition;
        }
        
        const position = reactFlowInstance.project({
          x: event.clientX,
          y: event.clientY,
        });
        
        // Validar que la posición calculada sea válida
        if (!position || typeof position !== 'object' || 
            position.x === undefined || position.y === undefined ||
            isNaN(position.x) || isNaN(position.y)) {
          console.warn('[TrainingScreen] reactFlowInstance.project devolvió una posición inválida:', position);
          return defaultPosition;
        }
        
        console.log('[TrainingScreen] Posición calculada con project:', position);
        return position;
      } 
      // MÉTODO 2: Cálculo manual básico (fallback)
      else {
        console.warn('[TrainingScreen] React Flow instance no disponible. Usando cálculo manual.');
        
        if (!reactFlowBounds || !event.clientX || !event.clientY) {
          console.warn('[TrainingScreen] Datos insuficientes para cálculo manual:', { 
            hasBounds: !!reactFlowBounds, 
            clientX: event.clientX, 
            clientY: event.clientY 
          });
          return defaultPosition;
        }
        
        const manualPosition = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };
        
        // Validar posición manual
        if (isNaN(manualPosition.x) || isNaN(manualPosition.y)) {
          console.warn('[TrainingScreen] Cálculo manual resultó en valores inválidos:', manualPosition);
          return defaultPosition;
        }
        
        console.log('[TrainingScreen] Posición calculada manualmente:', manualPosition);
        return manualPosition;
      }
    } catch (error) {
      console.error('[TrainingScreen] Error al calcular posición de drop:', error);
      return defaultPosition;
    }
  }, []);
  
  /**
   * Crea un nuevo nodo a partir de los datos
   * @param {string} jsonData - Los datos en formato JSON
   * @param {Object} position - La posición donde crear el nodo
   */
  const createNodeFromData = useCallback((jsonData, position) => {
    try {
      // Parsear los datos JSON
      const parsedData = JSON.parse(jsonData);
      
      if (!parsedData.nodeInfo?.nodeType) {
        console.warn('Los datos parseados no tienen la estructura esperada');
        setByteMessage('⚠️ Formato de nodo incorrecto');
        return;
      }
      
      // Extraer información del nodo
      const { nodeType, label, powerItemData, category } = parsedData.nodeInfo;
      
      // Obtener la función addNode del store
      const { addNode } = useFlowStore.getState();
      
      // Crear nodo con ID único
      const newNodeId = `${nodeType}-${Date.now()}`;
      const newNode = addNode(nodeType, position, {
        id: newNodeId,
        label: label || 'Nuevo nodo',
        category: category || 'default',
        ...(powerItemData || {})
      });
      
      // Notificar al usuario
      setByteMessage(`✅ Nodo "${label}" añadido al editor`);
      
      // Guardar automáticamente
      setTimeout(handleSaveFlow, 1000);
    } catch (error) {
      console.error('Error al añadir nodo:', error);
      setByteMessage('❌ Error al añadir nodo: ' + error.message);
    }
  }, [setByteMessage, handleSaveFlow]);
  
  /**
   * Previene el comportamiento por defecto en el dragover
   */
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Renderizar componente de error si hay un mensaje de error
  if (state.errorMessage) {
    return (
      <div className="ts-critical-error" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        background: 'rgba(10, 20, 35, 0.95)', 
        color: '#ff4444', 
        textAlign: 'center', 
        padding: '2rem' 
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textShadow: '0 0 5px #ff4444' }}>Error</h2>
        <p style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'rgba(0, 224, 255, 0.8)' }}>{state.errorMessage}</p>
        <button 
          className="ts-training-action-btn" 
          onClick={() => navigate('/profile')} 
          style={{ 
            background: 'rgba(0, 40, 80, 0.8)', 
            border: '2px solid #00e0ff', 
            padding: '0.8rem 1.5rem', 
            fontSize: '1rem', 
            color: '#e0e0ff' 
          }}>
          ← Volver al Perfil
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="ts-loading" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        background: 'rgba(10, 20, 35, 0.95)' 
      }}>
        <div className="loading-spinner" style={{ 
          width: '50px', 
          height: '50px', 
          border: '5px solid rgba(0, 224, 255, 0.3)', 
          borderTop: '5px solid #00e0ff', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
        <p style={{ marginTop: '20px', color: '#00e0ff' }}>Cargando editor de flujos...</p>
      </div>
    );
  }
  
  // Estilos comunes extraidos para mejorar legibilidad
  const screenStyles = {
    backgroundColor: 'transparent !important',
    position: 'relative',
    height: '100vh',
    width: '100%',
    overflow: 'auto',
    zIndex: 'auto'
  };
  
  const mainContentStyles = {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    backgroundColor: 'transparent'
  };
  
  const editorContainerStyles = {
    flex: 1,
    height: '100%',
    position: 'relative',
    overflow: 'auto',
    backgroundColor: 'transparent',
    zIndex: 10
  };
  
  // Renderizado principal del componente
  return (
    <div className="ts-training-screen" style={screenStyles}>
      <div className="ts-main-content" style={mainContentStyles}>
        <NodePalette />
        
        <div className="ts-flow-editor-container" style={editorContainerStyles}>
          <FlowEditor
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(e, node) => setSelectedNode(node)}
            onEdgeClick={(e, edge) => {
              setSelectedConnection(edge);
              setShowConnectionEditor(true);
            }}
            simulationMode={showSimulation}
            handleError={handleError}
            hideHeader={true}
            plubotId={plubotIdFromUrl}
            name={plubotData?.name || 'Nuevo Plubot'}
            notifyByte={setByteMessage}
            saveFlowData={handleSaveFlow}
            onDrop={handleNodeDrop}
            onDragOver={handleDragOver}
          />
        </div>
      </div>
      
      {/* MiniMap en la esquina inferior izquierda */}
      <div className="ts-minimap-container">
        <Suspense fallback={null}>
          <CustomMiniMap 
            nodes={nodes}
            edges={edges}
            isExpanded={false}
            isUltraMode={useFlowStore.getState().isUltraMode}
          />
        </Suspense>
      </div>
      
      {renderModals()}
      
      {/* ByteAssistant siempre visible */}
      <Suspense fallback={null}>
        <ByteAssistant simulationMode={showSimulation} />
      </Suspense>
      
      {/* StatusBubble condicional */}
      {byteMessage && !showSimulation && <StatusBubble message={byteMessage} />}
      
      {showRecoveryModal && (
        <Suspense fallback={null}>
          <EmergencyRecovery 
            isOpen={showRecoveryModal}
            onRecover={wrappedHandleRecoverNodes}
            onDismiss={wrappedHandleDismissRecovery} // El botón 'X' del modal llamará a esto
            hasBackup={hadBackup} // Pasar el estado que indica si hay un backup válido
          />
        </Suspense>
      )}
    </div>
  );
};

export default TrainingScreen;
