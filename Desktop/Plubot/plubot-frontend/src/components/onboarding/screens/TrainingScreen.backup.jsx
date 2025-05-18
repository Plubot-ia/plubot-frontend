import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import { usePlubotCreation } from '@/context/PlubotCreationContext';
import { useGamification } from '@/context/GamificationContext';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import useAPI from '@/hooks/useAPI';
import useDebounce from '@/hooks/useDebounce';
// Importar stores
import useFlowStore from '@/stores/useFlowStore';
import useTrainingStore from '@/stores/useTrainingStore';
// Importar componentes
import FlowEditor from '../flow-editor/FlowEditor.jsx';
import NodePalette from '../common/NodePalette';
import ByteAssistant from '../common/ByteAssistant';
import StatusBubble from '../common/StatusBubble';
import logo from '@/assets/img/plubot.svg';
import './TrainingScreen.css';
import '../styles/responsive.css'; // Estilos responsivos para todos los componentes
import '../fix-global.css'; // CSS global para eliminar overlays oscuros y mensajes duplicados
// Importar utilidades para manejar aristas
import { 
  ensureEdgesAreVisible, 
  recoverEdgesFromLocalStorage, 
  forceEdgesUpdate,
  validateEdges
} from '../flow-editor/utils/edgeFixUtil';

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

