import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactFlow from 'reactflow';

import 'reactflow/dist/style.css';
import '@/assets/css/hide-watermark.css';
import { shallow } from 'zustand/shallow'; // Importación agregada


import { useGamification } from '@/context/GamificationContext';
import { usePlubotCreation } from '@/context/PlubotCreationContext';
import useAPI from '@/hooks/useAPI';
import useDebounce from '@/hooks/useDebounce';
import usePlubotLoader from '@/hooks/usePlubotLoader';
import { useFlowMeta, useFlowNodesEdges, useUndoRedo } from '@/stores/selectors';
import useFlowStore from '@/stores/useFlowStore';
import useTrainingStore from '@/stores/useTrainingStore';
import { analyzeFlowRoutes, generateNodeSuggestions } from '@/utils/flowValidation';
import { NODE_TYPES } from '@/utils/nodeConfig'; // Importación añadida para identificar DecisionNodes

// Zustand stores

// NEW optimized Zustand selectors


// Componentes de carga inmediata

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

import { EDGE_COLORS } from '@/utils/nodeConfig';

import EpicHeader from '../common/EpicHeader';
import StatusBubble from '../common/StatusBubble';
import FlowEditor from '../flow-editor/FlowEditor.jsx';
import { backupEdgesToLocalStorage } from '../flow-editor/utils/edgeFixUtil';


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

  // Obtener datos y acciones refinados de los stores de Zustand
  const {
    plubotId,
    flowName,
    isLoaded,
    setFlowName,
    setPlubotId: storeSetPlubotId, // Renombrado para evitar conflicto con setPlubotId de useTrainingStore
    resetFlow,
    isUltraMode,
    toggleUltraMode,
    getVisibleNodeCount,
  } = useFlowMeta();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
    setSelectedNode,
    selectedNode,
    selectedEdge,
  } = useFlowNodesEdges();

  const { undo, redo, canUndo, canRedo } = useUndoRedo();

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
    openSettingsModal: originalOpenSettingsModal,
  } = useTrainingStore();

  // Estado local para el modal de recuperación y los datos del backup
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [emergencyBackupData, setEmergencyBackupData] = useState(null);
  const [hadBackup, setHadBackup] = useState(false); // Nuevo estado para rastrear si había backup
  const userJustDismissedModal = useRef(false); // Para evitar que el modal reaparezca instantáneamente

  // Reemplazamos con versiones stub que no hacen nada para evitar conflictos con GlobalProvider
  const openShareModal = useCallback(() => {

  }, []);

  const openSimulateModal = useCallback(() => {

  }, []);

  const openTemplatesModal = useCallback(() => {

  }, []);

  const openSettingsModal = useCallback(() => {

  }, []);

  // Efecto para inicializar el estado con los datos del plubot


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
          { id: 'd1-cond-1', text: 'Ayuda', optionNodeId: 'option-2' },
        ],
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
          { id: 'd2-cond-1', text: 'No', optionNodeId: 'option-4' },
        ],
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

  // Integrate new loader hook (now after constants are defined)
  usePlubotLoader({
    plubotIdFromUrl,
    plubotData,
    initialNodes,
    initialEdges,
  });

  // NOTE: Legacy loader useEffect has been removed. Logic is now handled by usePlubotLoader hook above.

  // Estado local simplificado para mantener compatibilidad con el código existente
  const [state, setState] = useState({
    notification: null,
    errorMessage: null,
    isDataLoaded: false,
    isGenerating: false,
    flowStyles: { edgeStyles: { strokeWidth: 2, stroke: '#00e0ff', animated: false } },
  });

  // Propiedades de conexión por defecto - extraídas para mejorar legibilidad
  const defaultConnectionProperties = {
    animated: false,
    label: '',
    style: { stroke: '#00e0ff', strokeWidth: 2, strokeDasharray: '' },
    type: 'default',
  };

  // Ruta de análisis por defecto - extraída para mejorar legibilidad
  const defaultRouteAnalysis = { routes: [], errors: [] };

  useEffect(() => {
    document.body.classList.add('training-screen');
    return () => document.body.classList.remove('training-screen');
  }, []);

  const handleError = useCallback((errorMsg, consoleError = null) => {
    setByteMessage(`⚠️ Error: ${errorMsg}`);
    // Los errores de consola se silencian en producción
  }, [setByteMessage]);

  /**
   * Verifica las precondiciones necesarias para guardar el flujo
   * @returns {boolean} true si se cumplen todas las precondiciones, false en caso contrario
   */
  const checkSavePrerequisites = useCallback(() => {
    // Verificar si ya hay un guardado en progreso
    if (isSaving) {
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
      nodeId: node.id,
    }));

    // Identificar duplicados
    const duplicates = userMessages.reduce((acc, curr, index, arr) => {
      const isDuplicated = arr.some(
        (other, otherIndex) => otherIndex !== index && other.user_message.toLowerCase() === curr.user_message.toLowerCase(),
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
      n.data?.label ? n.data.label.toLowerCase() : `node-${n.id}`,
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
            data: { ...newNodes[nodeIndex].data, label: newLabel },
          };
        }
      }
    });

    // Actualizar nodos con nombres únicos
    onNodesChange(newNodes.map((node, index) => ({
      type: 'replace',
      item: node,
      index,
    })));


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
        // Nodo duplicado encontrado y eliminado silenciosamente
      }
    }

    // Validar que cada arista tenga nodos fuente y destino existentes
    const validEdges = edges.filter(edge => {
      const isValid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
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
        timestamp: Date.now(),
      }));
      return backupId;
    } catch (storageError) {
      // Error al guardar en localStorage, fallar silenciosamente
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
          flowName: flowName || 'Flujo sin título',
        },
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
              // Fallar silenciosamente
            }
          }, 60000);
        }

        return true;
      } else {
        setByteMessage(`❌ Error al guardar: ${response?.error || 'Error desconocido'}`);
        return false;
      }
    } catch (error) {
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
    flowName, backupEdgesToLocalStorage,
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


  // Componente para gestionar los modales usando el componente Modal
  // IMPORTANTE: Este renderModals SOLO muestra modales que NO son gestionados por GlobalProvider
  const renderModals = useCallback(() => {
    // Definir solo los modales que NO están gestionados por GlobalProvider
    const modalConfigs = [
      // Estos modales son específicos de TrainingScreen y se mantienen
      {
        title: 'Editor de Conexión',
        isOpen: showConnectionEditor,
        onClose: () => setShowConnectionEditor(false),
      },
      {
        title: 'Análisis de Rutas',
        isOpen: showRouteAnalysis,
        onClose: () => setShowRouteAnalysis(false),
      },
      {
        title: 'Historial de Versiones',
        isOpen: showVersionHistoryPanel,
        onClose: () => setShowVersionHistoryPanel(false),
      },

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
    setShowVersionHistoryPanel,
  ]);

  const handleRecoverNodes = () => {
    const currentPlubotId = useFlowStore.getState().plubotId;
    if (emergencyBackupData && emergencyBackupData.nodes && emergencyBackupData.edges) {
      useFlowStore.getState().setNodes(emergencyBackupData.nodes);
      useFlowStore.getState().setEdges(emergencyBackupData.edges);
    }
  };

  const handleDismissRecovery = () => {
    const currentPlubotId = useFlowStore.getState().plubotId;
    const targetFlowName = useFlowStore.getState().flowName || `Plubot ${currentPlubotId}`;


    const emergencyBackupKey = `plubot-nodes-emergency-backup-${currentPlubotId}`;
    localStorage.removeItem(emergencyBackupKey);
    setEmergencyBackupData(null);
    setHadBackup(false); // Importante: actualizar el estado

    // Siempre resetear a un flujo limpio (con nodos por defecto) al descartar,
    // independientemente de si había un backup o no, porque el usuario eligió no restaurar o no había nada que restaurar.

    resetFlow({ id: currentPlubotId, name: targetFlowName, nodes: [], edges: [] }, currentPlubotId, { skipLoad: false, forceDefaultNodes: true });
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
        localStorage.removeItem(emergencyBackupKey); // Eliminar backup corrupto
      }
    }

    setEmergencyBackupData(localEmergencyBackupData);
    setHadBackup(localHadBackup);

    // Lógica para mostrar el modal o actuar
    if ((!allNodes || allNodes.length === 0) && !showRecoveryModal && !userJustDismissedModal.current) {
      if (localHadBackup) {
        setShowRecoveryModal(true);
      } else {
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
        padding: '2rem',
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
            color: '#e0e0ff',
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
        background: 'rgba(10, 20, 35, 0.95)',
      }}>
        <div className="loading-spinner" style={{
          width: '50px',
          height: '50px',
          border: '5px solid rgba(0, 224, 255, 0.3)',
          borderTop: '5px solid #00e0ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ marginTop: '20px', color: '#00e0ff' }}>Cargando editor de flujos...</p>
      </div>
    );
  }

  /**
   * Maneja el evento de soltar un nodo en el editor
   * @param {DragEvent} event - El evento de drag and drop
   */
  const extractDraggedData = useCallback((event) => {
    try {
      const formats = ['application/reactflow', 'text/plain', 'application/json'];
      for (const format of formats) {
        const data = event.dataTransfer.getData(format);
        if (data) return data;
      }
      setByteMessage('❌ No se recibieron datos del nodo arrastrado');
      return null;
    } catch (error) {
      setByteMessage('❌ Error al procesar el nodo arrastrado');
      return null;
    }
  }, [setByteMessage]);

  const getDropPosition = useCallback((event, reactFlowBounds) => {
    const defaultPosition = { x: 250, y: 200 };
    try {
      const { reactFlowInstance } = useFlowStore.getState();
      if (reactFlowInstance && typeof reactFlowInstance.project === 'function') {
        if (!event.clientX || !event.clientY) {
          return defaultPosition;
        }
        const position = reactFlowInstance.project({
          x: event.clientX,
          y: event.clientY,
        });
        if (!position || typeof position !== 'object' ||
            position.x === undefined || position.y === undefined ||
            isNaN(position.x) || isNaN(position.y)) {
          return defaultPosition;
        }
        return position;
      } else {
        if (!reactFlowBounds || !event.clientX || !event.clientY) {
          return defaultPosition;
        }
        const manualPosition = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };
        if (isNaN(manualPosition.x) || isNaN(manualPosition.y)) {
          return defaultPosition;
        }
        return manualPosition;
      }
    } catch (error) {
      return defaultPosition;
    }
  }, []);

  const createNodeFromData = useCallback((jsonData, position) => {
    try {
      const parsedData = JSON.parse(jsonData);
      if (!parsedData.nodeInfo?.nodeType) {
        setByteMessage('⚠️ Formato de nodo incorrecto');
        return;
      }
      const { nodeType, label, powerItemData, category } = parsedData.nodeInfo;
      const { addNode } = useFlowStore.getState();
      const newNodeId = `${nodeType}-${Date.now()}`;
      addNode(nodeType, position, {
        id: newNodeId,
        label: label || 'Nuevo nodo',
        category: category || 'default',
        ...(powerItemData || {}),
      });
      setByteMessage(`✅ Nodo "${label}" añadido al editor`);
      setTimeout(handleSaveFlow, 1000);
    } catch (error) {
      setByteMessage(`❌ Error al añadir nodo: ${error.message}`);
    }
  }, [setByteMessage, handleSaveFlow]);

  const handleNodeDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();

    const reactFlowElement = document.querySelector('.react-flow');
    const reactFlowBounds = reactFlowElement?.getBoundingClientRect();

    if (!reactFlowBounds) {
      setByteMessage('❌ Error: No se pudo encontrar el área del editor');
      return;
    }

    const jsonData = extractDraggedData(event);
    if (!jsonData) return;

    const dropPosition = getDropPosition(event, reactFlowBounds);

    createNodeFromData(jsonData, dropPosition);
  }, [extractDraggedData, getDropPosition, createNodeFromData, setByteMessage]);

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
        padding: '2rem',
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
            color: '#e0e0ff',
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
        background: 'rgba(10, 20, 35, 0.95)',
      }}>
        <div className="loading-spinner" style={{
          width: '50px',
          height: '50px',
          border: '5px solid rgba(0, 224, 255, 0.3)',
          borderTop: '5px solid #00e0ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
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
    zIndex: 'auto',
  };

  const mainContentStyles = {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    backgroundColor: 'transparent',
  };

  const editorContainerStyles = {
    flex: 1,
    height: '100%',
    position: 'relative',
    overflow: 'auto',
    backgroundColor: 'transparent',
    zIndex: 10,
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
            hideHeader
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
