import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactFlow, { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
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
import EpicHeader from '../common/EpicHeader';
import CustomMiniMap from '../flow-editor/components/CustomMiniMap';
import ConnectionEditor from '../simulation/ConnectionEditor';
import SimulationInterface from '../simulation/SimulationInterface';
// Importar todos los modales necesarios
import SuggestionsModal from '../modals/SuggestionsModal';
import ImportExportModal from '../modals/ImportExportModal';
import EmbedModal from '../modals/EmbedModal';
import TemplateSelector from '../modals/TemplateSelector';
import VersionHistory from '../modals/VersionHistory';
import { prepareEdgesForSaving, backupEdgesToLocalStorage } from '../flow-editor/utils/edgeFixUtil';

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
      
      {/* El modal RouteAnalysisModal no existe actualmente, se implementará en el futuro */}
      {/*
      {modals.showRouteAnalysis && (
        <div className="modal-placeholder">
          <h2>Análisis de Rutas</h2>
          <p>Esta funcionalidad está en desarrollo.</p>
          <button onClick={() => onClose('showRouteAnalysis')}>Cerrar</button>
        </div>
      )}
      */}
      
      {modals.showSuggestionsModal && (
        <SuggestionsModal
          suggestions={modalProps.nodeSuggestions}
          onClose={() => onClose('showSuggestionsModal')}
          onAddNode={modalProps.onAddSuggestedNode}
        />
      )}
      
      {modals.showTemplateSelector && (
        <TemplateSelector
          onSelectTemplate={modalProps.onSelectTemplate}
          onClose={() => onClose('showTemplateSelector')}
        />
      )}
      
      {modals.showExportMode && (
        <ImportExportModal
          nodes={modalProps.nodes}
          edges={modalProps.edges}
          format={modalProps.exportFormat}
          onClose={() => onClose('showExportMode')}
        />
      )}
      
      {modals.showEmbedModal && (
        <EmbedModal
          nodes={modalProps.nodes}
          edges={modalProps.edges}
          onClose={() => onClose('showEmbedModal')}
        />
      )}
      
      {modals.showVersionHistoryPanel && (
        <VersionHistory
          onClose={() => onClose('showVersionHistoryPanel')}
        />
      )}
    </>
  );
};

// El custom hook useFlowEditor ha sido reemplazado por los stores de Zustand

