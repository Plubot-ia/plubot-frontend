import PropTypes from 'prop-types';
import React from 'react';

import ConnectionEditor from '../flow-editor/components/ConnectionEditor.jsx';
import ImportExportModal from '../flow-editor/components/ImportExportModal.jsx';
import SuggestionsModal from '../flow-editor/components/SuggestionsModal.jsx';
import TemplateSelector from '../flow-editor/components/TemplateSelector.jsx';
import ShareModal from '../modals/ShareModal.jsx';

import Modal from './Modal.jsx';

/**
 * Gestiona y renderiza los modales de la aplicación de forma centralizada.
 * Cada modal se renderiza dentro de un componente genérico `Modal`.
 */
const ModalManager = ({ modals, modalProps, onClose }) => {
  const closeModal = (modalName) => () => onClose(modalName);

  return (
    <>
      {modals.showConnectionEditor && (
        <ConnectionEditor
          connection={modalProps.selectedConnection}
          properties={modalProps.connectionProperties}
          onSave={modalProps.onSaveConnection}
          onClose={closeModal('showConnectionEditor')}
        />
      )}

      <Modal
        title='Sugerencias de Nodos'
        isOpen={modals.showSuggestionsModal}
        onClose={closeModal('showSuggestionsModal')}
      >
        <SuggestionsModal
          suggestions={modalProps.nodeSuggestions}
          onClose={closeModal('showSuggestionsModal')}
          onAddNode={modalProps.onAddSuggestedNode}
        />
      </Modal>

      <Modal
        title='Seleccionar Plantilla'
        isOpen={modals.showTemplateSelector}
        onClose={closeModal('showTemplateSelector')}
      >
        <TemplateSelector
          onSelectTemplate={modalProps.onSelectTemplate}
          onClose={closeModal('showTemplateSelector')}
        />
      </Modal>

      <Modal
        title='Exportar Flujo'
        isOpen={modals.showExportMode}
        onClose={closeModal('showExportMode')}
      >
        <ImportExportModal
          nodes={modalProps.nodes}
          edges={modalProps.edges}
          format={modalProps.exportFormat}
          plubotId={modalProps.plubotId}
          onClose={closeModal('showExportMode')}
        />
      </Modal>

      {modals.showEmbedModal && (
        <ShareModal
          plubotId={modalProps.plubotId}
          plubotName={modalProps.plubotName || 'Mi Plubot'}
          onClose={closeModal('showEmbedModal')}
        />
      )}
    </>
  );
};

ModalManager.propTypes = {
  modals: PropTypes.object.isRequired,
  modalProps: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ModalManager;
