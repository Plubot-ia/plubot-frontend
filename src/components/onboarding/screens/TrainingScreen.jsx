import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
  useMemo,
  useContext,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import 'reactflow/dist/style.css';
import '@/assets/css/hide-watermark.css';

import { ModalContext } from '@/context/modal/ModalContext';
import useAPI from '@/hooks/useAPI';
import usePlubotLoader from '@/hooks/usePlubotLoader';
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
import { backupEdgesToLocalStorage } from '../flow-editor/utils/edgeFixUtility';

// El custom hook useFlowEditor ha sido reemplazado por los stores de Zustand

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

/**
 * Crea los nodos iniciales para el editor de flujo
 * @returns {Array} Array de nodos iniciales
 */
const createInitialNodes = () => [
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

/**
 * Crea las aristas iniciales para el editor de flujo
 * @returns {Array} Array de aristas iniciales
 */
const createInitialEdges = () => [
  {
    id: 'e1',
    source: 'start-1',
    target: 'message-1',
    type: 'elite-edge',
    animated: true,
    style: { stroke: EDGE_COLORS.default },
  },
  {
    id: 'e2',
    source: 'message-1',
    target: 'decision-1',
    type: 'elite-edge',
    animated: true,
    style: { stroke: EDGE_COLORS.default },
  },
  // e3 (decision-1 to option-1) será generado por generateOptionNodes
  // e4 (decision-1 to option-2) será generado por generateOptionNodes
  {
    id: 'e5',
    source: 'option-1',
    target: 'action-1',
    type: 'elite-edge',
    animated: true,
    style: { stroke: EDGE_COLORS.default },
  },
  {
    id: 'e6',
    source: 'option-2',
    target: 'action-2',
    type: 'elite-edge',
    animated: true,
    style: { stroke: EDGE_COLORS.default },
  },
  {
    id: 'e7',
    source: 'action-1',
    target: 'message-2',
    type: 'elite-edge',
    animated: true,
    style: { stroke: EDGE_COLORS.default },
  },
  {
    id: 'e8',
    source: 'action-2',
    target: 'message-3',
    type: 'elite-edge',
    animated: true,
    style: { stroke: EDGE_COLORS.default },
  },
  {
    id: 'e9',
    source: 'message-2',
    target: 'decision-2',
    type: 'elite-edge',
    animated: true,
    style: { stroke: EDGE_COLORS.default },
  },
  {
    id: 'e10',
    source: 'message-3',
    target: 'decision-2',
    type: 'elite-edge',
    animated: true,
    style: { stroke: EDGE_COLORS.default },
  },
  // e11 (decision-2 to option-3) será generado por generateOptionNodes
  // e12 (decision-2 to option-4) será generado por generateOptionNodes
  {
    id: 'e13',
    source: 'option-3',
    target: 'message-4',
    type: 'elite-edge',
    animated: true,
    style: { stroke: EDGE_COLORS.default },
  },
  {
    id: 'e14',
    source: 'message-4',
    target: 'end-1',
    type: 'elite-edge',
    animated: true,
    style: { stroke: EDGE_COLORS.default },
  },
  {
    id: 'e15',
    source: 'option-4',
    target: 'end-2',
    type: 'elite-edge',
    animated: true,
    style: { stroke: EDGE_COLORS.default },
  },
];

const TrainingScreen = () => {
  // ===== TODOS LOS HOOKS DEBEN IR AL INICIO ANTES DE CUALQUIER EARLY RETURN =====

  // Hooks y contextos
  const navigate = useNavigate();
  const { plubotId } = useParams();
  const { plubotData, updatePlubotData } = usePlubotCreation();
  const { activeModals, openModal, closeModal } = useContext(ModalContext);

  useAPI();

  // Referencias y estado local
  const [, setHasPendingChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [, setSelectedConnection] = useState();
  const [, setConnectionProperties] = useState();

  // --- Hooks de Zustand: Uso exclusivo de selectores seguros ---
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

  // --- Estado local y Refs ---
  const [emergencyBackupData, setEmergencyBackupData] = useState();
  const [hadBackup, setHadBackup] = useState(false);
  const userJustDismissedModal = useRef(false);
  const isEditorInitialized = useRef(false);
  const previousNodesLength = useRef(0);

  // Estado local simplificado para mantener compatibilidad con el código existente
  const [state] = useState({
    notification: undefined,
    errorMessage: undefined,
    flowStyles: {
      edgeStyles: { strokeWidth: 2, stroke: '#00e0ff', animated: false },
    },
  });

  // --- Lógica de Hidratación de Zustand ---
  const [isHydrated, setIsHydrated] = useState(
    useFlowStore.persist.hasHydrated(),
  );

  // TODOS LOS useEffect DEBEN IR AQUÍ ANTES DE LOS EARLY RETURNS
  useEffect(() => {
    const unsub = useFlowStore.persist.onFinishHydration(() =>
      setIsHydrated(true),
    );
    return unsub;
  }, []);

  // Efecto para recargar el flujo. Se ejecuta en cada montaje para garantizar datos frescos.
  useEffect(() => {
    if (plubotId) {
      loadFlow(plubotId);
    }
  }, [plubotId, loadFlow]);

  useEffect(() => {
    document.body.classList.add('training-screen');
    return () => document.body.classList.remove('training-screen');
  }, []);

  // Efecto para inicializar el estado del editor
  useEffect(() => {
    const currentNodes = useFlowStore.getState().nodes;
    if (currentNodes && currentNodes.length > 0) {
      isEditorInitialized.current = true;
      previousNodesLength.current = currentNodes.length;
    }
  }, []);

  // Nodos iniciales para el editor de flujo
  const initialNodes = useMemo(() => createInitialNodes(), []);

  // Aristas iniciales para el editor de flujo
  const initialEdges = useMemo(() => createInitialEdges(), []);

  // Integrate new loader hook (now after constants are defined)
  usePlubotLoader({
    plubotId,
    plubotData,
    initialNodes,
    initialEdges,
  });

  // TODOS LOS useCallback DEBEN IR AQUÍ DESPUÉS DE LOS useMemo
  const handleError = useCallback(
    // eslint-disable-next-line unicorn/no-null
    (errorMessage, consoleError = null) => {
      setByteMessage(`⚠️ Error: ${errorMessage}`);
      // Los errores de consola se silencian en producción
    },
    [setByteMessage],
  );

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
      setByteMessage(
        '⏳ Datos aún cargando, espera un momento antes de guardar.',
      );
      return false;
    }

    // Verificar si hay nodos para guardar
    if (nodes.length === 0) {
      setByteMessage('⚠️ No hay nodos en el editor');
      return false;
    }

    // Verificar si tenemos la función para actualizar datos y el ID del plubot
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

  /**
   * Resuelve etiquetas duplicadas en los nodos
   * @param {Array} processedNodes - Los nodos a procesar
   * @returns {Array} Los nodos con etiquetas únicas
   */
  const resolveDuplicateLabels = useCallback(
    (processedNodes) => {
      // Extraer mensajes de usuario de los nodos
      const userMessages = processedNodes.map((node, index) => ({
        user_message: node.data?.label || `Nodo ${index + 1}`,
        position: index,
        nodeId: node.id,
      }));

      // Identificar duplicados
      const duplicates = [];
      for (let index = 0; index < userMessages.length; index++) {
        const current = userMessages[index];
        const isDuplicated = userMessages.some(
          (other, otherIndex) =>
            otherIndex !== index &&
            other.user_message.toLowerCase() ===
              current.user_message.toLowerCase(),
        );
        if (isDuplicated) {
          duplicates.push(current.user_message);
        }
      }

      // Si no hay duplicados, devolver los nodos originales
      if (duplicates.length === 0) return processedNodes;

      // Resolver duplicados
      setByteMessage(`⚠️ Hay mensajes duplicados. Resolviendo...`);

      const newNodes = [...processedNodes];
      const usedLabels = new Set(
        processedNodes.map((n) =>
          n.data?.label ? n.data.label.toLowerCase() : `node-${n.id}`,
        ),
      );

      // Crear etiquetas únicas para los duplicados
      for (const duplicate of duplicates) {
        const nodeIndex = newNodes.findIndex(
          (n) => n.data?.label === duplicate,
        );
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
      }

      // Actualizar nodos con nombres únicos
      onNodesChange(
        newNodes.map((node, index) => ({
          type: 'replace',
          item: node,
          index,
        })),
      );

      return newNodes;
    },
    [onNodesChange, setByteMessage],
  );

  /**
   * Elimina nodos con IDs duplicados y asegura que las aristas sean válidas
   * @param {Array} updatedNodes - Los nodos a procesar
   * @returns {Object} Objeto con nodos y aristas válidos
   */
  const validateNodesAndEdges = useCallback(
    (updatedNodes) => {
      // Eliminar nodos con IDs duplicados
      const uniqueNodes = [];
      const nodeIds = new Set();

      for (const node of updatedNodes) {
        if (nodeIds.has(node.id)) {
          // Nodo duplicado encontrado y eliminado silenciosamente
        } else {
          nodeIds.add(node.id);
          uniqueNodes.push(node);
        }
      }

      // Validar que cada arista tenga nodos fuente y destino existentes
      const validEdges = edges.filter((edge) => {
        const isValid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
        return isValid;
      });

      return { uniqueNodes, validEdges };
    },
    [edges],
  );

  /**
   * Crea un backup local de los nodos y aristas
   * @param {Array} nodes - Los nodos a respaldar
   * @param {Array} edges - Las aristas a respaldar
   * @returns {string} El ID del backup creado
   */
  const createLocalBackup = useCallback(
    (flowNodes, flowEdges) => {
      const backupId = `backup_${plubotId}_${Date.now()}`;

      try {
        localStorage.setItem(
          backupId,
          JSON.stringify({
            nodes: flowNodes,
            edges: flowEdges,
            flowName: flowName || 'Flujo sin título',
            timestamp: Date.now(),
          }),
        );
        return backupId;
      } catch {
        // Error al guardar en localStorage, fallar silenciosamente
      }
    },
    [plubotId, flowName],
  );

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
      const processedNodes = structuredClone(nodes);

      // Resolver etiquetas duplicadas
      const nodesWithUniqueLabels = resolveDuplicateLabels(processedNodes);

      // Validar nodos y aristas
      const { uniqueNodes, validEdges } = validateNodesAndEdges(
        nodesWithUniqueLabels,
      );

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
            } catch {
              // Fallar silenciosamente
            }
          }, 60_000);
        }

        return true;
      } else {
        setByteMessage(
          `❌ Error al guardar: ${response?.error || 'Error desconocido'}`,
        );
        return false;
      }
    } catch (error) {
      setByteMessage(
        `❌ Error al guardar: ${error.message || 'Error desconocido'}`,
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    checkSavePrerequisites,
    resolveDuplicateLabels,
    validateNodesAndEdges,
    createLocalBackup,
    nodes,
    edges,
    plubotData,
    updatePlubotData,
    setByteMessage,
    setHasPendingChanges,
    setIsSaving,
    flowName,
  ]);

  // Mantener compatibilidad con el código existente
  async function saveFlowData() {
    return handleSaveFlow();
  }

  // NOTA: Se eliminó el useEffect automático de guardado para evitar loops infinitos
  // El guardado se maneja a través de eventos específicos del usuario

  // NOTA: Los modales específicos de TrainingScreen fueron removidos ya que no se utilizan
  // Los modales activos son gestionados por GlobalProvider

  // Hooks de drag and drop - movidos aquí para cumplir reglas de React Hooks
  const extractDraggedData = useCallback(
    (event) => {
      try {
        const formats = [
          'application/reactflow',
          'text/plain',
          'application/json',
        ];
        for (const format of formats) {
          const data = event.dataTransfer.getData(format);
          if (data) return data;
        }
        setByteMessage('❌ No se recibieron datos del nodo arrastrado');
      } catch {
        setByteMessage('❌ Error al procesar el nodo arrastrado');
      }
    },
    [setByteMessage],
  );

  const getDropPosition = useCallback((event, reactFlowBounds) => {
    const defaultPosition = { x: 250, y: 200 };
    try {
      if (!event.clientX || !event.clientY) {
        return defaultPosition;
      }
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      if (position.x < 0 || position.y < 0) {
        return defaultPosition;
      }
      return position;
    } catch {
      return defaultPosition;
    }
  }, []);

  const createNodeFromData = useCallback(
    (jsonData, position) => {
      try {
        const parsedData = JSON.parse(jsonData);
        if (!parsedData.nodeInfo?.nodeType) {
          setByteMessage('⚠️ Formato de nodo incorrecto');
          return;
        }
        const { nodeType, label, powerItemData, category } =
          parsedData.nodeInfo;
        const { addNode } = useFlowStore.getState();
        const newNodeId = `${nodeType}-${Date.now()}`;
        addNode(nodeType, position, {
          id: newNodeId,
          label: label || 'Nuevo nodo',
          category: category || 'default',
          ...powerItemData,
        });
        setByteMessage(`✅ Nodo "${label}" añadido al editor`);
        setTimeout(handleSaveFlow, 1000);
      } catch {
        setByteMessage('❌ Error al añadir nodo');
      }
    },
    [setByteMessage, handleSaveFlow],
  );

  const handleNodeDrop = useCallback(
    (event) => {
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
    },
    [extractDraggedData, getDropPosition, createNodeFromData, setByteMessage],
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleRecoverNodes = () => {
    if (
      emergencyBackupData &&
      emergencyBackupData.nodes &&
      emergencyBackupData.edges
    ) {
      useFlowStore.getState().setNodes(emergencyBackupData.nodes);
      useFlowStore.getState().setEdges(emergencyBackupData.edges);
    }
  };

  const handleDismissRecovery = () => {
    const currentPlubotId = useFlowStore.getState().plubotId;

    const emergencyBackupKey = `plubot-nodes-emergency-backup-${currentPlubotId}`;
    localStorage.removeItem(emergencyBackupKey);
    setEmergencyBackupData(undefined);
    setHadBackup(false); // Importante: actualizar el estado

    // Siempre resetear a un flujo limpio (con nodos por defecto) al descartar,
    // independientemente de si había un backup o no, porque el usuario eligió no restaurar o no había nada que restaurar.

    loadFlow(currentPlubotId);
  };

  // Wrappers para las acciones del modal EmergencyRecovery
  const wrappedHandleRecoverNodes = () => {
    userJustDismissedModal.current = true;
    closeModal('recovery');
    handleRecoverNodes();
  };

  const wrappedHandleDismissRecovery = () => {
    userJustDismissedModal.current = true;
    closeModal('recovery');
    handleDismissRecovery();
  };

  // Efecto para inicializar el estado del editor
  useEffect(() => {
    const currentNodes = useFlowStore.getState().nodes;
    if (currentNodes && currentNodes.length > 0) {
      isEditorInitialized.current = true;
      previousNodesLength.current = currentNodes.length;
    }
  }, []);

  // Sistema de recuperación de emergencia mejorado
  useEffect(() => {
    // Solo verificar si el editor ya fue inicializado con nodos
    const currentActiveModals = useFlowStore.getState().activeModals || {};
    if (
      isEditorInitialized.current &&
      nodes.length === 0 &&
      previousNodesLength.current > 0 &&
      !currentActiveModals['recovery']
    ) {
      // Usar la función del store directamente para evitar dependencias
      const { openModal: storeOpenModal } = useFlowStore.getState();
      if (storeOpenModal) {
        storeOpenModal('recovery');
      }
    }

    // Actualizar la referencia de longitud previa
    if (nodes.length > 0) {
      if (!isEditorInitialized.current) {
        isEditorInitialized.current = true;
      }
      previousNodesLength.current = nodes.length;
    }
  }, [nodes.length, isLoaded]); // Dependencias estables sin activeModals/openModal

  // Efecto para detectar pérdida inesperada de nodos (solo después de inicialización)
  useEffect(() => {
    const currentPlubotId = useFlowStore.getState().plubotId;

    if (!currentPlubotId || !isEditorInitialized) return;

    const allNodes = useFlowStore.getState().nodes;
    const currentNodesLength = allNodes ? allNodes.length : 0;

    // Solo activar recuperación de emergencia si:
    // 1. El editor ya estaba inicializado con nodos
    // 2. Los nodos desaparecieron inesperadamente (de >0 a 0)
    // 3. No es una acción intencional del usuario
    const isUnexpectedNodeLoss =
      previousNodesLength.current > 0 &&
      currentNodesLength === 0 &&
      !userJustDismissedModal.current;

    if (isUnexpectedNodeLoss && !activeModals['recovery']) {
      const emergencyBackupKey = `plubot-nodes-emergency-backup-${currentPlubotId}`;
      const backupJson = localStorage.getItem(emergencyBackupKey);

      let localEmergencyBackupData;
      let localHadBackup = false;

      if (backupJson) {
        try {
          localEmergencyBackupData = JSON.parse(backupJson);
          if (
            localEmergencyBackupData &&
            localEmergencyBackupData.nodes &&
            localEmergencyBackupData.edges
          ) {
            localHadBackup = true;
          }
        } catch {
          localStorage.removeItem(emergencyBackupKey); // Eliminar backup corrupto
        }
      }

      setEmergencyBackupData(localEmergencyBackupData);
      setHadBackup(localHadBackup);

      // Solo mostrar modal si hay un backup válido
      if (localHadBackup) {
        // Usar la función del store directamente para evitar dependencias problemáticas
        const { openModal: storeOpenModal } = useFlowStore.getState();
        if (storeOpenModal) {
          storeOpenModal('recovery');
        }
      }
    }

    // Actualizar referencia del conteo anterior
    previousNodesLength.current = currentNodesLength;

    // Resetear bandera si el usuario cerró el modal
    if (userJustDismissedModal.current) {
      userJustDismissedModal.current = false;
    }
  }, [nodes.length, activeModals, plubotId, isEditorInitialized]);

  if (state.errorMessage) {
    return (
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
          {state.errorMessage}
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
  }

  if (isLoading) {
    return (
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
  }

  if (!isHydrated) {
    // eslint-disable-next-line unicorn/no-null
    return null; // O un spinner de carga
  }

  // Renderizar componente de error si hay un mensaje de error
  if (state.errorMessage) {
    return (
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
          {state.errorMessage}
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
  }

  if (isLoading) {
    return (
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
  if (!isHydrated) {
    // eslint-disable-next-line unicorn/no-null
    return null; // O un spinner de carga, evita el renderizado hasta que el store esté listo.
  }

  return (
    <div className='ts-training-screen' style={screenStyles}>
      <div className='ts-main-content' style={mainContentStyles}>
        <NodePalette />

        <div className='ts-flow-editor-container' style={editorContainerStyles}>
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
            onDrop={handleNodeDrop}
            onDragOver={handleDragOver}
            setSelectedNode={setSelectedNode}
            setSelectedConnection={setSelectedConnection}
            setConnectionProperties={setConnectionProperties}
          />
        </div>
      </div>

      {/* ByteAssistant siempre visible */}
      {/* eslint-disable-next-line unicorn/no-null */}
      <Suspense fallback={null}>
        <ByteAssistant simulationMode={activeModals.has('simulation')} />
      </Suspense>

      {/* StatusBubble condicional */}
      {byteMessage && !activeModals.has('simulation') && (
        <StatusBubble message={byteMessage} />
      )}

      {activeModals.has('recovery') && (
        // eslint-disable-next-line unicorn/no-null
        <Suspense fallback={null}>
          <EmergencyRecovery
            isOpen={activeModals.has('recovery')}
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
