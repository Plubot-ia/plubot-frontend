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

// Importar stores de Zustand
import useFlowStore from '@/stores/useFlowStore';
import useTrainingStore from '@/stores/useTrainingStore';

import FlowEditor from '../flow-editor/FlowEditor.jsx';
import NodePalette from '../common/NodePalette';
import ByteAssistant from '../common/ByteAssistant';
import StatusBubble from '../common/StatusBubble';
import ConnectionEditor from '../modals/ConnectionEditor';
import RouteAnalysisModal from '../modals/RouteAnalysisModal';
import SuggestionsModal from '../modals/SuggestionsModal';
import ExportModal from '../modals/ExportModal';
import TemplateSelector from '../modals/TemplateSelector';
import VersionHistoryPanel from '../panels/VersionHistoryPanel';
import { prepareEdgesForSaving, backupEdgesToLocalStorage } from '@/utils/flowUtils';

// Modal Manager para manejar la renderización condicional de modales
const ModalManager = ({ modals, modalProps, onClose }) => {
  return (
    <>
      {modals.showConnectionEditor && (
        <ConnectionEditor
          connection={modalProps.selectedConnection}
          properties={modalProps.connectionProperties}
          onSave={modalProps.onSaveConnection}
          onClose={() => onClose('showConnectionEditor')}
        />
      )}
      
      {modals.showRouteAnalysis && (
        <RouteAnalysisModal
          data={modalProps.routeAnalysisData}
          onClose={() => onClose('showRouteAnalysis')}
        />
      )}
      
      {modals.showSuggestionsModal && (
        <SuggestionsModal
          suggestions={modalProps.nodeSuggestions}
          onClose={() => onClose('showSuggestionsModal')}
          onAddNode={modalProps.onAddSuggestedNode}
        />
      )}
      
      {modals.showTemplateSelector && (
        <TemplateSelector
          onSelect={modalProps.onSelectTemplate}
          onClose={() => onClose('showTemplateSelector')}
        />
      )}
      
      {modals.showExportMode && (
        <ExportModal
          nodes={modalProps.nodes}
          edges={modalProps.edges}
          format={modalProps.exportFormat}
          onClose={() => onClose('showExportMode')}
        />
      )}
    </>
  );
};

