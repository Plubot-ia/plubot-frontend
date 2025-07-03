import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import './EpicHeader.css';
import {
  Save,
  Share2,
  Monitor,
  LayoutTemplate,
  MoreHorizontal,
  History,
  Settings,
  Database,
  BarChart2,
} from 'lucide-react';

import BackupManager from '@/components/flow/BackupManager';
// Importar el contexto global

// Importar fuente Orbitron para el estilo cyberpunk
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/700.css';

// Importar los stores y selectores de Zustand
import { useSyncService } from '@/services/syncService'; // Importar el servicio de sincronización
import { useFlowMeta, useFlowNodesEdges } from '@/stores/selectors';
import useAuthStore from '@/stores/use-auth-store';
import useTrainingStore from '@/stores/use-training-store';

import useGlobalContext from '../../../hooks/useGlobalContext';

import StatusBubble from './StatusBubble'; // Importar la burbuja de estado

const EpicHeader = ({
  onCloseModals = () => {
    /* no-op */
  },
  logoSrc: logoSource = '/logo.svg',
  flowName: propertiesFlowName = '',
  openShareModal,
  openSimulateModal,
  openTemplatesModal,
  showOptionsModal,
  openSettingsModal,
  saveFlow: propertiesSaveFlow,
  getVisibleNodeCount,
  plubotId,
}) => {
  // Usar el contexto global para los modales y notificaciones
  const { openModal, closeAllModals, showNotification } = useGlobalContext();
  // Obtener datos del store de Flow usando selectores granulares
  const {
    flowName: flowNameFromStore = 'Flujo sin título',
    lastSaved,
    saveFlow, // Acción de guardado del store
  } = useFlowMeta();

  const { isAuthenticated } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
  }));
  const { nodes, edges } = useFlowNodesEdges();

  // Determinar el nombre del flujo a mostrar.
  // Si se proporciona un flowName como prop, usarlo; de lo contrario, usar el del store.
  const displayFlowName = propertiesFlowName || flowNameFromStore;

  // Log para depuración
  React.useEffect(
    () => {
      /* no-op */
    },
    [propertiesFlowName, flowNameFromStore, displayFlowName],
  );

  // Obtener funciones del store de Training
  const {
    openShareModal: storeShareModal,
    openSimulateModal: storeSimulateModal,
    openTemplatesModal: storeTemplatesModal,
    openSettingsModal: storeSettingsModal,
  } = useTrainingStore((state) => ({
    openShareModal: state.openShareModal,
    openSimulateModal: state.openSimulateModal,
    openTemplatesModal: state.openTemplatesModal,
    openSettingsModal: state.openSettingsModal,
  }));

  // Usar las props si están disponibles, de lo contrario usar las funciones del store
  const finalShareModal = openShareModal || storeShareModal;
  const finalSimulateModal = openSimulateModal || storeSimulateModal;
  const finalTemplatesModal = openTemplatesModal || storeTemplatesModal;
  const finalSettingsModal = openSettingsModal || storeSettingsModal;

  // Calcular conteos con comprobación robusta de tipos para evitar errores
  // Asegurarse de que nodes y edges son arrays antes de usar filter
  // Calcular nodos visibles con verificación de tipo para evitar errores
  // nodes debe ser siempre un array y se debe verificar cada propiedad para evitar errores
  const visibleNodes = Array.isArray(nodes)
    ? nodes.filter(
        (node) =>
          node && node.position && node.type && !node.hidden && !node.deleted,
      ) // Filtrar nodos eliminados
    : [];
  // Calcular conexiones visibles con verificación de tipo robusta
  const connectionCount = Array.isArray(edges) ? edges.length : 0;

  const nodeCount = getVisibleNodeCount
    ? getVisibleNodeCount()
    : visibleNodes.length;
  const edgeCount = connectionCount;

  // Estado para el menú desplegable de opciones
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const optionsMenuReference = useRef(null);

  // Estados para el botón de guardado
  const [isSaving, setSavingIndicator] = useState(false);
  const [saveStatus, setSaveStatus] = useState(); // 'success', 'error', undefined
  const [notification, setNotification] = useState(); // Estado para el mensaje de StatusBubble como objeto { text, id }
  const saveTimeoutReference = useRef(null);

  // Eliminamos las partículas para mejorar el rendimiento
  const [time, setTime] = useState(new Date());

  // Efecto para actualizar el reloj cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Efecto para limpiar el estado de guardado después de un tiempo
  useEffect(() => {
    if (saveStatus) {
      saveTimeoutReference.current = setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }

    return () => {
      if (saveTimeoutReference.current) {
        clearTimeout(saveTimeoutReference.current);
      }
    };
  }, [saveStatus]);

  // Cerrar el menú de opciones al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        optionsMenuReference.current &&
        !optionsMenuReference.current.contains(event.target)
      ) {
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

  // Obtener la función de sincronización
  const { syncAllPlubots } = useSyncService();

  // Función para validar que el flujo tenga los nodos obligatorios
  const validateRequiredNodes = (nodes) => {
    if (!nodes || !Array.isArray(nodes)) {
      return { valid: false, message: 'No hay nodos para validar' };
    }

    // Verificar que exista al menos un nodo de inicio
    const startNodes = nodes.filter(
      (node) =>
        node &&
        node.type &&
        (node.type.toLowerCase().includes('start') ||
          node.type === 'startNode'),
    );

    if (startNodes.length === 0) {
      return {
        valid: false,
        message: 'El flujo debe tener al menos un nodo de inicio',
      };
    }

    // Verificar que exista al menos un nodo de fin
    const endNodes = nodes.filter(
      (node) =>
        node &&
        node.type &&
        (node.type.toLowerCase().includes('end') || node.type === 'endNode'),
    );

    if (endNodes.length === 0) {
      return {
        valid: false,
        message: 'El flujo debe tener al menos un nodo de fin',
      };
    }

    return { valid: true };
  };

  // Función para manejar el guardado del flujo integrado con sincronización
  const handleSaveFlow = async () => {
    // Si ya está guardando, no hacer nada
    if (isSaving) return;

    try {
      // Activar indicador de guardado
      setSavingIndicator(true);
      setSaveStatus();

      // Validar que el flujo tenga los nodos requeridos antes de guardar
      const nodesArray = Array.isArray(nodes) ? nodes : [];
      const validation = validateRequiredNodes(nodesArray);

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Usar la función de guardado proporcionada como prop o la del store
      const saveFunction = propertiesSaveFlow || saveFlow;

      if (!saveFunction) {
        throw new Error('No se encontró función de guardado');
      }

      // Ejecutar la función de guardado
      await saveFunction();

      // Sincronizar con el servidor si es posible
      try {
        if (typeof syncAllPlubots === 'function') {
          await syncAllPlubots();
        }
      } catch {
        // No consideramos esto un error fatal, ya que el guardado local funcionó
      }

      // Indicar éxito

      setSaveStatus('success');

      // Mensaje para el usuario usando StatusBubble
      setNotification({
        text: '✅ Flujo guardado exitosamente',
        id: Date.now(),
      });
    } catch (error) {
      // Manejo de errores

      setSaveStatus('error');

      // Mensaje de error para el usuario usando StatusBubble
      setNotification({
        text: `❌ Error al guardar flujo: ${error.message || 'Error desconocido'}`,
        id: Date.now(),
      });
    } finally {
      // Desactivar indicador de guardado
      setSavingIndicator(false);
    }
  };

  // Si el usuario no está autenticado, renderizar un encabezado mínimo o nulo
  if (!isAuthenticated) {
    return (
      <header className='epic-header epic-header-unauthenticated'>
        <div className='epic-header-left'>
          <img src={logoSource} alt='Logo' className='epic-header-logo' />
        </div>
        <div className='epic-header-center'>
          <span className='epic-header-flow-name'>Cargando...</span>
        </div>
        <div className='epic-header-right' />
      </header>
    );
  }

  return (
    <>
      <StatusBubble notification={notification} />
      <header className='epic-header'>
        {/* Partículas y efectos de fondo eliminados para mejorar el rendimiento */}

        {/* Contenido del encabezado */}
        <div className='epic-header-left'>
          {/* Al hacer clic en el logo o en el nombre, se vuelve al editor y se cierran los modales */}
          <img
            src={logoSource}
            alt='Plubot Logo'
            className='epic-header-logo'
            loading='eager' // Carga prioritaria
            draggable='false' // Evita arrastrar accidentalmente
            onClick={() => {
              // Emitir evento para cerrar todos los modales y volver al editor
              if (closeAllModals) closeAllModals();
              // Si hay una función onCloseModals proporcionada, llamarla
              if (onCloseModals) onCloseModals();
            }}
            style={{ cursor: 'pointer' }}
            title='Volver al editor'
          />
          <div
            onClick={() => {
              // Emitir evento para cerrar todos los modales y volver al editor
              if (closeAllModals) closeAllModals();
              // Si hay una función onCloseModals proporcionada, llamarla
              if (onCloseModals) onCloseModals();
            }}
            style={{ cursor: 'pointer' }}
            title='Volver al editor'
          >
            <h1 className='epic-header-title'>{displayFlowName}</h1>
            <p className='epic-header-subtitle'>Diseñador de Flujos Avanzado</p>
          </div>
        </div>

        <div className='epic-header-right'>
          <div className='epic-header-stats'>
            <div className='epic-stat'>
              <span className='epic-stat-value'>{nodeCount}</span>
              <span className='epic-stat-label'>Nodos</span>
            </div>

            <div className='epic-stat'>
              <span className='epic-stat-value'>{edgeCount}</span>
              <span className='epic-stat-label'>Conexiones</span>
            </div>

            <div className='epic-header-divider' />

            <div className='epic-stat'>
              <span className='epic-stat-value'>{formatLastSaved()}</span>
              <span className='epic-stat-label'>Guardado</span>
            </div>

            <div className='epic-stat'>
              <span className='epic-stat-value'>{formatTime()}</span>
              <span className='epic-stat-label'>Hora</span>
            </div>
          </div>
        </div>

        <div className='epic-header-actions'>
          <button
            className={`epic-header-button save-button ${isSaving ? 'saving' : ''} ${saveStatus ? `status-${saveStatus}` : ''}`}
            onClick={handleSaveFlow}
            title='Guardar flujo'
            disabled={isSaving}
          >
            <Save size={16} className='epic-header-button-icon' />
            <span>Guardar</span>
          </button>

          <button
            className='epic-header-button'
            onClick={() => {
              try {
                // Abrir directamente el modal sin notificaciones innecesarias
                openModal('templateSelector');

                // Respaldos en caso de fallos (sin notificaciones)
                if (typeof finalTemplatesModal === 'function') {
                  try {
                    finalTemplatesModal();
                  } catch {}
                }

                // Disparar eventos globales como último respaldo
                try {
                  globalThis.dispatchEvent(
                    new CustomEvent('open-templates-modal'),
                  );
                  globalThis.dispatchEvent(
                    new CustomEvent('plubot-open-modal', {
                      detail: {
                        modal: 'templateSelector',
                        source: 'EpicHeader',
                        timestamp: Date.now(),
                      },
                    }),
                  );
                } catch {}
              } catch {
                // Solo mostrar notificación en caso de error
                showNotification('Error al abrir modal de plantillas', 'error');
              }
            }}
            title='Plantillas'
          >
            <LayoutTemplate size={16} className='epic-header-button-icon' />
            <span>Plantillas</span>
          </button>

          <button
            className='epic-header-button'
            onClick={() => {
              try {
                // Abrir directamente el modal sin notificaciones innecesarias
                openModal('simulationModal');

                // Respaldos en caso de fallos (sin notificaciones)
                if (typeof finalSimulateModal === 'function') {
                  try {
                    finalSimulateModal();
                  } catch {}
                }

                // Disparar eventos globales como último respaldo
                try {
                  globalThis.dispatchEvent(
                    new CustomEvent('open-simulate-modal'),
                  );
                  globalThis.dispatchEvent(
                    new CustomEvent('plubot-open-modal', {
                      detail: {
                        modal: 'simulationModal',
                        source: 'EpicHeader',
                        timestamp: Date.now(),
                      },
                    }),
                  );
                } catch {}
              } catch {
                // Solo mostrar notificación en caso de error
                showNotification('Error al iniciar simulación', 'error');
              }
            }}
            title='Simular flujo'
          >
            <Monitor size={16} className='epic-header-button-icon' />
            <span>Simular</span>
          </button>

          <button
            className='epic-header-button epic-header-button--share'
            onClick={() => {
              try {
                // Abrir directamente el modal sin notificaciones innecesarias
                openModal('embedModal');

                // Respaldos en caso de fallos (sin notificaciones)
                if (typeof finalShareModal === 'function') {
                  try {
                    finalShareModal();
                  } catch {}
                }

                // Disparar eventos globales como último respaldo
                try {
                  globalThis.dispatchEvent(new CustomEvent('open-embed-modal'));
                  globalThis.dispatchEvent(
                    new CustomEvent('plubot-open-modal', {
                      detail: {
                        modal: 'embedModal',
                        source: 'EpicHeader',
                        timestamp: Date.now(),
                      },
                    }),
                  );
                } catch {}
              } catch {
                // Solo mostrar notificación en caso de error
                showNotification('Error al abrir modal de compartir', 'error');
              }
            }}
            title='Compartir flujo'
          >
            <Share2 size={16} className='epic-header-button-icon' />
            <span>Compartir</span>
          </button>

          <div className='epic-header-dropdown' ref={optionsMenuReference}>
            <button
              className='epic-header-button'
              onClick={() => setOptionsMenuOpen((previous) => !previous)}
              title='Más opciones'
            >
              <MoreHorizontal size={16} className='epic-header-button-icon' />
              <span>Más</span>
            </button>

            {/* Menú desplegable dentro del mismo contenedor para mantener la referencia */}
            {optionsMenuOpen && (
              <div className='epic-header-dropdown-menu'>
                {plubotId && (
                  <div className='epic-header-dropdown-item'>
                    <History size={16} className='epic-header-dropdown-icon' />
                    <span>Copias de seguridad</span>
                    <div className='epic-header-dropdown-action'>
                      <BackupManager plubotId={plubotId} />
                    </div>
                  </div>
                )}

                {/* Historial de versiones */}
                <div
                  className='epic-header-dropdown-item clickable'
                  onClick={() => {
                    // Cerrar el menú de opciones
                    setOptionsMenuOpen(false);
                    // Emitir evento para abrir el historial de versiones
                    globalThis.dispatchEvent(
                      new CustomEvent('open-version-history'),
                    );
                  }}
                >
                  <History size={16} className='epic-header-dropdown-icon' />
                  <span>Historial de versiones</span>
                </div>

                {/* Importar / Exportar */}
                <div
                  className='epic-header-dropdown-item clickable'
                  onClick={() => {
                    setOptionsMenuOpen(false);
                    if (showOptionsModal) {
                      showOptionsModal();
                    }
                  }}
                >
                  <Database size={16} className='epic-header-dropdown-icon' />
                  <span>Importar / Exportar</span>
                </div>

                {/* Estadísticas de rendimiento */}
                <div className='epic-header-dropdown-item'>
                  <BarChart2 size={16} className='epic-header-dropdown-icon' />
                  <span>Estadísticas de rendimiento</span>
                  <div className='epic-header-dropdown-content'>
                    <div className='performance-stats-mini'>
                      <div className='performance-stats-row'>
                        <span className='performance-stats-label'>
                          Memoria estimada:
                        </span>
                        <span className='performance-stats-value'>
                          {nodes.length * 2 + edges.length * 1.5} KB
                        </span>
                      </div>
                      <div className='performance-stats-row'>
                        <span className='performance-stats-label'>
                          Tiempo de guardado:
                        </span>
                        <span className='performance-stats-value'>
                          {lastSaved
                            ? `${((Date.now() - new Date(lastSaved)) / 1000).toFixed(1)} s`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className='epic-header-dropdown-item clickable'
                  onClick={() => {
                    setOptionsMenuOpen(false);

                    // Cerrar todos los modales antes de abrir uno nuevo
                    if (closeAllModals) closeAllModals();

                    // Emitir evento para abrir el modal de configuración
                    globalThis.dispatchEvent(
                      new CustomEvent('open-settings-modal'),
                    );

                    if (typeof finalSettingsModal === 'function') {
                      try {
                        finalSettingsModal();
                      } catch {}
                    }
                  }}
                >
                  <Settings size={16} className='epic-header-dropdown-icon' />
                  <span>Configuración del flujo</span>
                </div>

                <div
                  className='epic-header-dropdown-item clickable'
                  onClick={() => {
                    setOptionsMenuOpen(false);

                    // Emitir evento para abrir el modal de análisis de ruta
                    globalThis.dispatchEvent(
                      new CustomEvent('open-route-analysis'),
                    );
                  }}
                >
                  <Database size={16} className='epic-header-dropdown-icon' />
                  <span>Análisis de rutas</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

EpicHeader.propTypes = {
  onCloseModals: PropTypes.func,
  logoSrc: PropTypes.string,
  flowName: PropTypes.string,
  openShareModal: PropTypes.func,
  openSimulateModal: PropTypes.func,
  openTemplatesModal: PropTypes.func,
  showOptionsModal: PropTypes.func,
  openSettingsModal: PropTypes.func,
  saveFlow: PropTypes.func,
  getVisibleNodeCount: PropTypes.func,
  plubotId: PropTypes.string,
};



export default React.memo(EpicHeader);
