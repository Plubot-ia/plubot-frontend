import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import { usePlubotCreation } from '@/context/PlubotCreationContext';
import { useGamification } from '@/context/GamificationContext';
import { v4 as uuidv4 } from 'uuid';
import useAPI from '@/hooks/useAPI';
import { validateConnections, analyzeFlowRoutes, generateNodeSuggestions } from '@/utils/flowValidation';
import useDebounce from '@/hooks/useDebounce';
import FlowEditor from '../flow-editor/FlowEditor.jsx';
import NodePalette from '../common/NodePalette';
import ByteAssistant from '../common/ByteAssistant';
import StatusBubble from '../common/StatusBubble';
import logo from '@/assets/img/plubot.svg';
import './TrainingScreen.css';
import '../styles/responsive.css'; // Estilos responsivos para todos los componentes
import '../fix-global.css'; // CSS global para eliminar overlays oscuros y mensajes duplicados

// Lazy-loaded components
const TemplateSelector = lazy(() => import('../modals/TemplateSelector'));
const ImportExportModal = lazy(() => import('../modals/ImportExportModal'));
const ConnectionEditor = lazy(() => import('../simulation/ConnectionEditor'));
const RouteAnalysisPanel = lazy(() => import('../common/RouteAnalysisPanel'));
const VersionHistory = lazy(() => import('../common/VersionHistory'));
const SuggestionsModal = lazy(() => import('../modals/SuggestionsModal'));
const EmbedModal = lazy(() => import('../modals/EmbedModal'));

// Modal Manager to handle conditional rendering of modals
const ModalManager = ({ modals, modalProps, onClose }) => (
  <>
    {modals.showTemplateSelector && (
      <Suspense fallback={<div>Loading...</div>}>
        <TemplateSelector {...modalProps.templateSelector} onClose={() => onClose('showTemplateSelector')} />
      </Suspense>
    )}
    {modals.showExportMode && (
      <Suspense fallback={<div>Loading...</div>}>
        <ImportExportModal {...modalProps.importExport} onClose={() => onClose('showExportMode')} />
      </Suspense>
    )}
    {modals.showConnectionEditor && (
      <Suspense fallback={<div>Loading...</div>}>
        <ConnectionEditor {...modalProps.connectionEditor} onClose={() => onClose('showConnectionEditor')} />
      </Suspense>
    )}
    {modals.showRouteAnalysis && (
      <Suspense fallback={<div>Loading...</div>}>
        <RouteAnalysisPanel {...modalProps.routeAnalysis} onClose={() => onClose('showRouteAnalysis')} />
      </Suspense>
    )}
    {modals.showSuggestionsModal && (
      <Suspense fallback={<div>Loading...</div>}>
        <SuggestionsModal {...modalProps.suggestionsModal} onClose={() => onClose('showSuggestionsModal')} />
      </Suspense>
    )}
    {modals.showEmbedModal && (
      <Suspense fallback={<div>Loading...</div>}>
        <EmbedModal {...modalProps.embedModal} onClose={() => onClose('showEmbedModal')} />
      </Suspense>
    )}
  </>
);

// Custom hook for flow management
const useFlowEditor = (initialNodes, initialEdges) => {
  const [flowState, setFlowState] = useState({
    nodes: initialNodes,
    edges: initialEdges,
    selectedNode: null,
  });

  const setNodes = useCallback((nodesOrUpdater) => {
    setFlowState((prev) => ({
      ...prev,
      nodes: typeof nodesOrUpdater === 'function' ? nodesOrUpdater(prev.nodes) : nodesOrUpdater,
    }));
  }, []);

  const setEdges = useCallback((edgesOrUpdater) => {
    setFlowState((prev) => ({
      ...prev,
      edges: typeof edgesOrUpdater === 'function' ? edgesOrUpdater(prev.edges) : edgesOrUpdater,
    }));
  }, []);

  const setSelectedNode = useCallback((node) => {
    setFlowState((prev) => ({ ...prev, selectedNode: node }));
  }, []);

  return { ...flowState, setNodes, setEdges, setSelectedNode };
};

