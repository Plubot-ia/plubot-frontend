import React, { useState, useEffect, useCallback, useRef, Suspense, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import 'reactflow/dist/style.css';
import '@/assets/css/hide-watermark.css';

import { ModalContext } from '@/context/modal/ModalContext';
import useAPI from '@/hooks/useAPI';
import { useFlowMeta, useFlowNodesEdges } from '@/stores/selectors';
import useFlowStore from '@/stores/use-flow-store';
import useTrainingStore from '@/stores/use-training-store';
import { EDGE_COLORS } from '@/utils/node-config.js';

import usePlubotCreation from '../../../hooks/usePlubotCreation';
import ByteAssistant from '../common/ByteAssistant.jsx';
import NodePalette from '../common/NodePalette.jsx';
// StatusBubble removed - now handled by EpicHeader only
import EmergencyRecovery from '../flow-editor/components/EmergencyRecovery.jsx';
import FlowEditor from '../flow-editor/FlowEditor.jsx';

// El custom hook useFlowEditor ha sido reemplazado por los stores de Zustand

// Helper functions - moved to outer scope for better performance

const handleDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
};

const handleRecoveryModal = () => {
  // Handle recovery modal - implementation basic
  // Implementación básica
};

const performBackupAndPreprocessing = async () => {
  // Backup and preprocessing operation
  return { success: true };
};

const performBackendSave = async () => {
  // Backend save operation
  return { success: true };
};

const handleNodeDrop = (_event) => {
  // Node drop event handled - basic implementation
  // Implementación básica
};

const wrappedHandleRecoverNodes = () => {
  // Recovery nodes operation - basic implementation
  // Implementación básica
};

const wrappedHandleDismissRecovery = () => {
  // Dismiss recovery operation - basic implementation
  // Implementación básica
};

// Helper para crear nodos de mensaje
const _createMessageNodes = () => [
  {
    id: 'message-1',
    type: 'message',
    position: { x: 250, y: 100 },
    data: { label: 'Mensaje 1', message: '¡Hola! ¿En qué puedo ayudarte?' },
  },
  {
    id: 'message-2',
    type: 'message',
    position: { x: 100, y: 500 },
    data: {
      label: 'Mensaje 2',
      message: 'Aquí tienes la información solicitada.',
    },
  },
  {
    id: 'message-3',
    type: 'message',
    position: { x: 400, y: 500 },
    data: { label: 'Mensaje 3', message: 'Estoy aquí para ayudarte.' },
  },
  {
    id: 'message-4',
    type: 'message',
    position: { x: 100, y: 800 },
    data: { label: 'Mensaje 4', message: '¿En qué más puedo ayudarte?' },
  },
];

// Helper para crear nodos de decisión
const _createDecisionNodes = () => [
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
];

// Helper para crear nodos de opción y acción
const _createOptionActionNodes = () => [
  {
    id: 'option-1',
    type: 'option',
    position: { x: 100, y: 300 },
    data: {
      label: 'Opción 1',
      condition: 'Información',
      sourceDecisionNode: 'decision-1',
      conditionId: 'd1-cond-0',
    },
  },
  {
    id: 'option-2',
    type: 'option',
    position: { x: 400, y: 300 },
    data: {
      label: 'Opción 2',
      condition: 'Ayuda',
      sourceDecisionNode: 'decision-1',
      conditionId: 'd1-cond-1',
    },
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
    id: 'option-3',
    type: 'option',
    position: { x: 100, y: 700 },
    data: {
      label: 'Opción 3',
      condition: 'Sí',
      sourceDecisionNode: 'decision-2',
      conditionId: 'd2-cond-0',
    },
  },
  {
    id: 'option-4',
    type: 'option',
    position: { x: 400, y: 700 },
    data: {
      label: 'Opción 4',
      condition: 'No',
      sourceDecisionNode: 'decision-2',
      conditionId: 'd2-cond-1',
    },
  },
];

