import { lazy, Suspense } from 'react';

// Importar componentes de modal directamente
import useFlowStore from '@/stores/use-flow-store';

import useByteMessageContext from '../../hooks/useByteMessageContext';
import useModalContext from '../../hooks/useModalContext';
import EmbedModal from '../onboarding/modals/EmbedModal';
import ImportExportModal from '../onboarding/modals/ImportExportModal';
import SyncModal from '../onboarding/modals/SyncModal';

// Cargar componentes pesados con lazy loading
const TemplateSelector = lazy(() => import('../onboarding/modals/TemplateSelector'));
const SimulationModal = lazy(() => import('../onboarding/simulation/SimulationInterface'));

// Componente de carga para lazy loading
const LoadingFallback = () => (
  <div className='modal-loading'>
    <div className='modal-loading-spinner' />
    <p>Cargando...</p>
  </div>
);

// Helper functions para renderizado de modales específicos
const _renderSyncModal = (closeModal, handleSync) => (
  <SyncModal
    onClose={() => closeModal('syncModal')}
    onSync={handleSync}
    project={{ name: 'Mi Proyecto', id: '1' }}
  />
);

const _renderEmbedModal = (closeModal, plubotId) => (
  <EmbedModal
    onClose={() => closeModal('embedModal')}
    plubotId={plubotId || '1'}
    plubotName='Mi Plubot'
  />
);

const _renderImportExportModal = (closeModal, setByteMessage) => (
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

const _renderTemplateSelector = (closeModal, showNotification) => (
  <Suspense fallback={<LoadingFallback />}>
    <TemplateSelector
      onClose={() => closeModal('templateSelector')}
      onSelectTemplate={() => {
        closeModal('templateSelector');
        showNotification('Plantilla seleccionada con éxito', 'success');
      }}
    />
  </Suspense>
);

const _renderSimulationModal = (closeModal, nodes, edges) => (
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

// Estilos CSS para modales extraídos como constante
const MODAL_STYLES = `
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

/**
 * Contenedor de modales que renderiza todos los modales según el estado global
 */
const ModalContainer = () => {
  // Obtener estado y funciones del contexto global
  const { activeModals, closeModal } = useModalContext();
  const { showNotification, setByteMessage } = useByteMessageContext();

  // Obtener los nodos, aristas y plubotId del FlowStore
  const { nodes, edges, plubotId } = useFlowStore((state) => ({
    nodes: state.nodes ?? [],
    edges: state.edges ?? [],
    plubotId: state.plubotId,
  }));

  const activeModalEntry = [...(activeModals?.entries() ?? [])].find(([, isActive]) => isActive);

  // Si no hay modales activos, no renderizar nada.
  if (!activeModalEntry) {
    return;
  }

  // Función para manejar sincronización (pasada a SyncModal)
  const handleSync = async () => {
    showNotification('Sincronización completada', 'success');
    return true;
  };

  // Usar estilos CSS extraídos

  return (
    <>
      <style>{MODAL_STYLES}</style>

      {/* RENDERIZADO DE MODALES - Solo se renderiza uno a la vez */}
      {(() => {
        const [activeModalName] = activeModalEntry;

        // Renderizar solo el modal activo usando helpers
        switch (activeModalName) {
          case 'syncModal': {
            return _renderSyncModal(closeModal, handleSync);
          }

          case 'embedModal': {
            return _renderEmbedModal(closeModal, plubotId);
          }

          case 'importExportModal': {
            return _renderImportExportModal(closeModal, setByteMessage);
          }

          case 'templateSelector': {
            return _renderTemplateSelector(closeModal, showNotification);
          }

          case 'simulationModal': {
            return _renderSimulationModal(closeModal, nodes, edges);
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
