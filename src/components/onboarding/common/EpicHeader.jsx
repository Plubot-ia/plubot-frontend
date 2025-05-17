import React, { useState, useEffect, useRef } from 'react';
import './EpicHeader.css';
import { Save, Share2, Monitor, LayoutTemplate, MoreHorizontal, History, Settings, Database, BarChart2 } from 'lucide-react';
import BackupManager from '@/components/flow/BackupManager';
import PerformanceStats from '@/components/flow/PerformanceStats';

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
  getVisibleNodeCount,
  plubotId // ID del plubot para el BackupManager
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
  // Filtrar nodos que no están eliminados
  const visibleNodes = nodes ? nodes.filter(node => !node.deleted && !node.hidden) : [];
  const visibleEdges = edges ? edges.filter(edge => !edge.deleted && !edge.hidden) : [];
  
  const nodeCount = getVisibleNodeCount ? getVisibleNodeCount() : visibleNodes.length;
  const edgeCount = getVisibleEdgeCount ? getVisibleEdgeCount() : visibleEdges.length;
  
  // Estado para el menú desplegable de opciones
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const optionsMenuRef = useRef(null);
  
  // Eliminamos las partículas para mejorar el rendimiento
  const [time, setTime] = useState(new Date());
  
  // Actualizar el reloj cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Cerrar el menú de opciones al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setOptionsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
            className="epic-header-button save-button" 
            onClick={() => {
              // Usar directamente la función de guardado original para mantener compatibilidad
              if (propsSaveFlow) {
                propsSaveFlow();
              } else if (saveFlow) {
                saveFlow();
              }
            }}
            title="Guardar flujo"
          >
            <Save size={16} className="epic-header-button-icon" />
            <span>Guardar</span>
          </button>
          
          <button 
            className="epic-header-button"
            onClick={() => {
              // Solo emitir el evento para abrir el modal de compartir
              // Esto evita que se abran dos modales al mismo tiempo
              window.dispatchEvent(new CustomEvent('open-embed-modal'));
            }}
            title="Compartir flujo"
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
            onClick={() => {
              // Solo emitir el evento para abrir el modal de plantillas
              // Esto evita que se abran dos modales al mismo tiempo
              window.dispatchEvent(new CustomEvent('open-template-selector'));
            }}
            title="Mostrar plantillas"
          >
            <LayoutTemplate size={16} className="epic-header-button-icon" />
            <span>Plantillas</span>
          </button>
          
          <div className="epic-header-dropdown" ref={optionsMenuRef}>
            <button 
              className={`epic-header-button ${optionsMenuOpen ? 'active' : ''}`}
              onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
              title="Más opciones"
            >
              <MoreHorizontal size={16} className="epic-header-button-icon" />
              <span>Opciones</span>
            </button>
            
            {/* Menú desplegable dentro del mismo contenedor para mantener la referencia */}
            {optionsMenuOpen && (
              <div className="epic-header-dropdown-menu">
                {plubotId && (
                  <div className="epic-header-dropdown-item">
                    <History size={16} className="epic-header-dropdown-icon" />
                    <span>Copias de seguridad</span>
                    <div className="epic-header-dropdown-action">
                      <BackupManager plubotId={plubotId} />
                    </div>
                  </div>
                )}
                
                {/* Historial de versiones */}
                <div 
                  className="epic-header-dropdown-item clickable"
                  onClick={() => {
                    // Cerrar el menú de opciones
                    setOptionsMenuOpen(false);
                    // Emitir evento para abrir el historial de versiones
                    window.dispatchEvent(new CustomEvent('open-version-history'));
                  }}
                >
                  <History size={16} className="epic-header-dropdown-icon" />
                  <span>Historial de versiones</span>
                </div>
                
                {/* Estadísticas de rendimiento */}
                <div className="epic-header-dropdown-item">
                  <BarChart2 size={16} className="epic-header-dropdown-icon" />
                  <span>Estadísticas de rendimiento</span>
                  <div className="epic-header-dropdown-content">
                    <div className="performance-stats-mini">
                      <div className="performance-stats-row">
                        <span className="performance-stats-label">Memoria estimada:</span>
                        <span className="performance-stats-value">{nodes.length * 2 + edges.length * 1.5} KB</span>
                      </div>
                      <div className="performance-stats-row">
                        <span className="performance-stats-label">Tiempo de guardado:</span>
                        <span className="performance-stats-value">{lastSaved ? `${((new Date() - new Date(lastSaved)) / 1000).toFixed(1)} s` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="epic-header-dropdown-item clickable" onClick={() => {
                  setOptionsMenuOpen(false);
                  if (finalSettingsModal) finalSettingsModal();
                }}>
                  <Settings size={16} className="epic-header-dropdown-icon" />
                  <span>Configuración</span>
                </div>
                
                <div className="epic-header-dropdown-item">
                  <BarChart2 size={16} className="epic-header-dropdown-icon" />
                  <span>Rendimiento</span>
                  <div className="epic-header-dropdown-action">
                    <div className="performance-indicator" title="Ver estadísticas de rendimiento">
                      <div className="performance-dot" />
                    </div>
                  </div>
                </div>
                
                <div className="epic-header-dropdown-item">
                  <Database size={16} className="epic-header-dropdown-icon" />
                  <span>Base de datos</span>
                  <div className="epic-header-dropdown-action">
                    <span className="database-status">Conectado</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default EpicHeader;