// Componente principal que utiliza las stores de Zustand
const TrainingScreen = () => {
  const [isFlowStoreHydrated, setIsFlowStoreHydrated] = useState(useFlowStore.persist.hasHydrated());

  useEffect(() => {
    const unsubFinishHydration = useFlowStore.persist.onFinishHydration(() => {
      console.log('[TrainingScreen] FlowStore finished hydration.');
      setIsFlowStoreHydrated(true);
    });

    // Check again in case it hydrated between initial useState and effect setup
    if (useFlowStore.persist.hasHydrated() && !isFlowStoreHydrated) {
      console.log('[TrainingScreen] FlowStore already hydrated (checked in useEffect).');
      setIsFlowStoreHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, [isFlowStoreHydrated]); // Added isFlowStoreHydrated to re-check if needed, though typically runs once

  console.log('<<<<< TrainingScreen COMPONENT START >>>>>');
  // Protección: no renderizar hasta tener un ID o datos de creación
  const [searchParams] = useSearchParams();
  const { plubotId: plubotIdFromRoute } = useParams();
  const [plubotIdFromUrl, setPlubotIdFromUrl] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return plubotIdFromRoute || params.get('id') || params.get('plubotId') || null;
  });
  console.log('<<<<< TrainingScreen: plubotIdFromUrl INITIALIZED >>>>> Value:', plubotIdFromUrl, 'Type:', typeof plubotIdFromUrl);
  const { plubotData: creationData } = usePlubotCreation();
  if (!plubotIdFromUrl && !creationData) {
    return <div>Cargando...</div>;
  }

  const navigate = useNavigate();
  
  // Inicializar el hook useAPI
  const api = useAPI();
  const [apiRequest, setApiRequest] = useState(null);
  
  // Inicializar apiRequest una vez que el componente esté montado
  useEffect(() => {
    if (api && typeof api.request === 'function') {
      // Se crea una nueva función wrapper aquí, pero solo cuando 'api' cambia.
      // Si 'api' es estable (misma referencia entre renders), esta función wrapper será estable.
      const stableRequestFn = async (...args) => {
        try {
          // console.log('Llamando a api.request con args:', args); // Comentado para reducir logs
          return await api.request(...args);
        } catch (error) {
          console.error('Error en la petición API:', error);
          throw error;
        }
      };
      setApiRequest(() => stableRequestFn);
    } else {
      setApiRequest(null); // Limpiar si api no está disponible
    }
  }, [api]); // La estabilidad de apiRequest ahora depende de la estabilidad de 'api'
  
  // Efecto para actualizar el ID del plubot cuando cambien los parámetros
  useEffect(() => {
    const id = plubotIdFromRoute || searchParams.get('id') || searchParams.get('plubotId') || null;
    if (id !== plubotIdFromUrl) {
      setPlubotIdFromUrl(id);
      
      // Imprimir los parámetros para depuración
      console.log('[TrainingScreen] Parámetros de ruta:', { plubotIdFromRoute });
      console.log('[TrainingScreen] Parámetros de búsqueda:', Object.fromEntries([...searchParams]));
      console.log('[TrainingScreen] ID del plubot detectado:', id);
      console.log('[TrainingScreen] URL completa:', window.location.href);
    }
  }, [plubotIdFromRoute, searchParams, plubotIdFromUrl]);
  
  const { unlockAchievement } = useGamification();
  
  // Referencia para el formulario de importación/exportación
  const importFormRef = useRef(null);
  
  // Obtener estado y acciones del store de Flow
  const { 
    nodes, 
    edges, 
    selectedNode, 
    setNodes, 
    setEdges, 
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    undo,
    redo,
    canUndo,
    canRedo,
    isUltraMode,
    toggleUltraMode,
    setFlowName,
    reset: resetFlowStore
  } = useFlowStore();
  
  // Obtener estados y acciones del store
  const store = useTrainingStore();
  
  // Extraer solo las propiedades necesarias del store
  const {
    plubotData,
    isDataLoaded,
    isLoading,
    error,
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
    routeAnalysisData,
    nodeSuggestions,
    importData,
    exportFormat,
    byteMessage,
    saveFlowData,
    setPlubotData,
    setIsDataLoaded,
    setIsLoading,
    setShowSimulation,
    toggleSimulation,
    setShowTemplateSelector,
    setShowExportMode,
    setShowConnectionEditor,
    setShowRouteAnalysis,
    setShowVersionHistoryPanel,
    setShowSuggestionsModal,
    setShowEmbedModal,
    setSelectedConnection,
    setConnectionProperties,
    setRouteAnalysisData,
    setNodeSuggestions,
    setImportData,
    setExportFormat,
    setByteMessage,
    clearByteMessage, // Added clearByteMessage
    setError,
    saveFlowData: saveFlowDataFromStore,
    validateAndSaveFlow,
    analyzeFlow,
    generateSuggestions,
    handleImport: handleImportFromStore,
    handleExport: handleExportFromStore,
    resetStore
  } = store || {};
  
  // Verificar que todas las funciones del store estén disponibles
  const isStoreReady = store && 
    typeof setIsLoading === 'function' && 
    typeof setPlubotData === 'function' &&
    typeof setIsDataLoaded === 'function' &&
    typeof setError === 'function' &&
    typeof setByteMessage === 'function';
  
  // Función para manejar errores
  const handleError = useCallback((errorMsg, consoleError = null) => {
    if (consoleError) {
      console.error(errorMsg, consoleError);
    }
    setError(errorMsg);
    setByteMessage(`⚠️ ${errorMsg}`);
  }, [setError, setByteMessage]);

  // Función para guardar el flujo
  const handleSaveFlow = useCallback(async () => {
    if (!plubotData?.id) {
      console.error('No se puede guardar: ID del plubot no disponible');
      setByteMessage('❌ Error: No se pudo guardar - ID del plubot no disponible');
      return;
    }

    console.log('[TrainingScreen] Guardando datos del flujo...');
    setByteMessage('💾 Guardando cambios...');
    
    try {
      // Usar la función del store para guardar los datos
      await saveFlowDataFromStore({
        plubotId: plubotData.id,
        nodes,
        edges,
        name: flowName,
        description: plubotData.description || '',
        tags: plubotData.tags || [],
        isPublic: plubotData.isPublic || false,
      });
      
      setByteMessage('✅ Cambios guardados correctamente');
      setTimeout(() => setByteMessage(''), 3000);
    } catch (error) {
      console.error('Error al guardar los datos del flujo:', error);
      setByteMessage('❌ Error al guardar los cambios');
      setTimeout(() => setByteMessage(''), 5000);
      // Manejar específicamente errores de autenticación
      if (error.response?.status === 401) {
        console.error('[TrainingScreen] Error de autenticación al guardar. Redirigiendo al login...');
        // Limpiar tokens y redirigir al login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        window.location.href = '/auth/login?session_expired=true';
        return;
      }
      
      // Manejar otros errores
      handleError('Error al guardar el flujo. Por favor, inténtalo de nuevo.');
    }
  }, [plubotData, nodes, edges, unlockAchievement, saveFlowDataFromStore, handleError, setByteMessage]);

  // Función debounced para guardar
  const debouncedSave = useDebounce(() => {
    if (plubotData?.id) {
      handleSaveFlow();
    }
  }, 2000);

  // Log antes de definir loadPlubotData
  console.log('<<<<< TrainingScreen: BEFORE useCallback for loadPlubotData >>>>>', {
    store: typeof store,
    isStoreReady: typeof isStoreReady !== 'undefined' ? isStoreReady : 'isStoreReady is UNDEFINED',
    apiRequest: typeof apiRequest,
    plubotIdFromUrl: typeof plubotIdFromUrl !== 'undefined' ? plubotIdFromUrl : 'plubotIdFromUrl is UNDEFINED'
  });

  // Función para cargar los datos del plubot
  const loadPlubotData = useCallback(async (explicitId = null) => {
    // Mover la verificación de !isStoreReady al inicio absoluto
    if (!isStoreReady) {
      console.error('[TrainingScreen] IMMEDIATE CHECK FAILED: Store no listo. isStoreReady:', isStoreReady, 'typeof isStoreReady:', typeof isStoreReady);
      // setByteMessage('❌ Error: No se pudo inicializar la aplicación'); // Comentado temporalmente
      return null;
    }

    console.log('[[‹‹‹ loadPlubotData CALLED ›››]] explicitId:', explicitId, '| plubotIdFromUrl:', plubotIdFromUrl);

    // Protección adicional: esperar a que plubotIdFromUrl esté inicializado
    if (!explicitId && !plubotIdFromUrl) {
      console.log('[TrainingScreen] Esperando a que plubotIdFromUrl esté disponible...');
      return null;
    }
    console.log('[loadPlubotData] Iniciando carga de datos del plubot'); // Line 291
    console.log('[loadPlubotData] explicitId:', explicitId); // Line 292
    console.log('<<<<< CHECKPOINT: Just before accessing plubotIdFromUrl in log. Line 292.5 >>>>>'); // New log
    console.log('[loadPlubotData] plubotIdFromUrl:', plubotIdFromUrl); // Line 293 - current error points here
    console.log('[loadPlubotData] typeof plubotIdFromUrl:', typeof plubotIdFromUrl);

    // La verificación original de isStoreReady ya no es necesaria aquí o se puede ajustar
    // console.log('[TrainingScreen] Antes de verificar isStoreReady. typeof isStoreReady:', typeof isStoreReady, 'Valor:', isStoreReady);
    // console.log('[TrainingScreen] Antes de verificar isStoreReady. typeof setByteMessage:', typeof setByteMessage);
    // if (!isStoreReady) { // Este bloque se vuelve redundante si la comprobación inicial es suficiente
    //   console.error('[TrainingScreen] Error: El store no está listo (verificación redundante)');
    //   setByteMessage('❌ Error: No se pudo inicializar la aplicación');
    //   return null;
    // }
    
    // Verificar que apiRequest esté inicializado
    if (typeof apiRequest !== 'function') {
      console.error('[TrainingScreen] Error: apiRequest no está inicializado');
      setByteMessage('❌ Error: No se pudo inicializar la conexión con el servidor');
      return null;
    }
    
    // Usar el ID explícito si se proporciona, o el de la URL como respaldo
    const plubotId = explicitId || plubotIdFromUrl;
    
    // Verificar que tenemos un ID válido
    if (!plubotId) {
      console.error('[TrainingScreen] Error: No se proporcionó ID del plubot');
      setByteMessage('❌ Error: ID del plubot no encontrado');
      return null;
    }
    
    console.log('[TrainingScreen] Cargando plubot con ID:', plubotId);
    console.log('[TrainingScreen] apiRequest disponible:', typeof apiRequest === 'function' ? 'Sí' : 'No');
    
    if (typeof apiRequest !== 'function') {
      console.error('[TrainingScreen] Error: apiRequest no es una función');
      setByteMessage('❌ Error: No se pudo inicializar la conexión');
      return null;
    }
    
    // Verificar que setIsLoading sea una función
    if (typeof setIsLoading !== 'function') {
      console.error('[TrainingScreen] Error: setIsLoading no es una función');
      setByteMessage('❌ Error: No se pudo inicializar la aplicación');
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // Usar la instancia de axios configurada que ya maneja la autenticación
      console.log('[TrainingScreen] Obteniendo datos del plubot...');
      
      // PASO 1: Primero obtener los datos generales del plubot
      console.log('[TrainingScreen] Llamando a apiRequest...');
      const plubotResponse = await apiRequest('GET', `/api/plubots/${plubotId}`);
      
      if (!plubotResponse) {
        throw new Error('No se recibieron datos del servidor');
      }
      
      console.log('[TrainingScreen] Datos generales del plubot cargados:', plubotResponse);
      
      // Guardar los datos en el store
      setPlubotData(plubotResponse);
      setIsDataLoaded(true);
      
      // Actualizar el nombre del flujo en el store de Flow
      const flowName = plubotResponse.name?.trim() || 'Flujo sin título';
      console.log('[TrainingScreen] Actualizando nombre del flujo en el store:', flowName);
      setFlowName(flowName);
      
      // PASO 2: Cargar los datos del flujo (nodos y aristas)
      try {
        console.log('[TrainingScreen] Cargando datos del flujo...');
        const flowResponse = await apiRequest('GET', `/api/plubots/${plubotId}/flow`);
        
        if (!flowResponse) {
          console.warn('[TrainingScreen] No se recibieron datos del flujo');
          return plubotResponse;
        }
        
        console.log('[TrainingScreen] Datos del flujo cargados:', flowResponse);
        
        // Actualizar nodos y aristas en el store
        if (flowResponse.nodes && Array.isArray(flowResponse.nodes)) {
          setNodes(flowResponse.nodes);
        }
        
        if (flowResponse.edges && Array.isArray(flowResponse.edges)) {
          setEdges(flowResponse.edges);
        }
        
        // Forzar una actualización adicional después de cargar los datos
        setTimeout(() => {
          setFlowName(flowName);
        }, 100);
        
      } catch (flowError) {
        console.error('[TrainingScreen] Error al cargar los datos del flujo:', flowError);
        // No relanzar el error para permitir que continúe con los datos básicos
      }
      
      return plubotResponse;
      
    } catch (error) {
      console.error('[TrainingScreen] Error al cargar el plubot:', error);
      
      // Verificar si es un error de autenticación
      if (error.response?.status === 401) {
        console.error('[TrainingScreen] Error de autenticación. Redirigiendo al login...');
        // Limpiar tokens y redirigir al login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        window.location.href = '/auth/login?session_expired=true';
        return null;
      }
      
      handleError('Error al cargar los datos del plubot. Por favor, inténtalo de nuevo.');
      return null;
      
    } finally {
      setIsLoading(false);
    }
  }, [
    // plubotIdFromUrl, // Eliminado: la función opera sobre el 'id' pasado como argumento
    setNodes, 
    setEdges, 
    setPlubotData, 
    setIsDataLoaded, 
    setFlowName, 
    handleError, 
    setByteMessage, 
    apiRequest, 
    isStoreReady, 
    setIsLoading,
    setError
  ]);

  // Inicializar flujo por defecto
  const initializeDefaultFlow = useCallback(() => {
    const defaultNodes = [
      { 
        id: `start-${uuidv4()}`, 
        type: 'start', 
        position: { x: 100, y: 100 },
        data: { label: 'Inicio' } 
      },
      { 
        id: `end-${uuidv4()}`, 
        type: 'end', 
        position: { x: 400, y: 100 },
        data: { label: 'Fin' } 
      }
    ];
    
    const defaultEdges = [
      { 
        id: `edge-${uuidv4()}`, 
        source: defaultNodes[0].id, 
        target: defaultNodes[1].id, 
        type: 'default' 
      }
    ];
    
    setNodes(defaultNodes);
    setEdges(defaultEdges);
    
    return { nodes: defaultNodes, edges: defaultEdges };
  }, [setNodes, setEdges]);

  // Efecto para cargar datos del plubot
  useEffect(() => {
    if (!isFlowStoreHydrated) {
      console.log('[TrainingScreen] Main useEffect waiting for FlowStore to hydrate...');
      return; // Don't run main logic until store is hydrated
    }

    const initializeAndSave = async () => {
      // Verificar que el store esté listo
      if (!isStoreReady) {
        console.error('[TrainingScreen] El store no está listo, reintentando en 500ms...');
        setTimeout(initializeAndSave, 500);
        return;
      }
      
      // Verificar que apiRequest esté inicializado
      if (typeof apiRequest !== 'function') {
        console.error('[TrainingScreen] apiRequest no está inicializado, reintentando en 500ms...');
        setTimeout(initializeAndSave, 500);
        return;
      }
      
      // Verificar que tengamos un ID de plubot
      if (!plubotIdFromUrl && !creationData) {
        console.error('[TrainingScreen] No hay ID de plubot ni datos de creación');
        return;
      }
      
      // Obtener el ID directamente de los parámetros de URL para mayor seguridad
      const urlParams = new URLSearchParams(window.location.search);
      const idFromUrl = urlParams.get('id');
      const plubotIdParam = urlParams.get('plubotId');
      const effectiveId = plubotIdParam || idFromUrl || plubotIdFromUrl;
      
      console.log('[TrainingScreen] Inicializando con ID:', {
        idFromUrl,
        plubotIdParam,
        plubotIdFromUrl,
        effectiveId,
        urlCompleta: window.location.href,
        isStoreReady,
        apiRequestReady: typeof apiRequest === 'function',
        setIsLoadingReady: typeof setIsLoading === 'function'
      });
      
      try {
        if (effectiveId) {
          console.log('[TrainingScreen] Cargando plubot con ID efectivo:', effectiveId);
          // Usar el ID efectivo para cargar los datos
          const plubotData = await loadPlubotData(effectiveId);
          
          // Asegurarse de que el nombre del flujo se actualice en el store
          if (plubotData && plubotData.name) {
            console.log('[TrainingScreen] Actualizando nombre del flujo en useEffect:', plubotData.name);
            setFlowName(plubotData.name);
          }
        } else if (creationData) {
          // Inicializar con datos de creación
          setPlubotData(creationData);
          
          // Actualizar el nombre del flujo con los datos de creación
          if (creationData && creationData.name) {
            console.log('[TrainingScreen] Actualizando nombre del flujo desde creationData:', creationData.name);
            setFlowName(creationData.name);
          }
          setIsDataLoaded(true);
          
          // Inicializar con nodos por defecto si se está creando un nuevo plubot
          if (!creationData.nodes || creationData.nodes.length === 0) {
            const defaultFlow = initializeDefaultFlow();
            
            // Usar setTimeout para asegurar que los estados se actualicen antes de guardar
            if (creationData.id) {
              // Usar una referencia directa a creationData.id en lugar de plubotData?.id
              // que podría no estar actualizado aún
              setTimeout(() => {
                saveFlowData(creationData.id, defaultFlow.nodes, defaultFlow.edges, creationData.name);
              }, 100);
            }
          } else {
            setNodes(creationData.nodes || []);
            setEdges(creationData.edges || []);
          }
        }
      } catch (error) {
        console.error('[TrainingScreen] Error en initializeAndSave:', error);
        setError('Error al inicializar el flujo');
        setByteMessage('❌ Error al cargar el flujo');
      }
    };

    console.log('<<<<< TrainingScreen: In useEffect, BEFORE calling initializeAndSave. plubotIdFromUrl:', plubotIdFromUrl, 'creationData:', creationData, 'loadPlubotData ready?', typeof loadPlubotData === 'function');
    initializeAndSave();
    
    // Limpieza
    return () => {
      // Limpiar cualquier suscripción o temporizador si es necesario
    };
  }, [
    isFlowStoreHydrated,
    plubotIdFromUrl,
    creationData, 
    loadPlubotData, 
    isStoreReady,
    apiRequest
  ]);

  // Efecto para recuperar aristas del almacenamiento local al cargar - COMENTADO TEMPORALMENTE PARA DETENER BUCLE INFINITO Y ERROR nodes.map
  /*
  useEffect(() => {
    if (!isStoreReady) return;
    
    try {
      console.log('[TrainingScreen] Intentando recuperar aristas del almacenamiento local...');
      const recoveredEdges = recoverEdgesFromLocalStorage(plubotIdFromUrl);
      
      if (recoveredEdges && recoveredEdges.length > 0) {
        console.log(`[TrainingScreen] Se recuperaron ${recoveredEdges.length} aristas del almacenamiento local`);
        
        // Combinar con las aristas existentes, evitando duplicados
        setEdges(currentEdges => {
          const existingEdgeIds = new Set(currentEdges.map(edge => edge.id));
          const newEdges = recoveredEdges.filter(edge => !existingEdgeIds.has(edge.id));
          
          if (newEdges.length > 0) {
            console.log(`[TrainingScreen] Añadiendo ${newEdges.length} aristas recuperadas`);
            return [...currentEdges, ...newEdges];
          }
          
          return currentEdges;
        });
      } else {
        console.log('[TrainingScreen] No se encontraron aristas en el almacenamiento local');
      }
    } catch (error) {
      console.error('[TrainingScreen] Error al recuperar aristas del almacenamiento local:', error);
    }
  }, [plubotIdFromUrl, isStoreReady, setEdges]);
  */
  
  // Efecto para forzar la actualización de aristas después de que los nodos se hayan cargado completamente
  useEffect(() => {
    if (!isStoreReady || !nodes || nodes.length === 0 || !edges || edges.length === 0) return;
    
    // Usar un temporizador para asegurar que los nodos estén completamente renderizados
    const timer = setTimeout(() => {
      console.log('[TrainingScreen] Forzando actualización de aristas después de la carga de nodos');
      forceEdgesUpdate(edges, setEdges);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [nodes, edges, isStoreReady, setEdges]);
  
  // Efecto para manejar la sincronización de aristas
  useEffect(() => {
    if (!isStoreReady || !nodes || !edges) return;
    
    console.log('[TrainingScreen] Sincronizando aristas...', { nodesCount: nodes.length, edgesCount: edges.length });
    
    try {
      // Forzar la actualización de las aristas para asegurar que se muestren correctamente
      const updatedEdges = ensureEdgesAreVisible(edges, nodes);
      
      if (updatedEdges.length !== edges.length) {
        console.log('[TrainingScreen] Actualizando aristas después de sincronización', { 
          original: edges.length, 
          actualizadas: updatedEdges.length 
        });
        setEdges(updatedEdges);
      }
      
      // Validar las aristas para asegurar que tengan los campos requeridos
      const validatedEdges = validateEdges(updatedEdges, nodes);
      
      if (validatedEdges.length !== updatedEdges.length) {
        console.log('[TrainingScreen] Se validaron las aristas', {
          antes: updatedEdges.length,
          despues: validatedEdges.length
        });
        setEdges(validatedEdges);
      }
    } catch (error) {
      console.error('[TrainingScreen] Error al sincronizar aristas:', error);
    }
  }, [nodes, edges, isStoreReady, setEdges]);

  // Trigger save on significant change
  const triggerSaveOnSignificantChange = useCallback(() => {
    debouncedSave();
  }, [debouncedSave]);

  // Handle navigation back
  const handleBack = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Handle import/export
  const handleImport = useCallback(() => {
    try {
      const importedData = JSON.parse(importData || '{}');
      if (importedData.nodes && importedData.edges) {
        setNodes(importedData.nodes);
        setEdges(importedData.edges);
        setShowExportMode(false);
        setByteMessage('📥 Flujo importado correctamente.');
        handleSaveFlow();
      }
    } catch (err) {
      handleError('Error al importar el flujo. Verifica el formato JSON.', err);
    }
  }, [importData, setNodes, setEdges, setShowExportMode, setByteMessage, handleSaveFlow, handleError]);

  const handleExport = useCallback(() => {
    const exportData = {
      nodes: nodes || [],
      edges: edges || [],
      metadata: {
        name: plubotData?.name || 'Plubot sin nombre',
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
    };
    
    setImportData(JSON.stringify(exportData, null, 2));
    setShowExportMode(true);
  }, [nodes, edges, plubotData, setImportData, setShowExportMode]);

  // Handle template selection
  const handleSelectTemplate = useCallback((template) => {
    setNodes(template.nodes);
    setEdges(template.edges);
    setShowTemplateSelector(false);
    setByteMessage('📋 Plantilla seleccionada.');
    handleSaveFlow();
  }, [setNodes, setEdges, setShowTemplateSelector, setByteMessage, handleSaveFlow]);

  // Handle connection editor
  const handleSetShowConnectionEditor = useCallback((show) => {
    setShowConnectionEditor(show);
  }, [setShowConnectionEditor]);

  const handleSetSelectedConnection = useCallback((connection) => {
    setSelectedConnection(connection);
  }, [setSelectedConnection]);

  const handleSaveConnectionChanges = useCallback(() => {
    if (!selectedConnection) return;
    
    setEdges(prevEdges => 
      prevEdges.map(edge => 
        edge.id === selectedConnection.id 
          ? { ...edge, ...connectionProperties } 
          : edge
      )
    );
    
    setShowConnectionEditor(false);
    setByteMessage('🔄 Conexión actualizada.');
    handleSaveFlow();
  }, [selectedConnection, connectionProperties, setEdges, setShowConnectionEditor, setByteMessage, handleSaveFlow]);

  const handleDeleteConnection = useCallback(() => {
    if (!selectedConnection) return;
    
    setEdges(prevEdges => prevEdges.filter(edge => edge.id !== selectedConnection.id));
    setShowConnectionEditor(false);
    setByteMessage('🗑️ Conexión eliminada.');
    handleSaveFlow();
  }, [selectedConnection, setEdges, setShowConnectionEditor, setByteMessage, handleSaveFlow]);

  // Handle route analysis
  const handleShowRouteAnalysis = useCallback(() => {
    // const analysisData = analyzeFlowRoutesAction(nodes, edges); // Comentado temporalmente
    setRouteAnalysisData(analysisData);
    setShowRouteAnalysis(true);
  }, [nodes, edges, /* analyzeFlowRoutesAction, */ setRouteAnalysisData, setShowRouteAnalysis]); // analyzeFlowRoutesAction comentado temporalmente

  // Handle simulation
  const handleSetShowSimulation = useCallback((show) => {
    setShowSimulation(show);
  }, [setShowSimulation]);

  // Handle version history
  const handleSetShowVersionHistoryPanel = useCallback((show) => {
    setShowVersionHistoryPanel(show);
  }, [setShowVersionHistoryPanel]);

  // Handle embed modal
  const handleShowEmbedModal = useCallback(() => {
    setShowEmbedModal(true);
  }, [setShowEmbedModal]);

  // Handle node suggestions
  const handleGenerateSuggestions = useCallback(() => {
    // const suggestions = generateNodeSuggestionsAction(nodes, edges); // Comentado temporalmente
    if (suggestions.length > 0) {
      setNodeSuggestions(suggestions);
      setShowSuggestionsModal(true);
    } else {
      setByteMessage('👀 No se encontraron sugerencias para este flujo.');
    }
  }, [nodes, edges, /* generateNodeSuggestionsAction, */ setNodeSuggestions, setShowSuggestionsModal, setByteMessage]); // generateNodeSuggestionsAction comentado temporalmente

  const handleSelectSuggestion = useCallback((suggestion) => {
    const newNode = {
      id: `${suggestion.type}-${uuidv4()}`,
      type: suggestion.type,
      position: suggestion.position,
      data: suggestion.data,
    };
    
    setNodes(prevNodes => [...prevNodes, newNode]);
    
    if (suggestion.connections) {
      const newEdges = suggestion.connections.map(conn => ({
        id: `edge-${uuidv4()}`,
        source: conn.source,
        target: newNode.id,
        type: conn.type || 'default'
      }));
      
      setEdges(prevEdges => [...prevEdges, ...newEdges]);
    }
    
    setShowSuggestionsModal(false);
    setByteMessage('✨ Sugerencia aplicada.');
    handleSaveFlow();
  }, [setNodes, setEdges, setShowSuggestionsModal, setByteMessage, handleSaveFlow]);

  // Notify Byte assistant
  const notifyByte = useCallback((message) => {
    setByteMessage(message);
    
    // Clear message after 3 seconds if it's not an error
    if (!message.includes('Error') && !message.includes('⚠️')) {
      setTimeout(() => {
        clearByteMessage();
      }, 3000);
    }
  }, [setByteMessage, clearByteMessage]);

  // If loading, show loading screen
  if (isLoading && !isDataLoaded) {
    return (
      <div className="ts-loading-screen">
        <img src={logo} alt="Logo" className="ts-loading-logo" />
        <h2>Cargando editor de flujo...</h2>
        <div className="ts-loading-spinner"></div>
      </div>
    );
  }

  // Modals state for ModalManager
  const modals = {
    showTemplateSelector,
    showExportMode,
    showConnectionEditor,
    showRouteAnalysis,
    showSuggestionsModal,
    showEmbedModal
  };

  // Modal props for ModalManager
  const modalProps = {
    templateSelector: {
      onSelectTemplate: handleSelectTemplate
    },
    importExport: {
      importData,
      exportFormat,
      setImportData,
      setExportFormat,
      onImport: handleImport,
      onExport: handleExport,
      nodes,
      edges
    },
    connectionEditor: {
      connection: selectedConnection,
      properties: connectionProperties,
      setProperties: setConnectionProperties,
      onSave: handleSaveConnectionChanges,
      onDelete: handleDeleteConnection
    },
    routeAnalysis: {
      data: routeAnalysisData,
      nodes
    },
    suggestionsModal: {
      suggestions: nodeSuggestions,
      onSelectSuggestion: handleSelectSuggestion
    },
    embedModal: {
      plubotId: plubotData?.id || null
    }
  };

  return (
    <div className="ts-training-screen">
      <div className="ts-header">
        <div className="ts-header-left">
          <button 
            className="ts-training-action-btn" 
            onClick={handleBack} 
            style={{ marginRight: '1rem', background: 'rgba(0, 40, 80, 0.8)', border: '2px solid #00e0ff' }}
          >
            ← Volver
          </button>
          <h2>Entrenamiento de Plubot: {plubotData?.name || 'Sin nombre'}</h2>
        </div>
        <div className="ts-header-right">
          <button 
            className="ts-training-action-btn" 
            onClick={() => setShowTemplateSelector(true)}
          >
            Plantillas
          </button>
          <button 
            className="ts-training-action-btn" 
            onClick={handleExport}
          >
            Exportar/Importar
          </button>
          <button 
            className="ts-training-action-btn" 
            onClick={handleShowRouteAnalysis}
          >
            Analizar Rutas
          </button>
          <button 
            className="ts-training-action-btn" 
            onClick={handleGenerateSuggestions}
          >
            Sugerencias
          </button>
          <button 
            className="ts-training-action-btn" 
            onClick={() => setShowVersionHistoryPanel(!showVersionHistoryPanel)}
          >
            {showVersionHistoryPanel ? 'Ocultar Historial' : 'Historial'}
          </button>
          <button 
            className="ts-training-action-btn" 
            onClick={toggleSimulation}
          >
            {showSimulation ? 'Cerrar Simulación' : 'Simular'}
          </button>
          <button 
            className="ts-training-action-btn ts-share-button" 
            onClick={handleShowEmbedModal} 
            disabled={!plubotIdFromUrl}
          >
            Compartir y Embeber
          </button>
        </div>
      </div>

      {isDataLoaded && (
        <FlowEditor
          setShowConnectionEditor={handleSetShowConnectionEditor}
          setSelectedConnection={handleSetSelectedConnection}
          setConnectionProperties={setConnectionProperties}
          handleError={handleError}
          showSimulation={showSimulation}
          setShowSimulation={handleSetShowSimulation}
          showVersionHistoryPanel={showVersionHistoryPanel}
          setShowVersionHistoryPanel={setShowVersionHistoryPanel}
          plubotId={plubotData?.id || plubotIdFromUrl}
          name={plubotData?.name || 'Sin nombre'}
          notifyByte={notifyByte}
          saveFlowData={handleSaveFlow}
        />
      )}
      
      <NodePalette />
      
      <ModalManager
        modals={modals}
        modalProps={modalProps}
        onClose={(key) => {
          switch(key) {
            case 'showTemplateSelector': setShowTemplateSelector(false); break;
            case 'showExportMode': setShowExportMode(false); break;
            case 'showConnectionEditor': setShowConnectionEditor(false); break;
            case 'showRouteAnalysis': setShowRouteAnalysis(false); break;
            case 'showSuggestionsModal': setShowSuggestionsModal(false); break;
            case 'showEmbedModal': setShowEmbedModal(false); break;
            default: break;
          }
        }}
      />

      <ByteAssistant simulationMode={showSimulation} /> 
      <StatusBubble message={byteMessage} />
    </div>
  );
};

export default TrainingScreen;
