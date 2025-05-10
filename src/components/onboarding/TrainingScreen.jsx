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
import FlowEditor from './FlowEditor';
import NodePalette from './NodePalette';
import ByteAssistant from './ByteAssistant';
import logo from '@/assets/img/plubot.svg';
import './TrainingScreen.css';

// Lazy-loaded components
const TemplateSelector = lazy(() => import('./TemplateSelector'));
const ImportExportModal = lazy(() => import('./ImportExportModal'));
const ConnectionEditor = lazy(() => import('./ConnectionEditor'));
const RouteAnalysisPanel = lazy(() => import('./RouteAnalysisPanel'));
const VersionHistory = lazy(() => import('./VersionHistory'));
const SuggestionsModal = lazy(() => import('./SuggestionsModal'));
const EmbedModal = lazy(() => import('./EmbedModal'));

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
          return {
            position: index,
            intent: node.type,
            user_message: node.data.label || `Nodo ${index + 1}`,
            bot_response: botResponse,
            condition: node.type === 'option' ? node.data.condition : undefined,
            position_x: node.position.x,
            position_y: node.position.y,
            node_id: node.id // Guardar el ID original del nodo
          };
        }),
        edges: edges.map((edge) => {
          // Extraer los índices numéricos de los IDs de los nodos
          const sourceMatch = edge.source.match(/node-(\d+)/);
          const targetMatch = edge.target.match(/node-(\d+)/);
          
          // Si los IDs tienen el formato esperado (node-X), extraer el número
          // Si no, intentar usar el ID directamente (podría ser un número o un string)
          const sourceIndex = sourceMatch ? sourceMatch[1] : edge.source.replace('node-', '');
          const targetIndex = targetMatch ? targetMatch[1] : edge.target.replace('node-', '');
          
          return {
            source: sourceIndex,
            target: targetIndex,
            sourceHandle: edge.sourceHandle,
          };
        }),
      };
      const response = await request('PUT', `/api/plubots/update/${plubotIdFromUrl}`, payload);
      if (response.status !== 'success') {
        throw new Error(response.message || 'Respuesta inválida');
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        byteMessage: `⚠️ Error al guardar el flujo: ${error.message}`,
        notification: { message: 'Error al guardar el flujo', type: 'error' },
      }));
      setTimeout(() => setState((prev) => ({ ...prev, notification: null })), 3000);
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
            setNodes(initialNodes);
            setEdges(initialEdges);
            updatePlubotData({
              id: plubot.id,
              name: plubot.name || 'Sin nombre',
              tone: plubot.tone || 'neutral',
              color: plubot.color || '#D1D5DB',
              flowData: { nodes: initialNodes, edges: initialEdges },
            });
            setState((prev) => ({
              ...prev,
              byteMessage: '📋 No se encontraron flujos, inicializando con plantilla predeterminada.',
              isDataLoaded: true,
            }));
            lastSignificantChange.current = { nodes: [...initialNodes], edges: [...initialEdges] };
            return;
          }

          const counters = {};
          flows.forEach((flow) => {
            counters[flow.intent || 'message'] = (counters[flow.intent || 'message'] || 0) + 1;
          });
          Object.assign(nodeCounters.current, counters);

          const newNodes = flows.map((flow, index) => {
            const position = flow.position !== undefined ? flow.position : index;
            return {
              id: flow.node_id || `node-${position}`, // Usar el ID original si existe
              type: flow.intent || 'message',
              position: {
                x: flow.position_x ?? 100 * (index % 5),
                y: flow.position_y ?? 100 * Math.floor(index / 5),
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

          const newEdges = edges
            .map((edge, index) => {
              // Si tenemos los IDs originales, usarlos directamente
              if (edge.source && edge.target && nodeIdMap[edge.source] && nodeIdMap[edge.target]) {
                return {
                  id: edge.id || `edge-${index}-${edge.source}-${edge.target}`,
                  source: edge.source,
                  target: edge.target,
                  type: 'default',
                  animated: false,
                  sourceHandle: edge.sourceHandle,
                };
              }

              // Fallback al método anterior si no tenemos IDs originales
              const sourcePosition = Object.keys(flowIdToPosition).find(
                (key) => flows[flowIdToPosition[key]].position === parseInt(edge.source, 10)
              );
              const targetPosition = Object.keys(flowIdToPosition).find(
                (key) => flows[flowIdToPosition[key]].position === parseInt(edge.target, 10)
              );

              const sourceNodeId = sourcePosition !== undefined ? `node-${sourcePosition}` : null;
              const targetNodeId = targetPosition !== undefined ? `node-${targetPosition}` : null;

              if (!sourceNodeId || !targetNodeId) return null;

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

              return {
                id: `edge-${index}-${sourceNodeId}-${targetNodeId}`,
                source: sourceNodeId,
                target: targetNodeId,
                type: 'default',
                animated: false,
                sourceHandle: computedSourceHandle,
              };
            })
            .filter((edge) => edge !== null);

          const nodeIds = newNodes.map((node) => node.id);
          const validEdges = newEdges.filter((edge) => nodeIds.includes(edge.source) && nodeIds.includes(edge.target));

          setNodes(newNodes);
          setEdges(validEdges);
          updatePlubotData({
            id: plubot.id,
            name: plubot.name || 'Sin nombre',
            tone: plubot.tone || 'neutral',
            color: plubot.color || '#D1D5DB',
            flowData: { nodes: newNodes, edges: validEdges },
          });
          setState((prev) => ({ ...prev, byteMessage: '📋 Flujos cargados exitosamente.', isDataLoaded: true }));
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

  const handleBack = useCallback(async () => {
    await saveFlowData();
    navigate('/profile');
  }, [saveFlowData, navigate]);

  const handleValidateConnections = useCallback(() => {
    const isValid = validateConnections(nodes, edges, addXp, addPluCoins);
    setState((prev) => ({
      ...prev,
      byteMessage: isValid
        ? '✅ Flujo validado correctamente. ¡Buen trabajo!'
        : '⚠️ Problemas detectados en el flujo.',
    }));
  }, [nodes, edges, addXp, addPluCoins]);

  const handleAnalyzeFlowRoutes = useCallback(() => {
    const analysis = analyzeFlowRoutes(nodes, edges);
    setState((prev) => ({
      ...prev,
      routeAnalysis: analysis,
      showRouteAnalysis: true,
      byteMessage: '📊 Análisis de rutas completado.',
    }));
  }, [nodes, edges]);

  const toggleSimulation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showSimulation: !prev.showSimulation,
      byteMessage: !prev.showSimulation ? '🎬 Simulación iniciada.' : '🔍 Simulador cerrado.',
    }));
  }, []);

  const addNewNode = useCallback(
    (type) => {
      nodeCounters.current[type] = (nodeCounters.current[type] || 0) + 1;
      const nodeCount = nodeCounters.current[type];
      const newNode = generateNode(type, nodeCount);
      setNodes((nds) => {
        const updatedNodes = [...nds, newNode];
        lastSignificantChange.current.nodes = updatedNodes;
        debouncedSave();
        return updatedNodes;
      });
      setState((prev) => ({
        ...prev,
        byteMessage: `🆕 Nodo de tipo ${type} añadido.`,
      }));
    },
    [setNodes, debouncedSave]
  );

  const notifyByte = useCallback((message) => {
    const byteAssistant = document.querySelector('.ts-byte-assistant, .ts-byte-minimized');
    if (byteAssistant) {
      const notification = document.createElement('div');
      notification.className = 'byte-notification';
      notification.textContent = message;
      notification.style.position = 'absolute';
      notification.style.background = 'rgba(0, 224, 255, 0.2)';
      notification.style.color = '#fff';
      notification.style.padding = '8px 12px';
      notification.style.borderRadius = '8px';
      notification.style.fontSize = '12px';
      notification.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
      notification.style.zIndex = '1500';
      notification.style.pointerEvents = 'none';
      notification.style.transition = 'all 0.3s ease-out';
      notification.style.maxWidth = '250px';
      notification.style.textAlign = 'center';
      notification.style.whiteSpace = 'normal';

      const rect = byteAssistant.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const notificationWidth = 250;
      notification.style.left = `${Math.min(rect.left + rect.width / 2, windowWidth - notificationWidth - 20)}px`;
      notification.style.top = `${rect.top - 50}px`;
      notification.style.transform = 'translateX(-50%)';

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => notification.parentNode?.removeChild(notification), 500);
      }, 2000);

      requestAnimationFrame(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
      });
    }
  }, []);

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
          setState((prev) => ({
            ...prev,
            byteMessage: '🔴 Nodos resaltados. Ajusta las conexiones según sea necesario.',
          }));
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

  const handleShowEmbedModal = useCallback(() => {
    setState((prev) => ({ ...prev, showEmbedModal: true }));
    setState((prev) => ({ ...prev, byteMessage: 'Puedes compartir tu Plubot con un enlace directo o embeber el chatbot en tu sitio web.' }));
  }, []);

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
      onImport: (data) => {
        setNodes(data.nodes);
        setEdges(data.edges);
        setState((prev) => ({ ...prev, byteMessage: '📋 Datos importados.' }));
        saveFlowData();
        triggerSaveOnSignificantChange();
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

  return (
    <div className="ts-training-screen">
      {state.notification && (
        <div className={`notification notification-${state.notification.type}`} style={{ position: 'fixed', top: '20px', right: '20px', background: state.notification.type === 'success' ? 'rgba(0, 224, 255, 0.2)' : 'rgba(255, 0, 0, 0.2)', color: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 0 10px rgba(0, 224, 255, 0.5)', zIndex: 2000 }}>
          {state.notification.message}
        </div>
      )}
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
          <button className="ts-training-action-btn" onClick={handleValidateConnections}>Validar</button>
          <button className="ts-training-action-btn" onClick={handleAnalyzeFlowRoutes}>Analizar</button>
          <button className="ts-training-action-btn" onClick={toggleSimulation}>{state.showSimulation ? 'Cerrar Simulación' : 'Simular'}</button>
          <button className="ts-training-action-btn" onClick={handleGenerateSuggestions}>Sugerencias</button>
          <button className="ts-training-action-btn" onClick={() => setState((prev) => ({ ...prev, exportMode: true }))}>Exportar</button>
          <button className="ts-training-action-btn ts-share-button" onClick={handleShowEmbedModal} disabled={!plubotIdFromUrl}>Compartir y Embeber</button>
        </div>
      </div>

      {state.isDataLoaded && (
        <FlowEditor
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={(newEdges) => {
            setEdges(newEdges);
            triggerSaveOnSignificantChange();
          }}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          setByteMessage={(msg) => setState((prev) => ({ ...prev, byteMessage: msg }))}
          setShowConnectionEditor={(val) => setState((prev) => ({ ...prev, showConnectionEditor: val }))}
          setSelectedConnection={(conn) => setState((prev) => ({ ...prev, selectedConnection: conn }))}
          setConnectionProperties={(props) => setState((prev) => ({ ...prev, connectionProperties: props }))}
          handleError={handleError}
          showSimulation={state.showSimulation}
          setShowSimulation={(val) => setState((prev) => ({ ...prev, showSimulation: val }))}
          className="ts-flow-editor"
          plubotId={plubotData?.id}
          name={plubotData?.name || 'Sin nombre'}
          notifyByte={notifyByte}
          onNodeDragStop={triggerSaveOnSignificantChange}
        />
      )}

      <NodePalette setNodes={setNodes} setByteMessage={(msg) => setState((prev) => ({ ...prev, byteMessage: msg }))} className="ts-node-palette" />

      <Suspense fallback={<div>Loading...</div>}>
        <VersionHistory
          versions={plubotData.flowVersions}
          onRestore={(versionData) => {
            setNodes(versionData.nodes);
            setEdges(versionData.edges);
            setState((prev) => ({ ...prev, byteMessage: '🔄 Versión restaurada.' }));
            triggerSaveOnSignificantChange();
          }}
          className="ts-version-history"
        />
      </Suspense>

      <ModalManager
        modals={modals}
        modalProps={modalProps}
        onClose={(key) => setState((prev) => ({ ...prev, [key]: false }))}
      />

      <ByteAssistant message={state.byteMessage} simulationMode={state.showSimulation} />
    </div>
  );
};

export default TrainingScreen;