import React, { lazy, Suspense } from 'react';

// Importar componentes de modal directamente
import useFlowStore from '@/stores/use-flow-store';

import useGlobalContext from '../../hooks/useGlobalContext';
import EmbedModal from '../onboarding/modals/EmbedModal';
import ImportExportModal from '../onboarding/modals/ImportExportModal';
import SyncModal from '../onboarding/modals/SyncModal';

// Cargar componentes pesados con lazy loading
const TemplateSelector = lazy(
  () => import('../onboarding/modals/TemplateSelector'),
);
const SimulationModal = lazy(
  () => import('../onboarding/simulation/SimulationInterface'),
);

// Componente de carga para lazy loading
const LoadingFallback = () => (
  <div className='modal-loading'>
    <div className='modal-loading-spinner' />
    <p>Cargando...</p>
  </div>
);

/**
 * Contenedor de modales que renderiza todos los modales según el estado global
 */
const ModalContainer = () => {
  // Obtener estado y funciones del contexto global
  const { activeModals, closeModal, showNotification, setByteMessage } =
    useGlobalContext();

  // Obtener los nodos y aristas del FlowStore para el SimulationModal
  const { nodes, edges } = useFlowStore((state) => ({
    nodes: state.nodes || [],
    edges: state.edges || [],
  }));

  const activeModalEntry = [...(activeModals?.entries() || [])].find(
    ([, isActive]) => isActive,
  );

  // Si no hay modales activos, no renderizar nada.
  if (!activeModalEntry) {
    return;
  }

  // Función para manejar sincronización (pasada a SyncModal)
  const handleSync = async () => {
    showNotification('Sincronización completada', 'success');
    return true;
  };

  // Añadir CSS directamente para asegurar que se aplica
  const modalStyle = `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .modal-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 30px;
      border-radius: 8px;
    }
    
    .modal-loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 15px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <>
      <style>{modalStyle}</style>

      {/* RENDERIZADO DE MODALES - Solo se renderiza uno a la vez */}
      {(() => {
        const [activeModalName] = activeModalEntry;

        // Renderizar solo el modal activo
        switch (activeModalName) {
          case 'syncModal': {
            return (
              <SyncModal
                onClose={() => closeModal('syncModal')}
                onSync={handleSync}
                project={{ name: 'Mi Proyecto', id: '1' }}
              />
            );
          }

          case 'embedModal': {
            return (
              <EmbedModal
                onClose={() => closeModal('embedModal')}
                plubotId='123'
                plubotName='Mi Plubot'
              />
            );
          }

          case 'importExportModal': {
            return (
              <ImportExportModal
                onClose={() => closeModal('importExportModal')}
                nodes={[]}
                edges={[]}
                setByteMessage={setByteMessage}
                exportFormat='json'
                setExportFormat={() => {
                  /* no-op */
                }}
                importData=''
                setImportData={() => {
                  /* no-op */
                }}
                setExportMode={() => {
                  /* no-op */
                }}
                plubotData={{ name: 'Mi Plubot' }}
                updatePlubotData={() => {
                  /* no-op */
                }}
              />
            );
          }

          case 'templateSelector': {
            return (
              <Suspense fallback={<LoadingFallback />}>
                <TemplateSelector
                  onClose={() => closeModal('templateSelector')}
                  onSelectTemplate={() => {
                    closeModal('templateSelector');
                    showNotification(
                      'Plantilla seleccionada con éxito',
                      'success',
                    );
                  }}
                />
              </Suspense>
            );
          }

          case 'simulationModal': {
            return (
              <Suspense fallback={<LoadingFallback />}>
                <SimulationModal
                  onClose={() => closeModal('simulationModal')}
                  nodes={Array.isArray(nodes) ? nodes : []}
                  edges={Array.isArray(edges) ? edges : []}
                  analyticsTracker={(_event, _data) => {
                    // El seguimiento de análisis se puede implementar aquí en el futuro.
                  }}
                />
              </Suspense>
            );
          }

          default: {
            // No renderizar nada si no hay modal activo
            break;
          }
        }
      })()}
    </>
  );
};

export default ModalContainer;
