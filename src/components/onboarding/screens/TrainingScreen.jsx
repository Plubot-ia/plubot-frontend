import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
  useContext,
} from 'react';
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
import StatusBubble from '../common/StatusBubble';
import EmergencyRecovery from '../flow-editor/components/EmergencyRecovery.jsx';
import FlowEditor from '../flow-editor/FlowEditor.jsx';

// El custom hook useFlowEditor ha sido reemplazado por los stores de Zustand

// Helper functions - moved to outer scope for better performance
const getDropPosition = (event, reactFlowBounds) => {
  const defaultPosition = { x: 250, y: 200 };
  try {
    if (!event.clientX || !event.clientY) return defaultPosition;
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };
    return position.x < 0 || position.y < 0 ? defaultPosition : position;
  } catch {
    return defaultPosition;
  }
};

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

const handleNodeDrop = (event) => {
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

// Función auxiliar para extraer el ID del plubot de la URL
const extractPlubotIdFromUrl = (searchParameters, pathname) => {
  // Primero intenta obtener el ID de los parámetros de la URL
  let plubotId = searchParameters.get('plubotId');

  // Si no hay ID en los parámetros, intenta obtenerlo de la ruta
  if (!plubotId) {
    const pathParts = pathname.split('/');
    const lastSegment = pathParts.at(-1);

    if (lastSegment && !Number.isNaN(Number.parseInt(lastSegment, 10))) {
      plubotId = lastSegment;
    }
  }

  // Verificar si tenemos un ID válido
  if (plubotId && !Number.isNaN(Number.parseInt(plubotId, 10))) {
    return plubotId;
  }

  // ID por defecto para desarrollo

  return '130';
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

/**
 * Crea los nodos iniciales para el editor de flujo
 * @returns {Array} Array de nodos iniciales
 */
const createInitialNodes = () => [
  // Nodo de inicio
  {
    id: 'start-1',
    type: 'start',
    position: { x: 250, y: 5 },
    data: { label: 'Inicio' },
  },
  // Usar helpers para crear nodos por tipo
  ..._createMessageNodes(),
  ..._createDecisionNodes(),
  ..._createOptionActionNodes(),
  // Nodos de fin
  {
    id: 'end-1',
    type: 'end',
    position: { x: 100, y: 900 },
    data: {
      label: 'Fin 1',
      endMessage: 'Gracias por usar nuestro servicio.',
    },
  },
  {
    id: 'end-2',
    type: 'end',
    position: { x: 400, y: 800 },
    data: { label: 'Fin 2', endMessage: '¡Hasta pronto!' },
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

/**
 * Crea las aristas iniciales para el editor de flujo
 * @returns {Array} Array de aristas iniciales
 */
const createInitialEdges = () => [
  ..._createMainFlowEdges(),
  ..._createConvergenceEdges(),
];

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
    <p style={{ marginTop: '20px', color: '#00e0ff' }}>
      Cargando editor de flujos...
    </p>
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
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
  } = useFlowNodesEdges();
  const { isLoading, byteMessage, setByteMessage } = useTrainingStore();

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

  const [isHydrated, setIsHydrated] = useState(
    useFlowStore.persist.hasHydrated(),
  );

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

// Helper para consolidar todos los callbacks de TrainingScreen
const useTrainingScreenCallbacks = ({
  setByteMessage,
  isSaving,
  nodes,
  plubotData,
  plubotId,
  updatePlubotData,
}) => {
  const handleError = useCallback(
    // eslint-disable-next-line unicorn/no-null
    (errorMessage, consoleError = null) => {
      setByteMessage(`⚠️ Error: ${errorMessage}`);
    },
    [setByteMessage],
  );

  const checkSavePrerequisites = useCallback(() => {
    if (isSaving) return false;
    const isDataLoaded = plubotData && Object.keys(plubotData).length > 0;
    if (!isDataLoaded) {
      setByteMessage(
        '⏳ Datos aún cargando, espera un momento antes de guardar.',
      );
      return false;
    }
    if (nodes.length === 0) {
      setByteMessage('⚠️ No hay nodos en el editor');
      return false;
    }
    if (!updatePlubotData || !plubotId) {
      setByteMessage('⚠️ Error al guardar: falta el ID del Plubot.');
      return false;
    }
    return true;
  }, [
    isSaving,
    nodes.length,
    plubotData,
    plubotId,
    updatePlubotData,
    setByteMessage,
  ]);

  const _extractUserMessages = useCallback((processedNodes) => {
    return processedNodes.map((node, index) => ({
      user_message: node.data?.label || `Nodo ${index + 1}`,
      position: index,
      nodeId: node.id,
    }));
  }, []);

  return { handleError, checkSavePrerequisites, _extractUserMessages };
};

// Utility functions for duplicate label resolution
const findDuplicateLabels = (userMessages) => {
  const duplicates = [];
  for (let index = 0; index < userMessages.length; index++) {
    const current = userMessages.at(index);
    if (!current) continue;
    const isDuplicated = userMessages.some(
      (other, otherIndex) =>
        otherIndex !== index &&
        other.user_message.toLowerCase() === current.user_message.toLowerCase(),
    );
    if (isDuplicated) {
      duplicates.push(current.user_message);
    }
  }
  return duplicates;
};

const processUniqueLabelsGeneration = ({
  processedNodes,
  duplicates,
  usedLabels,
  updateNodes,
}) => {
  const newNodes = [...processedNodes];
  for (const duplicate of duplicates) {
    const nodeIndex = newNodes.findIndex((n) => n.data?.label === duplicate);
    if (
      nodeIndex !== -1 &&
      nodeIndex < newNodes.length &&
      Number.isInteger(nodeIndex)
    ) {
      let newLabel = duplicate;
      let counter = 1;
      while (usedLabels.has(newLabel.toLowerCase())) {
        newLabel = `${duplicate}-${counter}`;
        counter++;
      }
      usedLabels.add(newLabel.toLowerCase());
      const targetNode = newNodes.at(nodeIndex);
      if (targetNode && typeof targetNode === 'object') {
        const updatedNode = {
          ...targetNode,
          data: { ...targetNode.data, label: newLabel },
        };
        newNodes.splice(nodeIndex, 1, updatedNode);
      }
    }
  }
  updateNodes(
    newNodes.map((node, index) => ({ type: 'replace', item: node, index })),
  );
  return newNodes;
};

// Helper para consolidar resolución de etiquetas duplicadas
const useDuplicateLabelResolver = ({
  _extractUserMessages,
  onNodesChange,
  setByteMessage,
}) => {
  const resolveDuplicateLabels = useCallback(
    (processedNodes) => {
      const userMessages = _extractUserMessages(processedNodes);
      const duplicates = findDuplicateLabels(userMessages);
      if (duplicates.length === 0) return processedNodes;
      setByteMessage(`⚠️ Hay mensajes duplicados. Resolviendo...`);
      const usedLabels = new Set(
        processedNodes.map((n) =>
          n.data?.label ? n.data.label.toLowerCase() : `node-${n.id}`,
        ),
      );
      return processUniqueLabelsGeneration({
        processedNodes,
        duplicates,
        usedLabels,
        updateNodes: onNodesChange,
      });
    },
    [_extractUserMessages, onNodesChange, setByteMessage],
  );

  return { resolveDuplicateLabels };
};

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
    const unsub = useFlowStore.persist.onFinishHydration(() =>
      setIsHydrated(true),
    );
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
    const currentActiveModals = useFlowStore.getState().activeModals || {};
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

// Helper externo para operaciones de guardado
const _createSaveOperationsHelpers = ({
  edges,
  plubotId,
  flowName,
  nodes,
  resolveDuplicateLabels,
  plubotData,
  updatePlubotData,
  setByteMessage,
  setHasPendingChanges,
}) => {
  const handleSaveResponse = (response, backupId) => {
    if (response && response.status === 'success') {
      setByteMessage('✅ Flujo guardado correctamente');
      setHasPendingChanges(false);
      if (backupId) {
        setTimeout(() => {
          try {
            localStorage.removeItem(backupId);
          } catch {}
        }, 60_000);
      }
      return true;
    } else {
      setByteMessage(
        `❌ Error al guardar: ${response?.error || 'Error desconocido'}`,
      );
      return false;
    }
  };

  return {
    performBackupAndPreprocessing,
    performBackendSave,
    handleSaveResponse,
  };
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
    setByteMessage('💾 Guardando flujo...');
    try {
      const { uniqueNodes, validEdges, backupId } =
        await backupAndPreprocessingFn();
      const response = await backendSaveFn(uniqueNodes, validEdges);
      return handleSaveResponse(response, backupId);
    } catch (error) {
      setByteMessage(
        `❌ Error al guardar: ${error.message || 'Error desconocido'}`,
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };
};

// Helper externo para operaciones de drag and drop
const _createDragDropHelpers = ({ setByteMessage, handleSaveFlow }) => {
  return { handleNodeDrop, handleDragOver };
};

// Helper externo para operaciones de recovery y backup
const _createRecoveryHelpers = ({
  emergencyBackupData,
  setEmergencyBackupData,
  setHadBackup,
  loadFlow,
  closeModal,
  userJustDismissedModal,
  previousNodesLength,
}) => {
  const handleRecoverNodes = () => {
    if (emergencyBackupData?.nodes && emergencyBackupData?.edges) {
      useFlowStore.getState().setNodes(emergencyBackupData.nodes);
      useFlowStore.getState().setEdges(emergencyBackupData.edges);
    }
  };

  const handleDismissRecovery = () => {
    const currentPlubotId = useFlowStore.getState().plubotId;
    const emergencyBackupKey = `plubot-nodes-emergency-backup-${currentPlubotId}`;
    localStorage.removeItem(emergencyBackupKey);
    setEmergencyBackupData(undefined);
    setHadBackup(false);
    loadFlow(currentPlubotId);
  };

  return { handleRecoverNodes, handleDismissRecovery };
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
      <div
        className='ts-flow-editor-container'
        style={defaultStyles.editorContainer}
      >
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
    {byteMessage && !activeModals.has('simulation') && (
      <StatusBubble message={byteMessage} />
    )}
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
  isLoading,
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
      setByteMessage({
        type: 'error',
        message: error.message || 'Error desconocido',
      });
    },
    [setByteMessage],
  );

  const handleSaveFlow = useCallback(async () => {
    if (nodes.length === 0) {
      setByteMessage({ type: 'error', message: 'No hay nodos para guardar' });
      return;
    }

    setIsSaving(true);
    try {
      await performBackupAndPreprocessing();
      await performBackendSave();
      setByteMessage({ type: 'success', message: 'Guardado exitoso' });
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

const TrainingScreen = () => {
  // ===== TODOS LOS HOOKS DEBEN IR AL INICIO ANTES DE CUALQUIER EARLY RETURN =====

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

  // Usar custom hook para helpers y callbacks
  const {
    checkUnexpectedNodeLoss,
    processEmergencyBackup,
    handleError,
    handleSaveFlow,
    _handleFinalChecks,
  } = useTrainingScreenHelpers({
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

  // Create main app props - usando custom hook
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
};

export default TrainingScreen;