const TrainingScreen = () => {
  const [searchParams] = useSearchParams();
  const plubotIdFromUrl = searchParams.get('plubotId') || null;
  const { plubotData, updatePlubotData, resetPlubotCreation } = usePlubotCreation();
  const { addXp, addPluCoins } = useGamification();
  const { request } = useAPI();
  const navigate = useNavigate();
  const nodeCounters = useRef({});
  const lastSignificantChange = useRef({ nodes: [], edges: [] });

  // Grouped state
  const [state, setState] = useState({
    notification: null,
    errorMessage: null,
    isDataLoaded: false,
    byteMessage: '¡Hola! Estoy aquí para ayudarte a crear tu Plubot. Arrastra un nodo desde la paleta para comenzar.',
    isGenerating: false,
    showSimulation: false,
    exportMode: false,
    importData: '',
    exportFormat: 'json',
    flowStyles: { edgeStyles: { strokeWidth: 2, stroke: '#00e0ff', animated: false } },
    showConnectionEditor: false,
    selectedConnection: null,
    connectionProperties: {
      animated: false,
      label: '',
      style: { stroke: '#00e0ff', strokeWidth: 2, strokeDasharray: '' },
    },
    showRouteAnalysis: false,
    routeAnalysis: null,
    showTemplateSelector: false,
    isLoading: false,
    suggestions: [],
    showSuggestionsModal: false,
    showEmbedModal: false,
    showVersionHistoryPanel: false, 
  });

  // Simplified node and edge templates
  const nodeTemplates = [
    { id: 'start-1', type: 'start', x: 100, y: 100, label: 'Inicio', width: 80, height: 40 },
    {
      id: 'message-1',
      type: 'message',
      x: 300,
      y: 100,
      label: 'Bienvenida',
      message: 'Hola, soy tu asistente de soporte técnico. ¿En qué puedo ayudarte?',
      width: 150,
      height: 80,
    },
    {
      id: 'decision-1',
      type: 'decision',
      x: 500,
      y: 100,
      label: 'Tipo de Problema',
      question: '¿Qué tipo de problema tienes?',
      outputs: ['Problema de hardware', 'Problema de software'],
      width: 150,
      height: 80,
    },
    {
      id: 'option-1',
      type: 'option',
      x: 700,
      y: 50,
      label: 'Problema de hardware',
      condition: 'Igual a: Problema de hardware',
      parentDecisionId: 'decision-1',
      width: 150,
      height: 80,
    },
    {
      id: 'option-2',
      type: 'option',
      x: 700,
      y: 150,
      label: 'Problema de software',
      condition: 'Igual a: Problema de software',
      parentDecisionId: 'decision-1',
      width: 150,
      height: 80,
    },
    {
      id: 'action-1',
      type: 'action',
      x: 900,
      y: 50,
      label: 'Registrar Problema Hardware',
      description: 'Guardar datos del problema de hardware',
      actionType: 'saveData',
      parameters: { key: 'problema', value: 'hardware_issue', dataType: 'string', storage: 'database' },
      width: 150,
      height: 80,
    },
    {
      id: 'action-2',
      type: 'action',
      x: 900,
      y: 150,
      label: 'Registrar Problema Software',
      description: 'Guardar datos del problema de software',
      actionType: 'saveData',
      parameters: { key: 'problema', value: 'software_issue', dataType: 'string', storage: 'database' },
      width: 150,
      height: 80,
    },
    {
      id: 'message-2',
      type: 'message',
      x: 1100,
      y: 50,
      label: 'Confirmación Hardware',
      message: 'Hemos registrado tu problema de hardware.',
      width: 150,
      height: 80,
    },
    {
      id: 'message-3',
      type: 'message',
      x: 1100,
      y: 150,
      label: 'Confirmación Software',
      message: 'Hemos registrado tu problema de software.',
      width: 150,
      height: 80,
    },
    {
      id: 'decision-2',
      type: 'decision',
      x: 1300,
      y: 100,
      label: 'Continuar',
      question: '¿Deseas continuar con otra consulta?',
      outputs: ['Sí', 'No'],
      width: 150,
      height: 80,
    },
    {
      id: 'option-3',
      type: 'option',
      x: 1500,
      y: 50,
      label: 'Sí',
      condition: 'Igual a: Sí',
      parentDecisionId: 'decision-2',
      width: 150,
      height: 80,
    },
    {
      id: 'option-4',
      type: 'option',
      x: 1500,
      y: 150,
      label: 'No',
      condition: 'Igual a: No',
      parentDecisionId: 'decision-2',
      width: 150,
      height: 80,
    },
    {
      id: 'message-4',
      type: 'message',
      x: 1700,
      y: 50,
      label: 'Nueva Consulta',
      message: 'Perfecto, ¿cuál es tu nueva consulta?',
      width: 150,
      height: 80,
    },
    {
      id: 'end-1',
      type: 'end',
      x: 1900,
      y: 50,
      label: 'Fin Nueva Consulta',
      message: 'Gracias por tu consulta.',
      width: 80,
      height: 40,
    },
    {
      id: 'end-2',
      type: 'end',
      x: 1700,
      y: 150,
      label: 'Fin No',
      message: 'Gracias por usar el asistente. ¡Hasta pronto!',
      width: 80,
      height: 40,
    },
  ];

  const initialNodes = nodeTemplates.map((node) => {
    const uniqueSuffix = uuidv4().slice(0, 8); // Genera el sufijo único
    return {
      id: `${node.id}-${uniqueSuffix}`, // El sufijo único va en el ID del nodo
      type: node.type,
      position: { x: node.x, y: node.y },
      data: {
        label: node.label, // El label solo contiene el nombre limpio ("Inicio", "Bienvenida", etc.)
        message: node.message,
        question: node.question,
        outputs: node.outputs,
        condition: node.condition,
        parentDecisionId: node.parentDecisionId,
        description: node.description,
        actionType: node.actionType,
        parameters: node.parameters,
      },
      width: node.width,
      height: node.height,
      draggable: true,
      selectable: true,
      zIndex: 1000,
    };
  });

  const initialEdges = [
    { id: 'e1', source: 'start-1', target: 'message-1', type: 'default', animated: false },
    { id: 'e2', source: 'message-1', target: 'decision-1', type: 'default', animated: false },
    { id: 'e3', source: 'decision-1', sourceHandle: 'output-0', target: 'option-1', type: 'default', animated: false },
    { id: 'e4', source: 'decision-1', sourceHandle: 'output-1', target: 'option-2', type: 'default', animated: false },
    { id: 'e5', source: 'option-1', target: 'action-1', type: 'default', animated: false },
    { id: 'e6', source: 'option-2', target: 'action-2', type: 'default', animated: false },
    { id: 'e7', source: 'action-1', target: 'message-2', type: 'default', animated: false },
    { id: 'e8', source: 'action-2', target: 'message-3', type: 'default', animated: false },
    { id: 'e9', source: 'message-2', target: 'decision-2', type: 'default', animated: false },
    { id: 'e10', source: 'message-3', target: 'decision-2', type: 'default', animated: false },
    { id: 'e11', source: 'decision-2', sourceHandle: 'output-0', target: 'option-3', type: 'default', animated: false },
    { id: 'e12', source: 'decision-2', sourceHandle: 'output-1', target: 'option-4', type: 'default', animated: false },
    { id: 'e13', source: 'option-3', target: 'message-4', type: 'default', animated: false },
    { id: 'e14', source: 'message-4', target: 'end-1', type: 'default', animated: false },
    { id: 'e15', source: 'option-4', target: 'end-2', type: 'default', animated: false },
  ];

  const { nodes, edges, selectedNode, setNodes, setEdges, setSelectedNode } = useFlowEditor(initialNodes, initialEdges);

  // Custom debounce hook
  const debouncedSave = useDebounce(saveFlowData, 10000); // 10 seconds

  useEffect(() => {
    document.body.classList.add('training-screen');
    return () => document.body.classList.remove('training-screen');
  }, []);

  const handleError = useCallback((errorMsg, consoleError = null) => {
    setState((prev) => ({
      ...prev,
      byteMessage: `⚠️ Error: ${errorMsg}`,
    }));
    if (consoleError && process.env.NODE_ENV === 'development') {
      console.error(consoleError);
    }
  }, []);

  async function saveFlowData() {
    // Mostrar mensaje de guardando inmediatamente para mejorar la experiencia del usuario
    setState((prev) => ({
      ...prev,
      byteMessage: '💾 Guardando flujo...',
    }));

    if (!state.isDataLoaded) {
      setState((prev) => ({
        ...prev,
        byteMessage: '⏳ Datos aún cargando, espera un momento antes de guardar.',
      }));
      return;
    }

    if (!nodes.length || !updatePlubotData || !plubotIdFromUrl) {
      setState((prev) => ({
        ...prev,
        byteMessage: '⚠️ No hay datos de flujo para guardar o falta el ID del Plubot.',
      }));
      return;
    }

    // Asegurar un nombre por defecto si plubotData.name está vacío
    const plubotName = plubotData.name || 'Sin nombre';
    if (!plubotData.name) {
      updatePlubotData({ ...plubotData, name: plubotName });
      setState((prev) => ({
        ...prev,
        byteMessage: '⚠️ Nombre del Plubot no especificado. Usando "Sin nombre" por defecto.',
      }));
    }

    const userMessages = nodes.map((node, index) => ({
      user_message: node.data.label || `Nodo ${index + 1}`,
      position: index,
      nodeId: node.id // Guardar el ID original del nodo
    }));
    const duplicates = userMessages.reduce((acc, curr, index, arr) => {
      const isDuplicated = arr.some(
        (other, otherIndex) => otherIndex !== index && other.user_message.toLowerCase() === curr.user_message.toLowerCase()
      );
      if (isDuplicated) acc.push({ position: curr.position, user_message: curr.user_message, nodeId: curr.nodeId });
      return acc;
    }, []);

    if (duplicates.length > 0) {
      const newNodes = [...nodes];
      const usedLabels = new Set(nodes.map((n) => n.data.label.toLowerCase()));
      duplicates.forEach((duplicate) => {
        const nodeIndex = newNodes.findIndex((n) => n.id === duplicate.nodeId);
        let newLabel = duplicate.user_message;
        let counter = 1;
        while (usedLabels.has(newLabel.toLowerCase())) {
          newLabel = `${duplicate.user_message}-${counter}-${uuidv4().slice(0, 4)}`;
          counter++;
        }
        usedLabels.add(newLabel.toLowerCase());
        newNodes[nodeIndex] = { ...newNodes[nodeIndex], data: { ...newNodes[nodeIndex].data, label: newLabel } };
      });
      setNodes(newNodes);
      setState((prev) => ({ ...prev, byteMessage: '🔄 Duplicados detectados y resueltos. Guardando...' }));
      setTimeout(saveFlowData, 100);
      return;
    }

    const timestamp = new Date().toISOString();
    const versionData = { version: timestamp, nodes: [...nodes], edges: [...edges] };
    const flowData = { nodes, edges };

    updatePlubotData({
      flowExample: flowData,
      flowVersions: [...(plubotData.flowVersions || []), versionData].slice(-10),
    });

    try {
      const payload = {
        name: plubotName,
        flows: nodes.map((node, index) => {
  let botResponse;
  switch (node.type) {
    case 'message':
      botResponse = node.data.message || 'Mensaje predeterminado';
      break;
    case 'decision':
      botResponse = node.data.question || 'Pregunta predeterminada';
      break;
    case 'action':
      botResponse = node.data.description || 'Acción predeterminada';
      break;
    case 'option':
      botResponse = node.data.condition || 'Condición predeterminada';
      break;
    case 'start':
      botResponse = node.data.label || 'Inicio del flujo';
      break;
    case 'end':
      botResponse = node.data.message || 'Fin del flujo';
      break;
    default:
      botResponse = 'N/A';
  }
  // Validar posición antes de guardar
  if (typeof node.position?.x !== 'number' || typeof node.position?.y !== 'number') {
    console.error('[saveFlowData] Nodo sin posición válida:', node);
  }
  return {
    position: index,
    intent: node.type,
    user_message: node.data.label || `Nodo ${index + 1}`,
    bot_response: botResponse,
    condition: node.type === 'option' ? node.data.condition : undefined,
    position_x: typeof node.position?.x === 'number' ? node.position.x : 0,
    position_y: typeof node.position?.y === 'number' ? node.position.y : 0,
    node_id: node.id // Guardar el ID original del nodo
  };
}),
        edges: edges.map((edge) => {
          // Conservar los IDs originales completos de los nodos source y target
          // Esto soluciona el problema donde las aristas no se cargan correctamente
          return {
            source: edge.source,
            target: edge.target,
            source_id: edge.source, // Guardar el ID original completo
            target_id: edge.target, // Guardar el ID original completo
            id: edge.id, // Guardar el ID original de la arista
            sourceHandle: edge.sourceHandle,
            label: edge.label,
            style: edge.style,
            type: edge.type || 'default'
          };
        }),
      };
      // Mostrar mensaje de éxito inmediatamente para mejorar la experiencia del usuario
    setState((prev) => ({
      ...prev,
      byteMessage: '💾 ¡Flujo guardado con éxito!',
    }));
    
    // Realizar la petición al servidor en segundo plano
    const response = await request('PUT', `/api/plubots/update/${plubotIdFromUrl}`, payload);
      if (response.status !== 'success') {
        throw new Error(response.message || 'Respuesta inválida');
      }
    } catch (error) {
      // Solo usar byteMessage para mostrar errores, sin notificaciones adicionales
      setState((prev) => ({
        ...prev,
        byteMessage: `⚠️ Error al guardar el flujo: ${error.message}`,
      }));
      // Eliminado el setTimeout y la notificación adicional
    }
  }

  const triggerSaveOnSignificantChange = useCallback(() => {
    const nodesChanged =
      JSON.stringify(nodes.map((n) => ({ id: n.id, data: n.data }))) !==
      JSON.stringify(lastSignificantChange.current.nodes.map((n) => ({ id: n.id, data: n.data })));
    const edgesChanged = JSON.stringify(edges) !== JSON.stringify(lastSignificantChange.current.edges);
    if (nodesChanged || edgesChanged) {
      lastSignificantChange.current = { nodes: [...nodes], edges: [...edges] };
      debouncedSave();
    }
  }, [nodes, edges, debouncedSave]);

  const handleGenerateSuggestions = useCallback(() => {
    setState((prev) => ({ ...prev, isGenerating: true }));
    try {
      const suggestions = generateNodeSuggestions(nodes, edges);
      setState((prev) => ({
        ...prev,
        suggestions,
        showSuggestionsModal: true,
        isGenerating: false,
        byteMessage: '💡 Sugerencias generadas. Revisa el modal.',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        byteMessage: `⚠️ Error al generar sugerencias: ${error.message}`,
      }));
    }
  }, [nodes, edges]);

  useEffect(() => {
    const loadPlubotData = async () => {
      setState((prev) => ({ ...prev, isLoading: true, isDataLoaded: false }));
      try {
        if (!plubotIdFromUrl) {
          setState((prev) => ({
            ...prev,
            errorMessage: 'No se proporcionó un ID de Plubot. Redirigiendo al perfil.',
            byteMessage: '⚠️ Error: ID de Plubot no proporcionado.',
          }));
          setTimeout(() => navigate('/profile'), 2000);
          return;
        }

        resetPlubotCreation();
        const response = await request('GET', `/api/plubots/${plubotIdFromUrl}`);
        if (response.status === 'success' && response.plubot) {
          const plubot = response.plubot;
          const flows = Array.isArray(plubot.flows) ? plubot.flows : [];
          const edges = Array.isArray(plubot.edges) ? plubot.edges : [];

          if (flows.length === 0) {
  setNodes([]);
  setEdges([]);
  return;
}

          const counters = {};
          flows.forEach((flow) => {
            counters[flow.intent || 'message'] = (counters[flow.intent || 'message'] || 0) + 1;
          });
          Object.assign(nodeCounters.current, counters);

          // Validación avanzada: aseguramos que los datos críticos estén presentes y logueamos inconsistencias
const newNodes = flows.map((flow, index) => {
  // Validar que la posición exista y sea numérica
  if (typeof flow.position_x !== 'number' || typeof flow.position_y !== 'number') {
    console.error('[loadPlubotData] Nodo sin posición válida:', flow);
    setState(prev => ({ ...prev, byteMessage: '⚠️ Error: Nodo sin posición válida detectado.' }));
  }
  const position = flow.position !== undefined ? flow.position : index;
  return {
    id: flow.node_id || `node-${position}`,
    type: flow.intent || 'message',
    position: {
      x: typeof flow.position_x === 'number' ? flow.position_x : 0,
      y: typeof flow.position_y === 'number' ? flow.position_y : 0,
    },
    data: {
      label: flow.user_message || `Nodo-${uuidv4().slice(0, 8)}`,
      ...(flow.intent === 'message' && { message: flow.bot_response || 'Mensaje predeterminado', variables: flow.variables || [] }),
      ...(flow.intent === 'decision' && { question: flow.bot_response || 'Pregunta predeterminada', outputs: flow.outputs || ['Sí', 'No'] }),
      ...(flow.intent === 'action' && {
        description: flow.bot_response || 'Acción predeterminada',
        actionType: flow.actionType || 'sendEmail',
        parameters: flow.parameters || {},
      }),
      ...(flow.intent === 'option' && { condition: flow.condition || 'Condición predeterminada', parentDecisionId: flow.parentDecisionId || null }),
      ...(flow.intent === 'start' && { label: flow.bot_response || `Inicio-${uuidv4().slice(0, 8)}` }),
      ...(flow.intent === 'end' && { message: flow.bot_response || 'Fin del flujo' }),
    },
    width: flow.intent === 'start' || flow.intent === 'end' ? 80 : 150,
    height: flow.intent === 'start' || flow.intent === 'end' ? 40 : 80,
    draggable: true,
    selectable: true,
    zIndex: 1000,
  };
});

          // Crear un mapa de IDs de nodos para facilitar la búsqueda
          const nodeIdMap = {};
          newNodes.forEach(node => {
            nodeIdMap[node.id] = node;
          });

          // Crear un mapa de posiciones para compatibilidad con el código existente
          const flowIdToPosition = {};
          flows.forEach((flow, index) => {
            const position = flow.position !== undefined ? flow.position : index;
            flowIdToPosition[position] = index;
          });

          console.log('Cargando aristas:', edges);
          
          // Validación avanzada: aseguramos que los datos críticos de aristas estén presentes y logueamos inconsistencias
const newEdges = edges.map((edge, index) => {
              if (!edge.source_id || !edge.target_id || !edge.id) {
                console.error(`[TrainingScreen] Arista corrupta o incompleta detectada:`, edge);
                setState(prev => ({ ...prev, byteMessage: '⚠️ Error: Arista corrupta o incompleta detectada.' }));
              }

              try {
                // Verificar si tenemos IDs originales completos (source_id y target_id)
                if (edge.source_id && edge.target_id && nodeIdMap[edge.source_id] && nodeIdMap[edge.target_id]) {
                  console.log(`Usando IDs originales para arista: ${edge.source_id} -> ${edge.target_id}`);
                  return {
                    id: edge.id || `edge-${index}-${edge.source_id}-${edge.target_id}`,
                    source: edge.source_id,
                    target: edge.target_id,
                    type: edge.type || 'default',
                    animated: edge.animated || false,
                    sourceHandle: edge.sourceHandle,
                    label: edge.label,
                    style: edge.style || { stroke: '#00e0ff', strokeWidth: 2 },
                  };
                }
                
                // Verificar si tenemos IDs directos en source y target
                if (edge.source && edge.target && nodeIdMap[edge.source] && nodeIdMap[edge.target]) {
                  console.log(`Usando IDs directos para arista: ${edge.source} -> ${edge.target}`);
                  return {
                    id: edge.id || `edge-${index}-${edge.source}-${edge.target}`,
                    source: edge.source,
                    target: edge.target,
                    type: edge.type || 'default',
                    animated: edge.animated || false,
                    sourceHandle: edge.sourceHandle,
                    label: edge.label,
                    style: edge.style || { stroke: '#00e0ff', strokeWidth: 2 },
                  };
                }
                
                // Intentar buscar por node_id en los flujos
                const sourceNodeByNodeId = flows.find(flow => flow.node_id === edge.source);
                const targetNodeByNodeId = flows.find(flow => flow.node_id === edge.target);
                
                if (sourceNodeByNodeId && targetNodeByNodeId && nodeIdMap[sourceNodeByNodeId.node_id] && nodeIdMap[targetNodeByNodeId.node_id]) {
                  console.log(`Encontrado por node_id: ${sourceNodeByNodeId.node_id} -> ${targetNodeByNodeId.node_id}`);
                  return {
                    id: edge.id || `edge-${index}-${sourceNodeByNodeId.node_id}-${targetNodeByNodeId.node_id}`,
                    source: sourceNodeByNodeId.node_id,
                    target: targetNodeByNodeId.node_id,
                    type: edge.type || 'default',
                    animated: edge.animated || false,
                    sourceHandle: edge.sourceHandle,
                    label: edge.label,
                    style: edge.style || { stroke: '#00e0ff', strokeWidth: 2 },
                  };
                }

                // Fallback al método anterior si no tenemos IDs originales
                // Buscar por posición en el flujo
                const sourcePosition = Object.keys(flowIdToPosition).find(
                  (key) => flows[flowIdToPosition[key]].position === parseInt(edge.source, 10)
                );
                const targetPosition = Object.keys(flowIdToPosition).find(
                  (key) => flows[flowIdToPosition[key]].position === parseInt(edge.target, 10)
                );

                // Intentar usar la posición para encontrar los nodos
                let sourceNodeId = null;
                let targetNodeId = null;
                
                if (sourcePosition !== undefined) {
                  const sourceFlow = flows[flowIdToPosition[sourcePosition]];
                  sourceNodeId = sourceFlow.node_id || `node-${sourcePosition}`;
                }
                
                if (targetPosition !== undefined) {
                  const targetFlow = flows[flowIdToPosition[targetPosition]];
                  targetNodeId = targetFlow.node_id || `node-${targetPosition}`;
                }

                if (!sourceNodeId || !targetNodeId || !nodeIdMap[sourceNodeId] || !nodeIdMap[targetNodeId]) {
                  console.warn(`No se pudo resolver la arista: ${edge.source} -> ${edge.target}`);
                  return null;
                }

                // Calcular el sourceHandle para nodos de decisión
                const sourceNode = newNodes.find((node) => node.id === sourceNodeId);
                let computedSourceHandle = edge.sourceHandle || null;
                if (sourceNode?.type === 'decision') {
                  const outputs = sourceNode.data.outputs || [];
                  const targetNode = newNodes.find((node) => node.id === targetNodeId);
                  if (targetNode?.type === 'option') {
                    const condition = targetNode.data.condition || '';
                    const outputIndex = outputs.findIndex((output) => condition.includes(output));
                    if (outputIndex >= 0) computedSourceHandle = `output-${outputIndex}`;
                  }
                }

                console.log(`Creando arista por posición: ${sourceNodeId} -> ${targetNodeId}`);
                return {
                  id: edge.id || `edge-${index}-${sourceNodeId}-${targetNodeId}`,
                  source: sourceNodeId,
                  target: targetNodeId,
                  type: edge.type || 'default',
                  animated: edge.animated || false,
                  sourceHandle: computedSourceHandle,
                  label: edge.label,
                  style: edge.style || { stroke: '#00e0ff', strokeWidth: 2 },
                };
              } catch (error) {
                console.error(`Error procesando arista ${index}:`, error);
                return null;
              }
            })
            .filter((edge) => edge !== null);

          const nodeIds = newNodes.map((node) => node.id);
          // Solo mantenemos aristas completamente válidas
const validEdges = newEdges.filter((edge) => {
  const isValid = edge && nodeIds.includes(edge.source) && nodeIds.includes(edge.target);
  if (!isValid) {
    console.warn('[TrainingScreen] Arista descartada por IDs inválidos:', edge);
  }
  return isValid;
});

          setNodes(newNodes);
          setEdges(validEdges);
          updatePlubotData({
            id: plubot.id,
            name: plubot.name || 'Sin nombre',
            tone: plubot.tone || 'neutral',
            color: plubot.color || '#D1D5DB',
            flowData: { nodes: newNodes, edges: validEdges },
          });
          setState((prev) => ({ ...prev, byteMessage: '✅ Flujo guardado correctamente.', isDataLoaded: true }));
          lastSignificantChange.current = { nodes: [...newNodes], edges: [...validEdges] };
        } else {
          setNodes(initialNodes);
          setEdges(initialEdges);
          updatePlubotData({
            id: plubotIdFromUrl,
            name: 'Sin nombre',
            tone: 'neutral',
            color: '#D1D5DB',
            flowData: { nodes: initialNodes, edges: initialEdges },
          });
          setState((prev) => ({
            ...prev,
            errorMessage: 'No se pudieron cargar los datos del Plubot.',
            byteMessage: '⚠️ Error: Respuesta inválida',
            isDataLoaded: true,
          }));
          lastSignificantChange.current = { nodes: [...initialNodes], edges: [...initialEdges] };
        }
      } catch (error) {
        setNodes(initialNodes);
        setEdges(initialEdges);
        updatePlubotData({
          id: plubotIdFromUrl,
          name: 'Sin nombre',
          tone: 'neutral',
          color: '#D1D5DB',
          flowData: { nodes: initialNodes, edges: initialEdges },
        });
        setState((prev) => ({
          ...prev,
          errorMessage: `Error al cargar los datos del Plubot: ${error.message}`,
          byteMessage: `⚠️ Error: ${error.message}`,
          isDataLoaded: true,
        }));
        lastSignificantChange.current = { nodes: [...initialNodes], edges: [...initialEdges] };
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadPlubotData();
  }, [plubotIdFromUrl, updatePlubotData, resetPlubotCreation, request, navigate, setNodes, setEdges]);

  const handleSaveFlow = useCallback(() => {
    // Solo usar saveFlowData para evitar mensajes duplicados
    // El CSS global se encargará de ocultar cualquier notificación duplicada
    saveFlowData();
  }, [saveFlowData]);

  const handleBack = useCallback(async () => {
    await saveFlowData();
    navigate('/profile');
  }, [saveFlowData, navigate]);

  const handleValidateConnections = useCallback(() => {
    const isValid = validateConnections(nodes, edges, addXp, addPluCoins);
    // No mostrar mensajes de simulación en StatusBubble
    // setState((prev) => ({
    //   ...prev,
    //   byteMessage: isValid
    //     ? '✅ Flujo validado correctamente. ¡Buen trabajo!'
    //     : '⚠️ Problemas detectados en el flujo.',
    // }));
  }, [nodes, edges, addXp, addPluCoins]);

  const handleAnalyzeFlowRoutes = useCallback(() => {
    const analysis = analyzeFlowRoutes(nodes, edges);
    // No mostrar mensajes de simulación en StatusBubble
    // setState((prev) => ({
    //   ...prev,
    //   routeAnalysis: analysis,
    //   showRouteAnalysis: true,
    //   byteMessage: '📊 Análisis de rutas completado.',
    // }));
  }, [nodes, edges]);

  const toggleSimulation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showSimulation: !prev.showSimulation,
      // No mostrar mensajes de simulación en StatusBubble
      // byteMessage: !prev.showSimulation ? '🎬 Simulación iniciada.' : '🔍 Simulador cerrado.',
    }));
  }, []);

  const addNewNode = useCallback(
    (type) => {
      const nodeCount = nodes.filter((n) => n.type === type).length + 1;
      const newNode = generateNode(type, nodeCount);
      setNodes((nds) => {
        const updatedNodes = [...nds, newNode];
        lastSignificantChange.current.nodes = updatedNodes;
        debouncedSave();
        return updatedNodes;
      });
      // No mostrar mensajes de simulación en StatusBubble
      // setState((prev) => ({
      //   ...prev,
      //   byteMessage: `🆕 Nodo de tipo ${type} añadido.`,
      // }));
    },
    [debouncedSave]
  );

  const handleApplySuggestion = useCallback(
    (action) => {
      try {
        if (action.type === 'ADD_NODE') {
          addNewNode(action.nodeType);
        } else if (action.type === 'HIGHLIGHT_NODES') {
          setNodes((nds) =>
            nds.map((node) =>
              action.nodeIds.includes(node.id)
                ? { ...node, style: { ...node.style, border: '2px solid #ff0000' } }
                : { ...node, style: { ...node.style, border: 'none' } }
            )
          );
          // No mostrar mensajes de simulación en StatusBubble
          // setState((prev) => ({
          //   ...prev,
          //   byteMessage: '🔴 Nodos resaltados. Ajusta las conexiones según sea necesario.',
          // }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          byteMessage: `⚠️ Error al aplicar sugerencia: ${error.message}`,
        }));
      }
    },
    [addNewNode, setNodes]
  );

  // Función para mostrar mensajes a través de la burbuja de estado
  // Solo muestra mensajes críticos como confirmaciones de guardado
  const notifyByte = useCallback((message) => {
    // Verificar si el mensaje está relacionado con guardado
    const isSaveMessage = (
      message.includes('guardado') || 
      message.includes('Guardando') || 
      message.includes('💾') // Emoji de disquete
    );

    // Si es un mensaje de guardado y ya hay un mensaje de guardado activo, ignorarlo
    // para evitar mensajes duplicados
    if (isSaveMessage && state.byteMessage && (
      state.byteMessage.includes('guardado') || 
      state.byteMessage.includes('Guardando') || 
      state.byteMessage.includes('💾')
    )) {
      return; // No mostrar mensajes duplicados de guardado
    }

    // Para todos los demás mensajes, actualizar el estado
    setState((prev) => ({
      ...prev,
      byteMessage: message,
    }));
  }, [state.byteMessage]);

  const handleShowEmbedModal = useCallback(() => {
    setState((prev) => ({ ...prev, showEmbedModal: true }));
    // No mostrar mensajes de simulación en StatusBubble
    // setState((prev) => ({ ...prev, byteMessage: 'Puedes compartir tu Plubot con un enlace directo o embeber el chatbot en tu sitio web.' }));
  }, []);

  const handleSetByteMessage = useCallback((msg) => {
    // No hacer nada aquí para evitar que mensajes generales de FlowEditor
    // (como 'Nodo seleccionado') se muestren en la StatusBubble.
    // Los mensajes de guardado se establecen directamente en saveFlowData.
    console.log('Mensaje de FlowEditor (ignorado por StatusBubble):', msg); // Para depuración
  }, []);

  const handleSetShowConnectionEditor = useCallback((val) => {
    setState((prev) => ({ ...prev, showConnectionEditor: val }));
  }, []);

  const handleSetSelectedConnection = useCallback((conn) => {
    setState((prev) => ({ ...prev, selectedConnection: conn }));
  }, []);

  const handleSetConnectionProperties = useCallback((props) => {
    setState((prev) => ({ ...prev, connectionProperties: props }));
  }, []);

  const handleSetShowSimulation = useCallback((val) => {
    setState((prev) => ({ ...prev, showSimulation: val }));
  }, []);

  const handleSetEdges = useCallback((edgesOrUpdater) => {
    setEdges(edgesOrUpdater);
  }, [setEdges]);

  const modalProps = {
    templateSelector: {
      onSelectTemplate: (template) => {
        setNodes(template.nodes);
        setEdges(template.edges);
        setState((prev) => ({ ...prev, showTemplateSelector: false, byteMessage: '📋 Plantilla seleccionada.' }));
        saveFlowData();
        triggerSaveOnSignificantChange();
      },
      className: 'ts-template-selector',
    },
    importExport: {
      exportFormat: state.exportFormat,
      importData: state.importData,
      setImportData: (data) => setState((prev) => ({ ...prev, importData: data })),
      setExportFormat: (format) => setState((prev) => ({ ...prev, exportFormat: format })),
      onImport: () => {
        try {
          const data = JSON.parse(state.importData);
          if (data.nodes && data.edges) {
            setNodes(data.nodes);
            setEdges(data.edges);
            // No mostrar mensajes de simulación en StatusBubble
            // setState((prev) => ({ ...prev, byteMessage: '📋 Datos importados.' }));
            saveFlowData();
            triggerSaveOnSignificantChange();
          } else {
            setState((prev) => ({ ...prev, byteMessage: '⚠️ Formato de datos inválido.' }));
          }
        } catch (error) {
          setState((prev) => ({ ...prev, byteMessage: `⚠️ Error al importar datos: ${error.message}` }));
        }
      },
      onExport: () => {
        const flowData = { nodes, edges };
        const exportData = JSON.stringify(flowData, null, 2);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plubot-flow-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setState((prev) => ({ ...prev, byteMessage: '📦 Datos exportados.' }));
      },
      flowData: { nodes, edges },
      plubotData,
      updatePlubotData,
      className: 'ts-import-export-modal',
    },
    connectionEditor: {
      nodes,
      selectedConnection: state.selectedConnection,
      connectionProperties: state.connectionProperties,
      setConnectionProperties: (props) => setState((prev) => ({ ...prev, connectionProperties: props })),
      saveConnectionChanges: () => {
        if (!state.selectedConnection) return;
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === state.selectedConnection.id
              ? {
                  ...edge,
                  animated: state.connectionProperties.animated,
                  label: state.connectionProperties.label,
                  style: { ...state.connectionProperties.style },
                  markerEnd: { type: 'ArrowClosed', color: state.connectionProperties.style.stroke },
                }
              : edge
          )
        );
        setState((prev) => ({ ...prev, showConnectionEditor: false, selectedConnection: null, byteMessage: '🔗 Conexión actualizada.' }));
        triggerSaveOnSignificantChange();
      },
      deleteConnection: () => {
        if (!state.selectedConnection) return;
        setEdges((eds) => eds.filter((edge) => edge.id !== state.selectedConnection.id));
        setState((prev) => ({ ...prev, showConnectionEditor: false, selectedConnection: null, byteMessage: '🗑️ Conexión eliminada.' }));
        triggerSaveOnSignificantChange();
      },
      className: 'ts-connection-editor-modal',
    },
    routeAnalysis: {
      analysis: state.routeAnalysis,
      className: 'ts-route-analysis-panel',
    },
    suggestionsModal: {
      suggestions: state.suggestions,
      onApplySuggestion: handleApplySuggestion,
      className: 'ts-suggestions-modal',
    },
    embedModal: {
      plubotId: plubotIdFromUrl,
      plubotName: plubotData.name || 'Mi Plubot',
      onExport: () => {
        const flowData = { nodes, edges };
        const exportData = JSON.stringify(flowData, null, 2);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plubot-flow-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setState((prev) => ({ ...prev, byteMessage: '📦 Datos exportados.' }));
      },
      flowData: { nodes, edges },
    },
  };

  const modals = {
    showTemplateSelector: state.showTemplateSelector,
    showExportMode: state.exportMode,
    showConnectionEditor: state.showConnectionEditor,
    showRouteAnalysis: state.showRouteAnalysis,
    showSuggestionsModal: state.showSuggestionsModal,
    showEmbedModal: state.showEmbedModal,
  };

  if (state.errorMessage) {
    return (
      <div className="ts-critical-error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'rgba(10, 20, 35, 0.95)', color: '#ff4444', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textShadow: '0 0 5px #ff4444' }}>Error</h2>
        <p style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'rgba(0, 224, 255, 0.8)' }}>{state.errorMessage}</p>
        <button className="ts-training-action-btn" onClick={() => navigate('/profile')} style={{ background: 'rgba(0, 40, 80, 0.8)', border: '2px solid #00e0ff', padding: '0.8rem 1.5rem', fontSize: '1rem', color: '#e0e0ff' }}>
          ← Volver al Perfil
        </button>
      </div>
    );
  }

  if (state.isLoading) {
    return (
      <div className="ts-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'rgba(10, 20, 35, 0.95)' }}>
        <div className="loading-spinner" style={{ width: '50px', height: '50px', border: '5px solid rgba(0, 224, 255, 0.3)', borderTop: '5px solid #00e0ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <h2 style={{ color: '#00e0ff', textShadow: '0 0 10px rgba(0, 224, 255, 0.7)', marginTop: '1rem' }}>Cargando datos del Plubot...</h2>
      </div>
    );
  }

  return (
    <div className="ts-training-screen">
      {/* Eliminada la notificación superior para evitar mensajes duplicados */}
      <div className="ts-header">
        <div className="ts-header-left">
          <button className="ts-training-action-btn" onClick={handleBack} style={{ marginRight: '1rem', background: 'rgba(0, 40, 80, 0.8)', border: '2px solid #00e0ff' }}>
            ← Volver
          </button>
          <h2>Entrenamiento de Plubot: {plubotData?.name || 'Sin nombre'}</h2>
        </div>
        <div className="ts-header-center">
          <img src={logo} alt="Logo" className="ts-header-logo" />
        </div>
        <div className="ts-actions">
          <button className="ts-training-action-btn" onClick={() => setState((prev) => ({ ...prev, showTemplateSelector: true }))}>Mostrar Plantillas</button>
          <button className="ts-training-action-btn" onClick={saveFlowData}>Guardar</button>
          <button className="ts-training-action-btn" onClick={() => {
            handleValidateConnections();
            setTimeout(() => handleAnalyzeFlowRoutes(), 500);
          }}>Validar Flujo</button>
          <button className="ts-training-action-btn" onClick={toggleSimulation}>{state.showSimulation ? 'Cerrar Simulación' : 'Simular'}</button>
          <button className="ts-training-action-btn ts-share-button" onClick={handleShowEmbedModal} disabled={!plubotIdFromUrl}>Compartir y Embeber</button>
        </div>
      </div>

      {state.isDataLoaded && (
        <FlowEditor
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          // setByteMessage solo para mensajes críticos de guardado
          // setByteMessage={handleSetByteMessage}
          setShowConnectionEditor={handleSetShowConnectionEditor}
          setSelectedConnection={handleSetSelectedConnection}
          setConnectionProperties={handleSetConnectionProperties}
          handleError={handleError}
          showSimulation={state.showSimulation}
          setShowSimulation={handleSetShowSimulation}
          showVersionHistoryPanel={state.showVersionHistoryPanel}
          setShowVersionHistoryPanel={(value) => setState(prev => ({ ...prev, showVersionHistoryPanel: value }))}
          className="ts-flow-editor"
          plubotId={plubotData?.id}
          name={plubotData?.name || 'Sin nombre'}
          notifyByte={notifyByte}
          onNodeDragStop={triggerSaveOnSignificantChange}
          saveFlowData={saveFlowData}
        />
      )}

      <NodePalette setNodes={setNodes} // setByteMessage solo para mensajes críticos de guardado
      // setByteMessage={() => {}}
      className="ts-node-palette" /> 

      {state.showVersionHistoryPanel && (
        <Suspense fallback={<div>Loading...</div>}>
          <VersionHistory
            versions={plubotData.flowVersions}
            onRestore={(versionData) => {
              setNodes(versionData.nodes);
              setEdges(versionData.edges);
              // No mostrar mensajes de simulación en StatusBubble
              // setState((prev) => ({ ...prev, byteMessage: '🔄 Versión restaurada.' }));
              triggerSaveOnSignificantChange();
              // Cerrar el panel después de restaurar
              setState((prev) => ({ ...prev, showVersionHistoryPanel: false }));
            }}
            onClose={() => {
              setState((prev) => ({ ...prev, showVersionHistoryPanel: false }));
            }}
            className="ts-version-history"
          />
        </Suspense>
      )}

      <ModalManager
        modals={modals}
        modalProps={modalProps}
        onClose={(key) => setState((prev) => ({ ...prev, [key]: false }))}
      />

      <ByteAssistant simulationMode={state.showSimulation} /> 
      <StatusBubble message={state.byteMessage} />
    </div>
  );
};

export default TrainingScreen;