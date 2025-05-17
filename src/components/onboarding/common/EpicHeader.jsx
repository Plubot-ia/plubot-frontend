import React, { useState, useEffect } from 'react';
import './EpicHeader.css';
import { Save, Share2, Monitor, LayoutTemplate, MoreHorizontal } from 'lucide-react';

// Importar fuente Orbitron para el estilo cyberpunk
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/700.css';

// Importar los stores de Zustand
import useFlowStore from '@/stores/useFlowStore';
import useTrainingStore from '@/stores/useTrainingStore';

const EpicHeader = ({ 
  onCloseModals, // Mantenemos esta prop para cerrar modales y volver al editor
  logoSrc = '/logo.svg',
  flowName: propsFlowName, // Nombre del flujo pasado como prop
  customActions,
  // Props para las acciones de los botones
  openShareModal,
  openSimulateModal,
  openTemplatesModal,
  openSettingsModal,
  saveFlow: propsSaveFlow,
  getVisibleNodeCount
}) => {
  // Obtener datos del store de Flow
  const { 
    flowName: initialFlowName = 'Flujo sin título',
    nodes, 
    edges, 
    lastSaved,
    saveFlow,
    getVisibleEdgeCount,
    forceUpdate
  } = useFlowStore(state => ({
    flowName: state.flowName,
    nodes: state.nodes,
    edges: state.edges,
    lastSaved: state.lastSaved,
    saveFlow: state.saveFlow,
    getVisibleEdgeCount: state.getVisibleEdgeCount,
    forceUpdate: state.forceUpdate
  }));
  
  // Estado local para el nombre del flujo
  // Si se proporciona un flowName como prop, usarlo; de lo contrario, usar el del store
  const [flowName, setFlowName] = React.useState(propsFlowName || initialFlowName);
  
  // Suscribirse a cambios en el store solo si no se proporciona un flowName como prop
  React.useEffect(() => {
    // Si se proporciona un flowName como prop, no suscribirse a cambios en el store
    if (propsFlowName) {
      return;
    }
    
    // Actualizar el estado local cuando cambie el store
    const unsubscribe = useFlowStore.subscribe(
      (state) => ({
        flowName: state.flowName,
        forceUpdate: state.forceUpdate
      }),
      (state) => {
        console.log('[EpicHeader] Cambio detectado en el store:', state);
        if (state.flowName && state.flowName !== flowName) {
          console.log('[EpicHeader] Actualizando nombre del flujo local:', state.flowName);
          setFlowName(state.flowName);
        }
      }
    );
    
    // Si hay un cambio forzado, actualizar el estado local con el estado actual
    if (forceUpdate && !propsFlowName) {
      console.log('[EpicHeader] Forzando actualización');
      const currentState = useFlowStore.getState();
      setFlowName(currentState.flowName);
    }
    
    // Actualizar el estado local con el valor actual del store
    const currentState = useFlowStore.getState();
    if (currentState.flowName && currentState.flowName !== flowName) {
      console.log('[EpicHeader] Inicializando con nombre del flujo:', currentState.flowName);
      setFlowName(currentState.flowName);
    }
    
    return () => {
      console.log('[EpicHeader] Limpiando suscripción');
      unsubscribe();
    };
  }, [flowName]);
  
  // Log para depuración
  React.useEffect(() => {
    console.log('[EpicHeader] Renderizado con nombre del flujo:', flowName);
  }, [flowName, forceUpdate]);
  
  // Obtener funciones del store de Training
  const {
    openShareModal: storeShareModal,
    openSimulateModal: storeSimulateModal,
    openTemplatesModal: storeTemplatesModal,
    openSettingsModal: storeSettingsModal
  } = useTrainingStore(state => ({
    openShareModal: state.openShareModal,
    openSimulateModal: state.openSimulateModal,
    openTemplatesModal: state.openTemplatesModal,
    openSettingsModal: state.openSettingsModal
  }));
  
  // Usar las props si están disponibles, de lo contrario usar las funciones del store
  const finalShareModal = openShareModal || storeShareModal;
  const finalSimulateModal = openSimulateModal || storeSimulateModal;
  const finalTemplatesModal = openTemplatesModal || storeTemplatesModal;
  const finalSettingsModal = openSettingsModal || storeSettingsModal;
  
  // Calcular conteos
  const nodeCount = getVisibleNodeCount ? getVisibleNodeCount() : (nodes?.length || 0);
  const edgeCount = getVisibleEdgeCount ? getVisibleEdgeCount() : (edges?.length || 0);
  
  // Eliminamos las partículas para mejorar el rendimiento
  const [time, setTime] = useState(new Date());
  
  // Actualizar el reloj cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Formatear la fecha de última guardado
  const formatLastSaved = () => {
    if (!lastSaved) return 'Nunca';
    
    const now = new Date();
    const saved = new Date(lastSaved);
    const diffMinutes = Math.floor((now - saved) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    
    const hours = saved.getHours().toString().padStart(2, '0');
    const minutes = saved.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Formatear la hora actual
  const formatTime = () => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <header className="epic-header">
      {/* Partículas y efectos de fondo eliminados para mejorar el rendimiento */}
      
      {/* Contenido del encabezado */}
      <div className="epic-header-left">
        {/* Al hacer clic en el logo o en el nombre, se vuelve al editor y se cierran los modales */}
        <img 
          src={logoSrc} 
          alt="Plubot Logo" 
          className="epic-header-logo"
          loading="eager" // Carga prioritaria
          draggable="false" // Evita arrastrar accidentalmente
          onClick={() => {
            // Emitir evento para cerrar todos los modales y volver al editor
            if (window.closeAllModals) window.closeAllModals();
            // Si hay una función onCloseModals proporcionada, llamarla
            if (onCloseModals) onCloseModals();
          }}
          style={{ cursor: 'pointer' }}
          title="Volver al editor"
        />
        <div 
          onClick={() => {
            // Emitir evento para cerrar todos los modales y volver al editor
            if (window.closeAllModals) window.closeAllModals();
            // Si hay una función onCloseModals proporcionada, llamarla
            if (onCloseModals) onCloseModals();
          }}
          style={{ cursor: 'pointer' }}
          title="Volver al editor"
        >
          <h1 className="epic-header-title">{flowName}</h1>
          <p className="epic-header-subtitle">Diseñador de Flujos Avanzado</p>
        </div>
      </div>
      
      <div className="epic-header-right">
        <div className="epic-header-stats">
          <div className="epic-stat">
            <span className="epic-stat-value">{nodeCount}</span>
            <span className="epic-stat-label">Nodos</span>
          </div>
          
          <div className="epic-stat">
            <span className="epic-stat-value">{edgeCount}</span>
            <span className="epic-stat-label">Conexiones</span>
          </div>
          
          <div className="epic-header-divider"></div>
          
          <div className="epic-stat">
            <span className="epic-stat-value">{formatLastSaved()}</span>
            <span className="epic-stat-label">Guardado</span>
          </div>
          
          <div className="epic-stat">
            <span className="epic-stat-value">{formatTime()}</span>
            <span className="epic-stat-label">Hora</span>
          </div>
        </div>
        
        <div className="epic-header-actions">
          <button 
            className="epic-header-button" 
            onClick={propsSaveFlow || saveFlow}
            title="Guardar flujo"
          >
            <Save size={16} className="epic-header-button-icon" />
            <span>Guardar</span>
          </button>
          
          <button 
            className="epic-header-button"
            onClick={finalShareModal}
            title="Compartir flujo"
            disabled={!finalShareModal}
          >
            <Share2 size={16} className="epic-header-button-icon" />
            <span>Compartir</span>
          </button>
          
          <button 
            className="epic-header-button"
            onClick={finalSimulateModal}
            title="Simular flujo"
            disabled={!finalSimulateModal}
          >
            <Monitor size={16} className="epic-header-button-icon" />
            <span>Simular</span>
          </button>
          
          <button 
            className="epic-header-button"
            onClick={finalTemplatesModal}
            title="Mostrar plantillas"
            disabled={!finalTemplatesModal}
          >
            <LayoutTemplate size={16} className="epic-header-button-icon" />
            <span>Plantillas</span>
          </button>
          
          <button 
            className="epic-header-button"
            onClick={finalSettingsModal}
            title="Más opciones"
            disabled={!finalSettingsModal}
          >
            <MoreHorizontal size={16} className="epic-header-button-icon" />
            <span>Opciones</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default EpicHeader;