const TrainingScreen = () => {
  const [searchParams] = useSearchParams();
  // Obtener el ID del plubot de la URL (formato: /plubot/edit/training/130)
  const { pathname } = window.location;
  const pathParts = pathname.split('/');
  // Asegurarse de que el ID es un número válido
  let plubotIdFromUrl = pathParts[pathParts.length - 1] || searchParams.get('plubotId') || null;
  
  // Validar que el ID es un número y no está vacío
  if (plubotIdFromUrl && (plubotIdFromUrl === 'training' || isNaN(parseInt(plubotIdFromUrl)))) {
    // Si el último segmento es 'training', buscar en el penúltimo segmento
    plubotIdFromUrl = pathParts[pathParts.length - 2] || searchParams.get('plubotId') || null;
  }
  
  // Verificar si es un ID válido (número)
  if (plubotIdFromUrl && !isNaN(parseInt(plubotIdFromUrl))) {
    console.log('ID del Plubot encontrado en la URL:', plubotIdFromUrl);
  } else {
    console.warn('No se encontró un ID válido en la URL. Usando ID por defecto: 130');
    plubotIdFromUrl = '130'; // ID por defecto para desarrollo
  }
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
    onNodesChange,
    setEdges,
    setFlowName,
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
    // Añadir las funciones para los botones del EpicHeader
    openShareModal,
    openSimulateModal,
    openTemplatesModal,
    openSettingsModal
  } = useTrainingStore();

  // Inicializar el estado del store con los datos del plubot si es necesario
  useEffect(() => {
    // Si tenemos un ID de la URL pero no tenemos datos del plubot, inicializar con datos básicos
    if (plubotIdFromUrl && (!plubotData || !plubotData.id)) {
      // Intentar recuperar el nombre del localStorage primero
      const savedPlubotName = localStorage.getItem(`plubot-name-${plubotIdFromUrl}`);
      
      const initialData = {
        id: plubotIdFromUrl,
        name: savedPlubotName || `Plubot ${plubotIdFromUrl}`
      };
      
      setPlubotData(initialData);
      console.log('Estableciendo datos del plubot con ID:', plubotIdFromUrl, 'y nombre:', initialData.name);
    } else if (plubotData && plubotData.id) {
      // Si ya tenemos datos, asegurarnos de que estén en el store y guardar el nombre en localStorage
      if (plubotData.name && plubotData.name !== `Plubot ${plubotData.id}`) {
        localStorage.setItem(`plubot-name-${plubotData.id}`, plubotData.name);
      }
      setPlubotData(plubotData);
    }
    
    // Mensaje inicial
    if (!byteMessage) {
      setByteMessage('¡Hola! Estoy aquí para ayudarte a crear tu Plubot. Arrastra un nodo desde la paleta para comenzar.');
    }
  }, [plubotIdFromUrl, plubotData, setPlubotData, byteMessage, setByteMessage]);
  
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

  // Inicializar los nodos y aristas en el store de Zustand solo al cargar por primera vez
  const initialLoadRef = useRef(true);
  
  useEffect(() => {
    // Solo cargar los nodos iniciales si es la primera carga y no hay nodos
    if (initialLoadRef.current && nodes.length === 0 && edges.length === 0) {
      // Usar las funciones correctas del store para inicializar nodos y aristas
      const changes = initialNodes.map(node => ({
        type: 'add',
        item: node
      }));
      onNodesChange(changes);
      setEdges(initialEdges);
      
      // Marcar que ya se ha realizado la carga inicial
      initialLoadRef.current = false;
    }
  }, [nodes.length, edges.length, onNodesChange, setEdges]);

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
    // No activamos el loader global para evitar el mensaje "Cargando datos de plubot"
    // setIsLoading(true); // Comentado para evitar mostrar el loader
    setByteMessage('💾 Guardando flujo...');

    // Verificar si los datos están cargados
    const isDataLoaded = plubotData && Object.keys(plubotData).length > 0;
    if (!isDataLoaded) {
      setByteMessage('⏳ Datos aún cargando, espera un momento antes de guardar.');
      setIsLoading(false);
      return;
    }
    
    // Verificar si hay nodos para guardar
    if (!nodes.length) {
      // Usar un mensaje claro con emoji para StatusBubble
      setByteMessage('⚠️ No hay nodos en el editor');
      setIsLoading(false);
      return;
    }
    
    // Verificar si tenemos la función para actualizar datos y el ID del plubot
    if (!updatePlubotData || !plubotIdFromUrl) {
      console.error('Falta updatePlubotData o plubotIdFromUrl:', { updatePlubotData: !!updatePlubotData, plubotIdFromUrl });
      setByteMessage('⚠️ Error al guardar: falta el ID del Plubot.');
      setIsLoading(false);
      return;
    }
    
    // Guardar las aristas en localStorage como respaldo antes de enviarlas al servidor
    if (edges && edges.length > 0) {
      backupEdgesToLocalStorage(edges);
    }
    
    try {
      // Asegurar un nombre por defecto si plubotData está vacío o no tiene nombre
      if (plubotData) {
        const plubotName = plubotData.name || 'Sin nombre';
        if (!plubotData.name) {
          updatePlubotData({ ...plubotData, name: plubotName });
          setByteMessage('⚠️ Nombre del Plubot no especificado. Usando "Sin nombre" por defecto.');
        }
      } else {
        setByteMessage('⚠️ No hay datos del Plubot disponibles.');
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
            if (newNodes[nodeIndex]) {
              const currentNodeData = newNodes[nodeIndex].data || {};
              newNodes[nodeIndex] = { 
                ...newNodes[nodeIndex], 
                data: { ...currentNodeData, label: newLabel } 
              };
            }
          }
        });
        
        // Usar onNodesChange para actualizar los nodos
        const changes = newNodes.map(node => ({
          type: 'add',
          item: node
        }));
        onNodesChange(changes);
        setByteMessage('🔄 Duplicados detectados y resueltos. Guardando...');
        setTimeout(() => handleSaveFlow(), 100);
        return;
      }

      // Validar conexiones
      try {
        const { valid, issues, warnings } = validateConnections(nodes, edges);
        
        if (!valid && Array.isArray(issues) && issues.length > 0) {
          setByteMessage(`⚠️ El flujo tiene errores: ${issues.join(', ')}`);
          setIsLoading(false);
          return;
        }
        
        // Mostrar advertencias si hay, pero continuar con el guardado
        if (Array.isArray(warnings) && warnings.length > 0) {
          console.warn('Advertencias en el flujo:', warnings);
          // No interrumpimos el guardado por advertencias
        }
      } catch (validationError) {
        console.error('Error al validar conexiones:', validationError);
        // Continuar con el guardado aunque haya un error en la validación
      }

      // Preparar datos para guardar
      const flowData = {
        name: flowName || plubotData?.name || 'Nuevo Plubot',
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        id: plubotIdFromUrl
      };

      // Guardar el nombre en localStorage para persistencia
      if (flowData.name) {
        localStorage.setItem(`plubot-name-${plubotIdFromUrl}`, flowData.name);
      }
      
      // Actualizar datos del Plubot
      await updatePlubotData(flowData);
      
      // Ya no necesitamos actualizar un estado local con setState
      // ya que estamos usando Zustand para el manejo de estado
      console.log('Flujo guardado correctamente con nombre:', flowData.name);
      
      // Mensaje de éxito con un timeout para asegurar que se muestre
      // Primero limpiamos cualquier mensaje anterior
      setByteMessage('');
      
      // Luego mostramos el mensaje de éxito después de un breve delay
      setTimeout(() => {
        setByteMessage('✅ Flujo guardado correctamente');
      }, 100);
      
      // Otorgar recompensas al usuario
      addXp(5);
      addPluCoins(10);
      
    } catch (error) {
      console.error('[TrainingScreen] Error al guardar flujo:', error);
      setByteMessage('Error al guardar flujo: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, state.isDataLoaded, plubotIdFromUrl, plubotData, updatePlubotData, setByteMessage, setIsLoading, addXp, addPluCoins, onNodesChange]);
  
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
  
  // Función para cerrar todos los modales
  const closeAllModals = () => {
    setShowConnectionEditor(false);
    setShowSuggestionsModal(false);
    setShowTemplateSelector(false);
    setShowRouteAnalysis(false);
    setShowExportMode(false);
    setShowEmbedModal(false);
    setShowVersionHistoryPanel(false);
    setShowSimulation(false); // También cerrar el modo simulación
    
    // Mensaje informativo
    setByteMessage('🏠 Volviendo al editor');
    
    console.log('Todos los modales han sido cerrados');
  };
  
  // Exponer la función closeAllModals globalmente para que EpicHeader pueda acceder a ella
  useEffect(() => {
    window.closeAllModals = closeAllModals;
    
    return () => {
      // Limpiar cuando el componente se desmonte
      window.closeAllModals = null;
    };
  }, []);

  // Componente para gestionar los modales
  const renderModals = () => {
    return (
      <>
        {showConnectionEditor && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Editor de Conexión</h2>
              <button onClick={() => setShowConnectionEditor(false)} className="modal-close-btn">×</button>
              {/* Contenido del editor de conexión */}
            </div>
          </div>
        )}

        {showSuggestionsModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Sugerencias de Nodos</h2>
              <button onClick={() => setShowSuggestionsModal(false)} className="modal-close-btn">×</button>
              {/* Contenido de sugerencias de nodos */}
            </div>
          </div>
        )}

        {showTemplateSelector && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Seleccionar Plantilla</h2>
              <button onClick={() => setShowTemplateSelector(false)} className="modal-close-btn">×</button>
              {/* Contenido del selector de plantillas */}
            </div>
          </div>
        )}

        {showRouteAnalysis && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Análisis de Rutas</h2>
              <button onClick={() => setShowRouteAnalysis(false)} className="modal-close-btn">×</button>
              {/* Contenido del análisis de rutas */}
            </div>
          </div>
        )}

        {showExportMode && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Exportar Flujo</h2>
              <button onClick={() => setShowExportMode(false)} className="modal-close-btn">×</button>
              {/* Contenido del modo de exportación */}
            </div>
          </div>
        )}

        {showEmbedModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Incrustar Plubot</h2>
              <button onClick={() => setShowEmbedModal(false)} className="modal-close-btn">×</button>
              {/* Contenido del modal de incrustación */}
            </div>
          </div>
        )}

        {showVersionHistoryPanel && (
          <div className="modal-overlay">
            <div className="modal-content version-history-modal">
              <VersionHistory 
                onClose={() => setShowVersionHistoryPanel(false)} 
                plubotId={plubotIdFromUrl}
              />
            </div>
          </div>
        )}
      </>
    );
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
      {/* EpicHeader en la parte superior con botón minimalista para volver al perfil */}
      <EpicHeader 
        logoSrc="/logo.svg" 
        onCloseModals={closeAllModals} 
        flowName={plubotData?.name || 'Nuevo Plubot'}
        // Pasar las funciones para los botones
        openShareModal={openShareModal}
        getVisibleNodeCount={getVisibleNodeCount}
        openSimulateModal={openSimulateModal}
        openTemplatesModal={openTemplatesModal}
        openSettingsModal={openSettingsModal}
        saveFlow={useFlowStore.getState().saveFlow}
        customActions={
          <button 
            className="epic-header-back-btn" 
            onClick={() => navigate('/profile')}
            title="Volver al Perfil"
          >
            ← Volver al Perfil
          </button>
        }
      />

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
            simulationMode={showSimulation}
            handleError={handleError}
            hideHeader={true}
            plubotId={plubotIdFromUrl}
            name={plubotData?.name || 'Nuevo Plubot'}
            notifyByte={setByteMessage}
            saveFlowData={handleSaveFlow}
            onDrop={(event) => {
              // Prevenir comportamiento por defecto
              event.preventDefault();
              event.stopPropagation();
              
              console.log('onDrop event recibido en FlowEditor');
              
              // Obtener los límites del área de ReactFlow
              const reactFlowElement = document.querySelector('.react-flow');
              const reactFlowBounds = reactFlowElement?.getBoundingClientRect();
              
              if (!reactFlowBounds) {
                console.error('No se pudo encontrar el elemento .react-flow');
                setByteMessage('❌ Error: No se pudo encontrar el área del editor');
                return;
              }
              
              // Intentar obtener los datos arrastrados de diferentes formatos
              let jsonData;
              try {
                // Intentar con todos los formatos posibles
                const formats = [
                  'application/reactflow',
                  'text/plain',
                  'application/json'
                ];
                
                for (const format of formats) {
                  const data = event.dataTransfer.getData(format);
                  if (data) {
                    jsonData = data;
                    console.log(`Datos encontrados en formato: ${format}`);
                    break;
                  }
                }
                
                console.log('Datos recibidos en onDrop:', jsonData);
              } catch (e) {
                console.error('Error al obtener datos del dataTransfer:', e);
                setByteMessage('❌ Error al procesar el nodo arrastrado');
                return;
              }
              
              if (!jsonData) {
                console.warn('No se recibieron datos en el evento onDrop');
                setByteMessage('❌ No se recibieron datos del nodo arrastrado');
                return;
              }
              
              // Calcular la posición donde se soltó el nodo
              const { project, viewport } = useFlowStore.getState();
              
              // Calcular la posición correcta teniendo en cuenta el zoom y el desplazamiento
              const dropPosition = project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top
              });
              
              console.log('Posición calculada para el nuevo nodo:', dropPosition);
              
              try {
                // Parsear los datos JSON
                const parsedData = JSON.parse(jsonData);
                console.log('Datos parseados:', parsedData);
                
                if (parsedData.nodeInfo && parsedData.nodeInfo.nodeType) {
                  const { nodeType, label, powerItemData, category } = parsedData.nodeInfo;
                  console.log(`Añadiendo nodo de tipo ${nodeType} con etiqueta ${label}`);
                  
                  // Obtener la función addNode directamente del store
                  const { addNode } = useFlowStore.getState();
                  
                  // Crear el nuevo nodo con un ID único
                  const newNodeId = `${nodeType}-${Date.now()}`;
                  const newNode = addNode(nodeType, dropPosition, {
                    id: newNodeId,
                    label: label || 'Nuevo nodo',
                    category: category || 'default',
                    ...(powerItemData || {})
                  });
                  
                  console.log('Nodo añadido:', newNode);
                  setByteMessage(`✅ Nodo "${label}" añadido al editor`);
                  
                  // Guardar automáticamente después de añadir un nodo
                  setTimeout(() => {
                    handleSaveFlow();
                  }, 1000);
                } else {
                  console.warn('Los datos parseados no tienen la estructura esperada');
                  setByteMessage('⚠️ Formato de nodo incorrecto');
                }
              } catch (error) {
                console.error('Error al añadir nodo:', error);
                setByteMessage('❌ Error al añadir nodo: ' + error.message);
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
          />
        </div>
      </div>
      
      {/* Botones de control en el lado derecho */}
      <div className="ts-side-controls">
        <button
          className={`ts-control-btn ultra-btn ${isUltraMode ? 'active' : ''}`}
          onClick={handleToggleUltraMode}
          title="Modo Ultra (más opciones)"
        >
          {isUltraMode ? '🔥' : '⚡'}
        </button>
        <button
          className="ts-control-btn"
          onClick={() => {
            // Lógica para acercar
            const { zoomIn } = useFlowStore.getState();
            if (zoomIn) zoomIn();
          }}
          title="Acercar"
        >
          +
        </button>
        <button
          className="ts-control-btn"
          onClick={() => {
            // Lógica para alejar
            const { zoomOut } = useFlowStore.getState();
            if (zoomOut) zoomOut();
          }}
          title="Alejar"
        >
          -
        </button>
        <button
          className="ts-control-btn"
          onClick={() => {
            // Lógica para ajustar vista
            const { fitView } = useFlowStore.getState();
            if (fitView) fitView();
          }}
          title="Ajustar Vista"
        >
          🔍
        </button>
        <button
          className="ts-control-btn"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Deshacer"
        >
          ↩️
        </button>
        <button
          className="ts-control-btn"
          onClick={handleRedo}
          disabled={!canRedo}
          title="Rehacer"
        >
          ↪️
        </button>
        <button
          className="ts-control-btn"
          onClick={() => {
            // Lógica para mostrar historial
            setShowVersionHistoryPanel(true);
          }}
          title="Historial"
        >
          📅
        </button>
      </div>
        
      {/* MiniMap en la esquina inferior izquierda */}
      <div className="ts-minimap-container">
        <CustomMiniMap />
      </div>
      
      {renderModals()}
      
      {/* Mostrar SimulationInterface cuando showSimulation es true */}
      {showSimulation && <SimulationInterface nodes={nodes} edges={edges} onClose={() => setShowSimulation(false)} />}
      
      {/* ByteAssistant en la esquina inferior derecha */}
      <ByteAssistant simulationMode={showSimulation} /> 
      {/* Solo mostrar StatusBubble si hay un mensaje y no estamos en modo simulación */}
      {byteMessage && !showSimulation && <StatusBubble message={byteMessage} />}
    </div>
  );
};

export default TrainingScreen;
