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
const SimulationInterface = lazy(() => import('../simulation/SimulationInterface'));

// Modales con lazy loading
const SuggestionsModal = lazy(() => import('../modals/SuggestionsModal'));
const ImportExportModal = lazy(() => import('../modals/ImportExportModal'));
const EmbedModal = lazy(() => import('../modals/EmbedModal'));
const TemplateSelector = lazy(() => import('../modals/TemplateSelector'));

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
    getVisibleNodeCount
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
    const initializePlubotData = () => {
      const { 
        plubotId: currentPlubotIdInStore,
        nodes: nodesInStore,
        flowName: currentFlowNameInStore,
        resetFlow,
        setFlowName,
        setPlubotId
      } = useFlowStore.getState();
      
      const targetPlubotId = plubotIdFromUrl; // Extracted earlier in TrainingScreen component
      let targetFlowName = `Plubot ${targetPlubotId}`;
      const savedPlubotName = localStorage.getItem(`plubot-name-${targetPlubotId}`);
      if (savedPlubotName) {
        targetFlowName = savedPlubotName;
      }
      
      console.log('[TrainingScreen Diagnostic] Before needsFlowSetup calculation. currentPlubotIdInStore:', currentPlubotIdInStore, 'targetPlubotId:', targetPlubotId, 'nodesInStore:', nodesInStore);
      // Determine if a flow reset/setup is needed
      const needsFlowSetup = 
        currentPlubotIdInStore !== targetPlubotId || 
        (currentPlubotIdInStore === targetPlubotId && (!nodesInStore || nodesInStore.length === 0));
      
      if (needsFlowSetup && targetPlubotId) {
        console.log(`[TrainingScreen] Needs flow setup for ${targetPlubotId}. Store ID: ${currentPlubotIdInStore}, Store Nodes: ${nodesInStore?.length}`);
        const emergencyBackupKey = `plubot-nodes-emergency-backup-${targetPlubotId}`;
        const emergencyBackupExists = localStorage.getItem(emergencyBackupKey) !== null;
        
        const resetOptions = emergencyBackupExists ? { skipLoad: true } : { skipLoad: false };
        
        if (emergencyBackupExists) {
            console.log(`[TrainingScreen] Emergency backup found for ${targetPlubotId}. Resetting flow with skipLoad: true.`);
        } else {
            console.log(`[TrainingScreen] No emergency backup for ${targetPlubotId}. Resetting flow with skipLoad: false (will attempt load).`);
        }
        
        resetFlow(targetPlubotId, targetFlowName, resetOptions);
        
        const plubotDataToSet = { id: targetPlubotId, name: targetFlowName };
        if (!plubotData || plubotData.id !== targetPlubotId || plubotData.name !== targetFlowName) {
          setPlubotData(plubotDataToSet); // from PlubotCreationContext
        }
        // Check against the potentially updated flowName in store after resetFlow
        if (useFlowStore.getState().flowName !== targetFlowName) {
            setFlowName(targetFlowName);
        }
        localStorage.setItem(`plubot-name-${targetPlubotId}`, targetFlowName);
      
      } else if (plubotData?.id === targetPlubotId && plubotData.name !== targetFlowName && targetPlubotId) {
        console.log(`[TrainingScreen] Plubot ID ${targetPlubotId} matches, synchronizing name to: ${targetFlowName}`);
        const plubotDataToSet = { id: targetPlubotId, name: targetFlowName };
        setPlubotData(plubotDataToSet);
        if (currentFlowNameInStore !== targetFlowName) {
          setFlowName(targetFlowName);
        }
        localStorage.setItem(`plubot-name-${targetPlubotId}`, targetFlowName);
      } else if ((!plubotData || plubotData.id !== targetPlubotId) && targetPlubotId) {
        console.log(`[TrainingScreen] Fallback: Syncing plubotData context with URL: ${targetPlubotId}`);
        const plubotDataToSet = { id: targetPlubotId, name: targetFlowName };
        setPlubotData(plubotDataToSet);
        if (currentFlowNameInStore !== targetFlowName) {
           setFlowName(targetFlowName);
        }
        localStorage.setItem(`plubot-name-${targetPlubotId}`, targetFlowName);
        if(currentPlubotIdInStore !== targetPlubotId && nodesInStore && nodesInStore.length > 0){
           console.log(`[TrainingScreen] Fallback: Syncing flowStore.plubotId to ${targetPlubotId} without full reset, as nodes are present.`);
           setPlubotId(targetPlubotId); 
        }
      }
    };
    
    initializePlubotData();
    
    if (!byteMessage) {
      setByteMessage('¡Hola! Estoy aquí para ayudarte a crear tu Plubot. Arrastra un nodo desde la paleta para comenzar.');
    }
  }, [plubotIdFromUrl, plubotData, setPlubotData, byteMessage, setByteMessage, nodes, plubotId, resetFlow, setFlowName, storeSetPlubotId, flowName]);

  // Efecto para mantener sincronizado el nombre del Plubot con el flowName
  useEffect(() => {
    if (plubotData?.name) {
      // Obtener acceso directo al store para evitar problemas de re-renderizado
      const flowStore = useFlowStore.getState();
      
      // Sincronizar el nombre del Plubot con el nombre del flujo en el store
      if (flowStore.flowName !== plubotData.name) {
        console.log(`[TrainingScreen] Sincronizando nombre: "${plubotData.name}"`);
        flowStore.setFlowName(plubotData.name);
        // Forzar actualización para que EpicHeader se actualice
        flowStore.forceUpdate = Date.now();
      }
    }
  }, [plubotData?.name]);
  
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
      data: { label: 'Decisión 1', question: '¿Qué quieres hacer?' },
    },
    {
      id: 'option-1',
      type: 'option',
      position: { x: 100, y: 300 },
      data: { label: 'Opción 1', condition: 'Información' },
    },
    {
      id: 'option-2',
      type: 'option',
      position: { x: 400, y: 300 },
      data: { label: 'Opción 2', condition: 'Ayuda' },
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
      data: { label: 'Decisión 2', question: '¿Necesitas algo más?' },
    },
    {
      id: 'option-3',
      type: 'option',
      position: { x: 100, y: 700 },
      data: { label: 'Opción 3', condition: 'Sí' },
    },
    {
      id: 'option-4',
      type: 'option',
      position: { x: 400, y: 700 },
      data: { label: 'Opción 4', condition: 'No' },
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
    { id: 'e3', source: 'decision-1', sourceHandle: 'output-0', target: 'option-1', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e4', source: 'decision-1', sourceHandle: 'output-1', target: 'option-2', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e5', source: 'option-1', target: 'action-1', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e6', source: 'option-2', target: 'action-2', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e7', source: 'action-1', target: 'message-2', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e8', source: 'action-2', target: 'message-3', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e9', source: 'message-2', target: 'decision-2', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e10', source: 'message-3', target: 'decision-2', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e11', source: 'decision-2', sourceHandle: 'output-0', target: 'option-3', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e12', source: 'decision-2', sourceHandle: 'output-1', target: 'option-4', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e13', source: 'option-3', target: 'message-4', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e14', source: 'message-4', target: 'end-1', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
    { id: 'e15', source: 'option-4', target: 'end-2', type: 'elite-edge', animated: true, style: { stroke: EDGE_COLORS.default } },
  ];

  // Inicializar los nodos y aristas en el store de Zustand solo al cargar por primera vez
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
  }, [nodes, edges, setNodes, setEdges, initialNodes, initialEdges]); // initialNodes e initialEdges deben ser estables

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
  }, [nodes, edges, debouncedSave]);
  
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

  const [emergencyBackupExistsForSession, setEmergencyBackupExistsForSession] = useState(false);
  const [showRecoveryMessage, setShowRecoveryMessage] = useState(false);

  useEffect(() => {
    const currentPlubotId = useFlowStore.getState().plubotId;
    const currentNodes = useFlowStore.getState().nodes;
    const allNodesFromStore = useFlowStore.getState().nodes; // For backup

    console.log(`[TrainingScreen Recovery Check] Active Plubot ID: ${currentPlubotId}, Node count: ${currentNodes.length}`);

    if (currentPlubotId && currentNodes.length === 0 && allNodesFromStore.length > 0) {
      const emergencyBackupKey = `plubot-nodes-emergency-backup-${currentPlubotId}`;
      console.log(`[TrainingScreen Recovery Logic] All nodes deleted for Plubot ID: ${currentPlubotId}. Attempting to save emergency backup with key: ${emergencyBackupKey}`);
      
      // Guardar los nodos que estaban justo antes de la eliminación
      // Asegurarse de que no guardamos un array vacío si la detección es tardía.
      // Este es un punto crítico: necesitamos los nodos ANTES de que se borren.
      // El estado 'allNodesFromStore' podría ya estar vacío aquí si el store se actualizó muy rápido.
      // Considerar obtener 'previousNodes' de alguna manera o asegurar que 'allNodesFromStore' es el correcto.
      // Por ahora, asumimos que 'allNodesFromStore' capturó los nodos antes de la eliminación masiva.
      // Esto se basa en la suposición de que este efecto se ejecuta después de que los nodos se eliminan
      // pero 'allNodesFromStore' fue capturado al inicio del efecto, potencialmente antes de la actualización completa.
      // Si 'allNodesFromStore' también está vacío, el backup será inútil.
      
      // Corrección: El problema es que `allNodesFromStore` se obtiene en el mismo ciclo que `currentNodes`.
      // Si `currentNodes` está vacío, `allNodesFromStore` también lo estará si la eliminación ya ocurrió.
      // La lógica de guardar el backup debe ocurrir ANTES de que los nodos se eliminen del store,
      // o debemos tener una copia de los nodos de un estado anterior.

      // La lógica actual de 'EmergencyRecovery.js' (que llama a 'saveEmergencyBackup') 
      // se activa en el 'onNodesChange' y guarda los nodos ANTES de que se aplique el cambio de eliminación.
      // Por lo tanto, cuando este efecto en TrainingScreen se ejecuta, el backup ya DEBERÍA estar guardado por EmergencyRecovery.js
      // con la misma convención de clave.

      // Verificamos si el backup ya fue creado por EmergencyRecovery.js
      const backupAlreadyExists = localStorage.getItem(emergencyBackupKey) !== null;
      if (backupAlreadyExists) {
        console.log(`[TrainingScreen Recovery Logic] Emergency backup with key ${emergencyBackupKey} already exists (likely saved by EmergencyRecovery.js).`);
        setEmergencyBackupExistsForSession(true);
        setShowRecoveryMessage(true);
      } else {
        // Esto no debería ocurrir si EmergencyRecovery.js funciona como se espera.
        // Pero si ocurre, significa que necesitamos una forma de guardar los nodos aquí.
        // Por ahora, solo registraremos esto como una condición inesperada.
        console.warn(`[TrainingScreen Recovery Logic] UNEXPECTED: All nodes deleted for ${currentPlubotId}, but NO emergency backup found with key ${emergencyBackupKey}. Recovery message might not work as expected.`);
        setEmergencyBackupExistsForSession(false);
        setShowRecoveryMessage(false); // No mostrar si no hay backup
      }

    } else if (currentNodes.length > 0 && showRecoveryMessage) {
      // Si los nodos vuelven a aparecer (por ejemplo, por deshacer o restauración manual), ocultar el mensaje.
      console.log('[TrainingScreen Recovery Logic] Nodes are present again, hiding recovery message.');
      setShowRecoveryMessage(false);
      setEmergencyBackupExistsForSession(false); // Resetear estado del backup
    }

    // Limpieza del efecto si es necesario
    // return () => { ... };
  }, [nodes, plubotId, showRecoveryMessage]); // Dependencias: nodes y plubotId del store, y estado local showRecoveryMessage

  useEffect(() => {
    // Solo actuar si tenemos un plubotId, los nodos están definidos, y no estamos en medio de una carga inicial.
    // Y crucialmente, que el plubotId del store coincida con el de la URL para evitar actuar sobre datos "viejos".
    if (plubotId && nodes && plubotId === plubotIdFromUrl && !isLoading) {
      const currentNodesLength = nodes.length;
      console.log(`[TS Recovery Check] useEffect triggered. Nodes length: ${currentNodesLength}, plubotId: ${plubotId}, isLoading: ${isLoading}, showRecoveryModal: ${showRecoveryModal}`);

      if (currentNodesLength === 0) {
        console.log(`[TS Recovery Check] NODES ARE ZERO for plubotId ${plubotId}. Attempting to show recovery modal.`);
        const emergencyBackupKey = `plubot-nodes-emergency-backup-${plubotId}`;
        const emergencyBackup = localStorage.getItem(emergencyBackupKey);

        if (emergencyBackup) {
          console.log(`[TS Recovery Check] Found emergency backup in localStorage with key ${emergencyBackupKey}. Data: ${emergencyBackup.substring(0, 100)}...`);
          try {
            setEmergencyBackupData(JSON.parse(emergencyBackup));
            console.log('[TS Recovery Check] Successfully parsed emergency backup data.');
          } catch (e) {
            console.error('[TS Recovery Check] Failed to parse emergency backup data:', e);
            setEmergencyBackupData(null); // Fallback to no data if parsing fails
          }
          if (!showRecoveryModal) {
            console.log('[TS Recovery Check] Setting showRecoveryModal to true.');
            setShowRecoveryModal(true);
          } else {
            console.log('[TS Recovery Check] showRecoveryModal is already true.');
          }
        } else {
          console.log(`[TS Recovery Check] NO emergency backup found in localStorage with key ${emergencyBackupKey}. Modal will offer to start fresh.`);
          setEmergencyBackupData(null);
          if (!showRecoveryModal) {
            console.log('[TS Recovery Check] Setting showRecoveryModal to true (no backup found path).');
            setShowRecoveryModal(true);
          } else {
            console.log('[TS Recovery Check] showRecoveryModal is already true (no backup found path).');
          }
        }
      } else { // nodes.length > 0
        if (showRecoveryModal) {
          console.log('[TS Recovery Check] Nodes are present, ensuring recovery modal is hidden.');
          setShowRecoveryModal(false);
        }
      }
    } else {
      // Log por qué no se activa la lógica principal de este useEffect
      // console.log(`[TS Recovery Check] Conditions not met: plubotId=${plubotId}, nodesDefined=${!!nodes}, idMatch=${plubotId === plubotIdFromUrl}, isLoading=${isLoading}`);
    }
  }, [nodes, plubotId, plubotIdFromUrl, isLoading, showRecoveryModal, setEmergencyBackupData, setShowRecoveryModal]);

  const handleRecoverNodes = () => {
    const currentPlubotId = useFlowStore.getState().plubotId;
    const emergencyBackupKey = `plubot-nodes-emergency-backup-${currentPlubotId}`;
    console.log(`[TrainingScreen] handleRecoverNodes called for plubotId: ${currentPlubotId}, using key: ${emergencyBackupKey}`);
    const backup = localStorage.getItem(emergencyBackupKey);
    if (backup) {
      try {
        const parsedBackup = JSON.parse(backup);
        if (parsedBackup.nodes && parsedBackup.edges) {
          console.log(`[TrainingScreen] Restoring ${parsedBackup.nodes.length} nodes and ${parsedBackup.edges.length} edges from emergency backup.`);
          useFlowStore.getState().setNodes(parsedBackup.nodes);
          useFlowStore.getState().setEdges(parsedBackup.edges);
          setShowRecoveryMessage(false);
          setEmergencyBackupExistsForSession(false);
          // Opcional: eliminar el backup después de usarlo
          // localStorage.removeItem(emergencyBackupKey);
        } else {
          console.error('[TrainingScreen] Emergency backup format is invalid.');
        }
      } catch (error) {
        console.error('[TrainingScreen] Failed to parse emergency backup:', error);
      }
    } else {
      console.warn('[TrainingScreen] No emergency backup found to restore.');
    }
  };

  const handleDismissRecovery = () => {
    const currentPlubotId = useFlowStore.getState().plubotId;
    const emergencyBackupKey = `plubot-nodes-emergency-backup-${currentPlubotId}`;
    console.log(`[TrainingScreen] handleDismissRecovery called for plubotId: ${currentPlubotId}. Removing backup key: ${emergencyBackupKey}`);
    localStorage.removeItem(emergencyBackupKey);
    setShowRecoveryMessage(false);
    setEmergencyBackupExistsForSession(false);
  };

  useEffect(() => {
    const initializePlubotData = () => {
      const { 
        plubotId: currentPlubotIdInStore,
        nodes: nodesInStore,
        flowName: currentFlowNameInStore,
        resetFlow,
        setFlowName,
        setPlubotId
      } = useFlowStore.getState();
      
      const targetPlubotId = plubotIdFromUrl; // Extracted earlier in TrainingScreen component
      let targetFlowName = `Plubot ${targetPlubotId}`;
      const savedPlubotName = localStorage.getItem(`plubot-name-${targetPlubotId}`);
      if (savedPlubotName) {
        targetFlowName = savedPlubotName;
      }
      
      console.log('[TrainingScreen Diagnostic] Before needsFlowSetup calculation. currentPlubotIdInStore:', currentPlubotIdInStore, 'targetPlubotId:', targetPlubotId, 'nodesInStore:', nodesInStore);
      // Determine if a flow reset/setup is needed
      const needsFlowSetup = 
        currentPlubotIdInStore !== targetPlubotId || 
        (currentPlubotIdInStore === targetPlubotId && (!nodesInStore || nodesInStore.length === 0));
      
      if (needsFlowSetup && targetPlubotId) {
        console.log(`[TrainingScreen] Needs flow setup for ${targetPlubotId}. Store ID: ${currentPlubotIdInStore}, Store Nodes: ${nodesInStore?.length}`);
        const emergencyBackupKey = `plubot-nodes-emergency-backup-${targetPlubotId}`;
        const emergencyBackupExists = localStorage.getItem(emergencyBackupKey) !== null;
        
        const resetOptions = emergencyBackupExists ? { skipLoad: true } : { skipLoad: false };
        
        if (emergencyBackupExists) {
            console.log(`[TrainingScreen] Emergency backup found for ${targetPlubotId}. Resetting flow with skipLoad: true.`);
        } else {
            console.log(`[TrainingScreen] No emergency backup for ${targetPlubotId}. Resetting flow with skipLoad: false (will attempt load).`);
        }
        
        resetFlow(targetPlubotId, targetFlowName, resetOptions);
        
        const plubotDataToSet = { id: targetPlubotId, name: targetFlowName };
        if (!plubotData || plubotData.id !== targetPlubotId || plubotData.name !== targetFlowName) {
          setPlubotData(plubotDataToSet); // from PlubotCreationContext
        }
        // Check against the potentially updated flowName in store after resetFlow
        if (useFlowStore.getState().flowName !== targetFlowName) {
            setFlowName(targetFlowName);
        }
        localStorage.setItem(`plubot-name-${targetPlubotId}`, targetFlowName);
      
      } else if (plubotData?.id === targetPlubotId && plubotData.name !== targetFlowName && targetPlubotId) {
        console.log(`[TrainingScreen] Plubot ID ${targetPlubotId} matches, synchronizing name to: ${targetFlowName}`);
        const plubotDataToSet = { id: targetPlubotId, name: targetFlowName };
        setPlubotData(plubotDataToSet);
        if (currentFlowNameInStore !== targetFlowName) {
          setFlowName(targetFlowName);
        }
        localStorage.setItem(`plubot-name-${targetPlubotId}`, targetFlowName);
      } else if ((!plubotData || plubotData.id !== targetPlubotId) && targetPlubotId) {
        console.log(`[TrainingScreen] Fallback: Syncing plubotData context with URL: ${targetPlubotId}`);
        const plubotDataToSet = { id: targetPlubotId, name: targetFlowName };
        setPlubotData(plubotDataToSet);
        if (currentFlowNameInStore !== targetFlowName) {
           setFlowName(targetFlowName);
        }
        localStorage.setItem(`plubot-name-${targetPlubotId}`, targetFlowName);
        if(currentPlubotIdInStore !== targetPlubotId && nodesInStore && nodesInStore.length > 0){
           console.log(`[TrainingScreen] Fallback: Syncing flowStore.plubotId to ${targetPlubotId} without full reset, as nodes are present.`);
           setPlubotId(targetPlubotId); 
        }
      }
    };
    
    initializePlubotData();
    
    if (!byteMessage) {
      setByteMessage('¡Hola! Estoy aquí para ayudarte a crear tu Plubot. Arrastra un nodo desde la paleta para comenzar.');
    }
  }, [plubotIdFromUrl, plubotData, setPlubotData, byteMessage, setByteMessage]);

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
  
  // Renderizar loader si está cargando
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
      
      {/* Componentes condicionales */}
      {showSimulation && (
        <Suspense fallback={<div className="loading-simulation">Cargando simulación...</div>}>
          <SimulationInterface 
            nodes={nodes} 
            edges={edges} 
            onClose={() => setShowSimulation(false)} 
          />
        </Suspense>
      )}
      
      {/* ByteAssistant siempre visible */}
      <Suspense fallback={null}>
        <ByteAssistant simulationMode={showSimulation} />
      </Suspense>
      
      {/* StatusBubble condicional */}
      {byteMessage && !showSimulation && <StatusBubble message={byteMessage} />}
      
      {showRecoveryMessage && (
        <div className="recovery-message">
          <p>¡Atención! Todos los nodos han sido eliminados. ¿Quieres restaurarlos desde un backup de emergencia?</p>
          <button onClick={handleRecoverNodes}>Restaurar nodos</button>
          <button onClick={handleDismissRecovery}>Descartar</button>
        </div>
      )}
    </div>
  );
};

export default TrainingScreen;