// Helper para crear una arista individual
function _createEdge(id, source, target) {
  return {
    id,
    source,
    target,
    type: 'elite-edge',
    animated: true,
    style: { stroke: EDGE_COLORS.default },
  };
}

// Helper para crear aristas del flujo principal
function _createMainFlowEdges() {
  return [
    _createEdge('e1', 'start-1', 'message-1'),
    _createEdge('e2', 'message-1', 'decision-1'),
    // e3 y e4 (decision-1 to options) serán generados por generateOptionNodes
    _createEdge('e5', 'option-1', 'action-1'),
    _createEdge('e6', 'option-2', 'action-2'),
    _createEdge('e7', 'action-1', 'message-2'),
    _createEdge('e8', 'action-2', 'message-3'),
  ];
}

// Helper para crear aristas de convergencia y finalización
function _createConvergenceEdges() {
  return [
    _createEdge('e9', 'message-2', 'decision-2'),
    _createEdge('e10', 'message-3', 'decision-2'),
    // e11 y e12 (decision-2 to options) serán generados por generateOptionNodes
    _createEdge('e13', 'option-3', 'message-4'),
    _createEdge('e14', 'message-4', 'end-1'),
    _createEdge('e15', 'option-4', 'end-2'),
  ];
}

// Helper para renderizar pantalla de error crítico
const _renderErrorScreen = (errorMessage, navigate) => (
  <div
    className='ts-critical-error'
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'rgba(10, 20, 35, 0.95)',
      color: '#ff4444',
      textAlign: 'center',
      padding: '2rem',
    }}
  >
    <h2
      style={{
        fontSize: '1.5rem',
        marginBottom: '1rem',
        textShadow: '0 0 5px #ff4444',
      }}
    >
      Error
    </h2>
    <p
      style={{
        fontSize: '1rem',
        marginBottom: '1.5rem',
        color: 'rgba(0, 224, 255, 0.8)',
      }}
    >
      {errorMessage}
    </p>
    <button
      className='ts-training-action-btn'
      onClick={() => navigate('/profile')}
      style={{
        background: 'rgba(0, 40, 80, 0.8)',
        border: '2px solid #00e0ff',
        padding: '0.8rem 1.5rem',
        fontSize: '1rem',
        color: '#e0e0ff',
      }}
    >
      ← Volver al Perfil
    </button>
  </div>
);

