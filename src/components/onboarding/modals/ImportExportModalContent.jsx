import PropTypes from 'prop-types';

import { ImportSection, ExportSection } from './ImportExportModalSections';

/**
 * Componente de contenido para ImportExportModal
 * Extraído para reducir max-lines-per-function agresivamente
 */
const ImportExportModalContent = ({
  importData,
  setImportData,
  exportFormat,
  setExportFormat,
  confirmationNeeded,
  setConfirmationNeeded,
  importFlow,
  exportFlow,
  importFromFile,
  closeModal,
  onClose,
}) => {
  // Secciones de renderizado - extraídas a componentes separados

  return (
    <div className='ts-import-export-modal'>
      <div className='ts-modal-content'>
        <div className='ts-modal-header'>
          <h3>{importData ? 'Importar Flujo' : 'Exportar Flujo'}</h3>
          <button
            onClick={() => {
              if (closeModal) {
                closeModal('importExportModal');
              } else if (typeof onClose === 'function') {
                onClose();
              }
            }}
            className='ts-close-button'
          >
            <i className='fas fa-times' />
          </button>
        </div>
        <div className='ts-modal-body'>
          {importData ? (
            <ImportSection
              importData={importData}
              setImportData={setImportData}
              importFromFile={importFromFile}
              confirmationNeeded={confirmationNeeded}
              setConfirmationNeeded={setConfirmationNeeded}
              importFlow={importFlow}
            />
          ) : (
            <ExportSection
              exportFormat={exportFormat}
              setExportFormat={setExportFormat}
              exportFlow={exportFlow}
            />
          )}
        </div>
      </div>
    </div>
  );
};

ImportExportModalContent.propTypes = {
  importData: PropTypes.string.isRequired,
  setImportData: PropTypes.func.isRequired,
  exportFormat: PropTypes.string.isRequired,
  setExportFormat: PropTypes.func.isRequired,
  confirmationNeeded: PropTypes.object,
  setConfirmationNeeded: PropTypes.func.isRequired,
  importFlow: PropTypes.func.isRequired,
  exportFlow: PropTypes.func.isRequired,
  importFromFile: PropTypes.func.isRequired,
  closeModal: PropTypes.func,
  onClose: PropTypes.func,
};

export default ImportExportModalContent;