// Custom hook para la gestión del flujo
const useFlowEditor = (initialNodes, initialEdges) => {
  const [nodes, setNodes] = useState(initialNodes || []);
  const [edges, setEdges] = useState(initialEdges || []);
  const [selectedNode, setSelectedNode] = useState(null);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, []);

  return { nodes, edges, selectedNode, setNodes, setEdges, setSelectedNode, onNodesChange, onEdgesChange, onConnect };
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
  
  // Obtener el estado y las acciones de los stores de Zustand
  const {
    nodes,
    edges,
    flowName,
    selectedNode,
    selectedEdge,
    isUltraMode,
    setNodes,
    setEdges,
    setFlowName,
    onNodesChange,
    onEdgesChange,
    onConnect,
    toggleUltraMode,
    undo,
    redo,
    canUndo,
    canRedo
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
    toggleSimulation
  } = useTrainingStore();

  // Inicializar el estado del store con los datos del plubot si es necesario
  useEffect(() => {
    if (plubotData && plubotData.id) {
      setPlubotData(plubotData);
    }
    
    // Mensaje inicial
    if (!byteMessage) {
      setByteMessage('¡Hola! Estoy aquí para ayudarte a crear tu Plubot. Arrastra un nodo desde la paleta para comenzar.');
    }
  }, [plubotData, setPlubotData, byteMessage, setByteMessage]);
  
  // Estado local para mantener compatibilidad con el código existente
  const [state, setState] = useState({
    notification: null,
    errorMessage: null,
    isDataLoaded: false,
    isGenerating: false,
    flowStyles: { edgeStyles: { strokeWidth: 2, stroke: '#00e0ff', animated: false } },
    // Usamos getters para acceder al estado de Zustand
    get byteMessage() { return byteMessage || ''; },
    get showSimulation() { return showSimulation; },
    get exportMode() { return showExportMode; },
    get importData() { return importData || ''; },
    get exportFormat() { return exportFormat || 'json'; },
    get showConnectionEditor() { return showConnectionEditor; },
    get selectedConnection() { return selectedConnection; },
    get connectionProperties() {
      return connectionProperties || {
        animated: false,
        label: '',
        style: { stroke: '#00e0ff', strokeWidth: 2, strokeDasharray: '' },
        type: 'default'
      };
    },
    get showRouteAnalysis() { return showRouteAnalysis; },
    get routeAnalysisData() { return routeAnalysisData || { routes: [], errors: [] }; },
    get showVersionHistoryPanel() { return showVersionHistoryPanel; },
    get showTemplateSelector() { return showTemplateSelector; },
    get showSuggestionsModal() { return showSuggestionsModal; },
    get nodeSuggestions() { return nodeSuggestions || []; },
    get showEmbedModal() { return showEmbedModal; }
  });

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

  // Inicializar los nodos y aristas en el store de Zustand si están vacíos
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [nodes.length, edges.length, setNodes, setEdges]);

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
  
  // Wrapper para la función de guardado con Zustand
  const handleSaveFlow = useCallback(async () => {
    // Mostrar mensaje de guardando inmediatamente para mejorar la experiencia del usuario
    setIsLoading(true);
    setByteMessage('💾 Guardando flujo...');

    if (!state.isDataLoaded) {
      setByteMessage('⏳ Datos aún cargando, espera un momento antes de guardar.');
      setIsLoading(false);
      return;
    }
    
    if (!nodes.length || !updatePlubotData || !plubotIdFromUrl) {
      setByteMessage('⚠️ No hay datos de flujo para guardar o falta el ID del Plubot.');
      setIsLoading(false);
      return;
    }
    
    // Guardar las aristas en localStorage como respaldo antes de enviarlas al servidor
    backupEdgesToLocalStorage(edges);
    
    try {
      // Asegurar un nombre por defecto si plubotData.name está vacío
      const plubotName = plubotData.name || 'Sin nombre';
      if (!plubotData.name) {
        updatePlubotData({ ...plubotData, name: plubotName });
        setByteMessage('⚠️ Nombre del Plubot no especificado. Usando "Sin nombre" por defecto.');
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
        if (isDuplicated) acc.push(curr.user_message);
        return acc;
      }, []);

      if (duplicates.length > 0) {
        setByteMessage(`⚠️ Advertencia: Hay mensajes duplicados en el flujo: ${duplicates.join(', ')}`);
        
        const newNodes = [...nodes];
        // Añadir validación para evitar errores cuando un nodo no tiene label definido
        const usedLabels = new Set(nodes.map((n) => {
          // Verificar que n.data y n.data.label existan antes de llamar a toLowerCase
          return n.data && n.data.label ? n.data.label.toLowerCase() : `node-${n.id}`;
        }));
        
        // Resolver duplicados
        duplicates.forEach((duplicate) => {
          const nodeIndex = newNodes.findIndex((n) => n.data && n.data.label === duplicate);
          if (nodeIndex !== -1) {
            let newLabel = duplicate;
            let counter = 1;
            while (usedLabels.has(newLabel.toLowerCase())) {
              newLabel = `${duplicate}-${counter}-${uuidv4().slice(0, 4)}`;
              counter++;
            }
            usedLabels.add(newLabel.toLowerCase());
            newNodes[nodeIndex] = { ...newNodes[nodeIndex], data: { ...newNodes[nodeIndex].data, label: newLabel } };
          }
        });
        
        setNodes(newNodes);
        setByteMessage('🔄 Duplicados detectados y resueltos. Guardando...');
        setTimeout(() => handleSaveFlow(), 100);
        return;
      }

      // Validar conexiones
      const { isValid, errors } = validateConnections(nodes, edges);
      if (!isValid) {
        setByteMessage(`⚠️ El flujo tiene errores: ${errors.join(', ')}`);
        setIsLoading(false);
        return;
      }

      // Preparar datos para guardar
      const flowData = {
        name: plubotName,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        id: plubotIdFromUrl
      };

      // Actualizar datos del Plubot
      await updatePlubotData(flowData);
      
      // Actualizar el estado local
      setState(prev => ({
        ...prev,
        isDataLoaded: true
      }));
      
      // Mensaje de éxito
      setByteMessage('✅ Flujo guardado correctamente');
      
      // Otorgar recompensas al usuario
      addXp(5);
      addPluCoins(10);
      
    } catch (error) {
      console.error('[TrainingScreen] Error al guardar flujo:', error);
      setByteMessage('Error al guardar flujo: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, state.isDataLoaded, plubotIdFromUrl, plubotData, updatePlubotData, setByteMessage, setIsLoading, addXp, addPluCoins, setNodes]);
  
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
    if (nodes.length > 0 || edges.length > 0) {
      // Guardar automáticamente cuando hay cambios significativos
      debouncedSave();
    }
  }, [nodes, edges, debouncedSave]);
  
  // Componente para gestionar los modales
  const renderModals = () => {
    const modals = {
      showConnectionEditor,
      showRouteAnalysis,
      showSuggestionsModal,
      showTemplateSelector,
      showExportMode,
      showEmbedModal
    };
    
    const modalProps = {
      selectedConnection,
      connectionProperties,
      routeAnalysisData,
      nodeSuggestions,
      nodes,
      edges,
      exportFormat,
      onSaveConnection: (updatedProperties) => {
        setConnectionProperties(updatedProperties);
        setShowConnectionEditor(false);
      },
      onAddSuggestedNode: (nodeType, position) => {
        // Lógica para añadir nodo sugerido
        setShowSuggestionsModal(false);
      },
      onSelectTemplate: (template) => {
        // Lógica para seleccionar plantilla
        setShowTemplateSelector(false);
      }
    };
    
    const handleCloseModal = (modalName) => {
      switch (modalName) {
        case 'showConnectionEditor':
          setShowConnectionEditor(false);
          break;
        case 'showRouteAnalysis':
          setShowRouteAnalysis(false);
          break;
        case 'showSuggestionsModal':
          setShowSuggestionsModal(false);
          break;
        case 'showTemplateSelector':
          setShowTemplateSelector(false);
          break;
        case 'showExportMode':
          setShowExportMode(false);
          break;
        case 'showEmbedModal':
          setShowEmbedModal(false);
          break;
        default:
          break;
      }
    };
    
    return <ModalManager modals={modals} modalProps={modalProps} onClose={handleCloseModal} />;
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

  if (isLoading) {
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
          <button className="ts-training-action-btn" onClick={() => navigate('/profile')}>
            ← Volver al Perfil
          </button>
          <h1 className="ts-title">{plubotData.name || 'Nuevo Plubot'}</h1>
        </div>
        <div className="ts-header-right">
          <button
            className={`ts-training-action-btn ${isUltraMode ? 'active' : ''}`}
            onClick={handleToggleUltraMode}
            title="Modo Ultra (más opciones)"
          >
            {isUltraMode ? '🔥 Modo Ultra' : '⚡ Modo Ultra'}
          </button>
          <button
            className={`ts-training-action-btn ${showSimulation ? 'active' : ''}`}
            onClick={handleToggleSimulation}
            title="Simulación"
          >
            {showSimulation ? '🎮 Simulando...' : '🎮 Simular'}
          </button>
          <button
            className="ts-training-action-btn"
            onClick={handleSaveFlow}
            title="Guardar Flujo"
          >
            💾 Guardar
          </button>
          <div className="ts-undo-redo-container">
            <button
              className={`ts-training-action-btn ${!canUndo ? 'disabled' : ''}`}
              onClick={handleUndo}
              disabled={!canUndo}
              title="Deshacer"
            >
              ↩️
            </button>
            <button
              className={`ts-training-action-btn ${!canRedo ? 'disabled' : ''}`}
              onClick={handleRedo}
              disabled={!canRedo}
              title="Rehacer"
            >
              ↪️
            </button>
          </div>
        </div>
      </div>

      <div className="ts-main-content">
        <NodePalette />
        
        <div className="ts-flow-editor-container">
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
            flowStyles={state.flowStyles}
            simulationMode={showSimulation}
          />
        </div>
        
        {showVersionHistoryPanel && (
          <VersionHistoryPanel
            versions={plubotData.flowVersions || []}
            onSelect={(version) => {
              // Lógica para cargar versión
              setShowVersionHistoryPanel(false);
            }}
            onClose={() => setShowVersionHistoryPanel(false)}
          />
        )}
      </div>
      
      {renderModals()}
      
      <ByteAssistant simulationMode={showSimulation} /> 
      <StatusBubble message={byteMessage} />
    </div>
  );
};

export default TrainingScreen;