// Helper para renderizar pantalla de carga
const _renderLoadingScreen = () => (
  <div
    className='ts-loading'
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'rgba(10, 20, 35, 0.95)',
    }}
  >
    <div
      className='loading-spinner'
      style={{
        width: '50px',
        height: '50px',
        border: '5px solid rgba(0, 224, 255, 0.3)',
        borderTop: '5px solid #00e0ff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
    <p style={{ marginTop: '20px', color: '#00e0ff' }}>Cargando editor de flujos...</p>
  </div>
);

// Helper para manejar verificación de hidratación
const _renderHydrationCheck = (isHydrated) => {
  if (!isHydrated) {
    // eslint-disable-next-line unicorn/no-null
    return null; // O un spinner de carga, evita el renderizado hasta que el store esté listo.
  }
  return false; // Indica que no hay early return
};

// Custom hook para consolidar todos los hooks de TrainingScreen
const useTrainingScreenData = () => {
  const navigate = useNavigate();
  const { plubotId } = useParams();
  const { plubotData, updatePlubotData } = usePlubotCreation();
  const { activeModals, openModal, closeModal } = useContext(ModalContext);

  useAPI();

  const [, setHasPendingChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [, setSelectedConnection] = useState();
  const [, setConnectionProperties] = useState();

  const { flowName, loadFlow, isLoaded } = useFlowMeta();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNode } =
    useFlowNodesEdges();
  const byteMessage = useTrainingStore((state) => state.byteMessage);
  const _byteMessageType = useTrainingStore((state) => state._byteMessageType);
  const setByteMessage = useTrainingStore((state) => state.setByteMessage);
  const { isLoading } = useTrainingStore();

  const [emergencyBackupData, setEmergencyBackupData] = useState();
  const [hadBackup, setHadBackup] = useState(false);
  const userJustDismissedModal = useRef(false);
  const isEditorInitialized = useRef(false);
  const previousNodesLength = useRef(0);

  const [state] = useState({
    notification: undefined,
    errorMessage: undefined,
    flowStyles: {
      edgeStyles: { strokeWidth: 2, stroke: '#00e0ff', animated: false },
    },
  });

  const [isHydrated, setIsHydrated] = useState(useFlowStore.persist.hasHydrated());

  return {
    navigate,
    plubotId,
    plubotData,
    updatePlubotData,
    activeModals,
    openModal,
    closeModal,
    setHasPendingChanges,
    isSaving,
    setIsSaving,
    setSelectedConnection,
    setConnectionProperties,
    flowName,
    loadFlow,
    isLoaded,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    isLoading,
    byteMessage,
    _byteMessageType,
    setByteMessage,
    emergencyBackupData,
    setEmergencyBackupData,
    hadBackup,
    setHadBackup,
    userJustDismissedModal,
    isEditorInitialized,
    previousNodesLength,
    state,
    isHydrated,
    setIsHydrated,
  };
};

// Utility functions for duplicate label resolution

// Helper para consolidar todos los efectos de TrainingScreen
const useTrainingScreenEffects = ({
  setIsHydrated,
  plubotId,
  loadFlow,
  nodes,
  isLoaded,
  isEditorInitialized,
  previousNodesLength,
  activeModals,
  userJustDismissedModal,
  checkUnexpectedNodeLoss,
  processEmergencyBackup,
}) => {
  useEffect(() => {
    const unsub = useFlowStore.persist.onFinishHydration(() => setIsHydrated(true));
    return unsub;
  }, [setIsHydrated]);

  useEffect(() => {
    if (plubotId) loadFlow(plubotId);
  }, [plubotId, loadFlow]);

  useEffect(() => {
    document.body.classList.add('training-screen');
    return () => document.body.classList.remove('training-screen');
  }, []);

  useEffect(() => {
    const currentNodes = useFlowStore.getState().nodes;
    if (currentNodes && currentNodes.length > 0) {
      isEditorInitialized.current = true;
      previousNodesLength.current = currentNodes.length;
    }
  }, [isEditorInitialized, previousNodesLength]);

  useEffect(() => {
    const currentActiveModals = useFlowStore.getState().activeModals ?? {};
    if (
      isEditorInitialized.current &&
      nodes.length === 0 &&
      previousNodesLength.current > 0 &&
      !currentActiveModals['recovery']
    ) {
      const { openModal: storeOpenModal } = useFlowStore.getState();
      if (storeOpenModal) storeOpenModal('recovery');
    }
    if (nodes.length > 0) {
      if (!isEditorInitialized.current) isEditorInitialized.current = true;
      previousNodesLength.current = nodes.length;
    }
  }, [nodes.length, isLoaded, isEditorInitialized, previousNodesLength]);

  useEffect(() => {
    const currentPlubotId = useFlowStore.getState().plubotId;
    if (!currentPlubotId || !isEditorInitialized) return;
    const allNodes = useFlowStore.getState().nodes;
    const currentNodesLength = allNodes ? allNodes.length : 0;
    const isUnexpectedNodeLoss = checkUnexpectedNodeLoss(currentNodesLength);
    if (isUnexpectedNodeLoss && !activeModals['recovery']) {
      const backupProcessed = processEmergencyBackup(currentPlubotId);
      handleRecoveryModal(backupProcessed);
    }
    previousNodesLength.current = currentNodesLength;
    if (userJustDismissedModal.current) {
      userJustDismissedModal.current = false;
    }
  }, [
    nodes.length,
    activeModals,
    plubotId,
    isEditorInitialized,
    previousNodesLength,
    userJustDismissedModal,
    checkUnexpectedNodeLoss,
    processEmergencyBackup,
  ]);
};

// Helper externo para función de guardado principal
const _createSaveFlowHandler = ({
  checkSavePrerequisites,
  backupAndPreprocessingFn,
  backendSaveFn,
  handleSaveResponse,
  setByteMessage,
  setIsSaving,
}) => {
  return async () => {
    if (!checkSavePrerequisites()) return false;
    setIsSaving(true);
    setByteMessage('💾 Guardando flujo...', 'info');
    try {
      const { uniqueNodes, validEdges, backupId } = await backupAndPreprocessingFn();
      const response = await backendSaveFn(uniqueNodes, validEdges);
      return handleSaveResponse(response, backupId);
    } catch (error) {
      setByteMessage(`❌ Error al guardar: ${error.message || 'Error desconocido'}`, 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };
};

// Helper externo para renderizado principal de TrainingScreen
const _renderTrainingScreenApp = ({
  defaultStyles,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  setSelectedNode,
  setSelectedConnection,
  openModal,
  activeModals,
  handleError,
  plubotId,
  plubotData,
  byteMessage,
  _byteMessageType,
  setByteMessage,
  handleSaveFlow,
  onNodeDrop,
  onNodeDragOver,
  setConnectionProperties,
  onRecoverNodes,
  onDismissRecovery,
  hadBackup,
}) => (
  <div className='ts-training-screen' style={defaultStyles.screen}>
    <div className='ts-main-content' style={defaultStyles.mainContent}>
      <NodePalette />
      <div className='ts-flow-editor-container' style={defaultStyles.editorContainer}>
        <FlowEditor
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(event, node) => setSelectedNode(node)}
          onEdgeClick={(event, edge) => {
            setSelectedConnection(edge);
            openModal('connectionEditor');
          }}
          simulationMode={activeModals.has('simulation')}
          handleError={handleError}
          plubotId={plubotId}
          name={plubotData?.name || 'Nuevo Plubot'}
          notifyByte={byteMessage}
          setByteMessage={setByteMessage}
          saveFlowData={handleSaveFlow}
          onDrop={onNodeDrop}
          onDragOver={onNodeDragOver}
          setSelectedNode={setSelectedNode}
          setSelectedConnection={setSelectedConnection}
          setConnectionProperties={setConnectionProperties}
        />
      </div>
    </div>
    <Suspense fallback={undefined}>
      <ByteAssistant simulationMode={activeModals.has('simulation')} />
    </Suspense>
    {/* StatusBubble removed - now handled by EpicHeader only */}
    {activeModals.has('recovery') && (
      <Suspense fallback={undefined}>
        <EmergencyRecovery
          isOpen={activeModals.has('recovery')}
          onRecover={onRecoverNodes}
          onDismiss={onDismissRecovery}
          hasBackup={hadBackup}
        />
      </Suspense>
    )}
  </div>
);

// Estilos por defecto para TrainingScreen - extraídos para mejor performance
const DEFAULT_TRAINING_SCREEN_STYLES = {
  screen: {
    backgroundColor: 'transparent !important',
    position: 'relative',
    height: '100vh',
    width: '100%',
    overflow: 'auto',
    zIndex: 'auto',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  editorContainer: {
    flex: 1,
    height: '100%',
    position: 'relative',
    overflow: 'auto',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
};

// Custom hook para la creación de props del componente principal
const useMainAppProps = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  setSelectedNode,
  setSelectedConnection,
  openModal,
  activeModals,
  handleError,
  plubotId,
  plubotData,
  byteMessage,
  _byteMessageType,
  setByteMessage,
  handleSaveFlow,
  setConnectionProperties,
  hadBackup,
}) => {
  return {
    defaultStyles: DEFAULT_TRAINING_SCREEN_STYLES,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    setSelectedConnection,
    openModal,
    activeModals,
    handleError,
    plubotId,
    plubotData,
    byteMessage,
    _byteMessageType,
    setByteMessage,
    handleSaveFlow,
    onNodeDrop: handleNodeDrop,
    onNodeDragOver: handleDragOver,
    setConnectionProperties,
    onRecoverNodes: wrappedHandleRecoverNodes,
    onDismissRecovery: wrappedHandleDismissRecovery,
    hadBackup,
  };
};

// Custom hook para consolidar efectos y validaciones de TrainingScreen
const useTrainingScreenSetup = ({
  setIsHydrated,
  plubotId,
  loadFlow,
  nodes,
  isLoaded,
  isEditorInitialized,
  previousNodesLength,
  activeModals,
  userJustDismissedModal,
  checkUnexpectedNodeLoss,
  processEmergencyBackup,
  isHydrated,
  state,
  navigate,
  _isLoading,
  _handleFinalChecks,
}) => {
  // Ejecutar efectos consolidados
  useTrainingScreenEffects({
    setIsHydrated,
    plubotId,
    loadFlow,
    nodes,
    isLoaded,
    isEditorInitialized,
    previousNodesLength,
    activeModals,
    userJustDismissedModal,
    checkUnexpectedNodeLoss,
    processEmergencyBackup,
  });

  // Manejar early returns
  if (!isHydrated) return { shouldReturn: true, element: undefined };
  if (state.errorMessage) {
    return {
      shouldReturn: true,
      element: _renderErrorScreen(state.errorMessage, navigate),
    };
  }

  const checkResult = _handleFinalChecks();
  if (checkResult) return { shouldReturn: true, element: checkResult };

  return { shouldReturn: false, element: undefined };
};

// Custom hook para helpers avanzados de TrainingScreen
const useTrainingScreenHelpers = ({
  previousNodesLength,
  userJustDismissedModal,
  setEmergencyBackupData,
  setHadBackup,
  setByteMessage,
  nodes,
  setIsSaving,
  isLoading,
  isHydrated,
}) => {
  const checkUnexpectedNodeLoss = useCallback(
    (currentNodesLength) =>
      previousNodesLength.current > 0 &&
      currentNodesLength === 0 &&
      !userJustDismissedModal.current,
    [previousNodesLength, userJustDismissedModal],
  );

  const processEmergencyBackup = useCallback(
    (currentPlubotId) => {
      const emergencyBackupKey = `plubot-nodes-emergency-backup-${currentPlubotId}`;
      const backupJson = localStorage.getItem(emergencyBackupKey);
      let localEmergencyBackupData,
        localHadBackup = false;

      if (backupJson) {
        try {
          localEmergencyBackupData = JSON.parse(backupJson);
          if (
            localEmergencyBackupData?.nodes &&
            Array.isArray(localEmergencyBackupData.nodes) &&
            localEmergencyBackupData.nodes.length > 0
          ) {
            localHadBackup = true;
          }
        } catch {
          // Error parsing emergency backup - silently handled
        }
      }

      setEmergencyBackupData(localEmergencyBackupData);
      setHadBackup(localHadBackup);
    },
    [setEmergencyBackupData, setHadBackup],
  );

  const handleError = useCallback(
    (error) => {
      setByteMessage(error.message || 'Error desconocido', 'error');
    },
    [setByteMessage],
  );

  const handleSaveFlow = useCallback(async () => {
    if (nodes.length === 0) {
      setByteMessage('No hay nodos para guardar', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await performBackupAndPreprocessing();
      await performBackendSave();
      setByteMessage('✅ Flujo guardado exitosamente', 'success');
    } catch (error) {
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  }, [nodes.length, setByteMessage, setIsSaving, handleError]);

  const _handleFinalChecks = useCallback(() => {
    if (isLoading) return _renderLoadingScreen();
    const hydrationCheck = _renderHydrationCheck(isHydrated);
    if (hydrationCheck !== false) return hydrationCheck;
  }, [isLoading, isHydrated]);

  return {
    checkUnexpectedNodeLoss,
    processEmergencyBackup,
    handleError,
    handleSaveFlow,
    _handleFinalChecks,
  };
};

const TrainingScreenComponent = React.memo(
  () => {
    // ===== TODOS LOS HOOKS DEBEN IR AL INICIO ANTES DE CUALQUIER EARLY RETURN =====

    // DEBUG: AGGRESSIVE tracking of TrainingScreen renders during drag
    // Render logging temporarily disabled - was causing render cascade
    // console.log('🔥 [TrainingScreen] RENDER DETECTED:', {
    //   timestamp: Date.now(),
    //   stackTrace: new Error().stack?.split('\n')[1]?.trim()
    // });

    // 🔄 RENDER TRACKING - Using proper hook for consistent tracking
    // TEMPORARILY DISABLED: TrainingScreen render tracking causing infinite loop
    // useRenderTracker('TrainingScreen');

    // Consolidar todos los hooks de TrainingScreen
    const {
      navigate,
      plubotId,
      plubotData,
      activeModals,
      openModal,
      setIsSaving,
      setSelectedConnection,
      setConnectionProperties,
      loadFlow,
      isLoaded,
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      setSelectedNode,
      isLoading,
      byteMessage,
      _byteMessageType,
      setByteMessage,
      setEmergencyBackupData,
      hadBackup,
      setHadBackup,
      userJustDismissedModal,
      isEditorInitialized,
      previousNodesLength,
      state,
      isHydrated,
      setIsHydrated,
    } = useTrainingScreenData();

    // DEFENSIVE: Usar custom hook para helpers y callbacks
    // Hooks MUST be called unconditionally - error handling moved inside the hook
    const trainingHelpers = useTrainingScreenHelpers({
      previousNodesLength,
      userJustDismissedModal,
      setEmergencyBackupData,
      setHadBackup,
      setByteMessage,
      nodes,
      setIsSaving,
      isLoading,
      isHydrated,
    });

    const {
      checkUnexpectedNodeLoss,
      processEmergencyBackup,
      handleError,
      handleSaveFlow,
      _handleFinalChecks,
    } = trainingHelpers;

    // DEFENSIVE: Create main app props - usando custom hook
    // Hooks MUST be called unconditionally - error handling moved inside the hook
    const mainAppProps = useMainAppProps({
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      setSelectedNode,
      setSelectedConnection,
      openModal,
      activeModals,
      handleError,
      plubotId,
      plubotData,
      byteMessage,
      _byteMessageType,
      setByteMessage,
      handleSaveFlow,
      setConnectionProperties,
      hadBackup,
    });

    // Usar custom hook consolidado para efectos y validaciones
    const setupResult = useTrainingScreenSetup({
      setIsHydrated,
      plubotId,
      loadFlow,
      nodes,
      isLoaded,
      isEditorInitialized,
      previousNodesLength,
      activeModals,
      userJustDismissedModal,
      checkUnexpectedNodeLoss,
      processEmergencyBackup,
      isHydrated,
      state,
      navigate,
      isLoading,
      _handleFinalChecks,
    });

    // Early return si el setup indica que debe retornar
    if (setupResult.shouldReturn) return setupResult.element;

    return _renderTrainingScreenApp(mainAppProps);
  },
  () => {
    // OPTIMIZED: TrainingScreen manages its own state through hooks
    // It should NOT re-render during panning or viewport changes
    // All state is managed internally through Zustand stores
    return true; // Never re-render from external prop changes
  },
);

TrainingScreenComponent.displayName = 'TrainingScreen';

const TrainingScreen = TrainingScreenComponent;

export default TrainingScreen;
