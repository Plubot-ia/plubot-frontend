import PropTypes from 'prop-types';

/**
 * Sección de importación para ImportExportModal
 * Extraída para reducir max-lines-per-function agresivamente
 */
export const ImportSection = ({
  importData,
  setImportData,
  importFromFile,
  confirmationNeeded,
  setConfirmationNeeded,
  importFlow,
}) => (
  <div className='ts-import-section'>
    <div className='ts-import-options'>
      <h4>Importar Flujo</h4>
      <p>Puedes pegar el contenido del flujo directamente o seleccionar un archivo:</p>
      <div className='ts-import-method-selection'>
        <div className='ts-textarea-container'>
          <textarea
            value={importData}
            onChange={(event) => setImportData(event.target.value)}
            placeholder='Pega aquí el contenido del flujo JSON...'
            className='ts-import-textarea'
          />
        </div>
        <div className='ts-file-upload'>
          <label htmlFor='file-input' className='ts-file-label'>
            <i className='fas fa-file-upload' />
            Seleccionar archivo
          </label>
          <input
            id='file-input'
            type='file'
            accept='.json'
            onChange={importFromFile}
            className='ts-file-input'
          />
        </div>
      </div>
    </div>
    <div className='ts-warning-message'>
      <i className='fas fa-exclamation-triangle' />
      <p>
        La importación reemplazará tu flujo actual. Asegúrate de hacer una copia de seguridad si no
        quieres perder tu trabajo actual.
      </p>
    </div>
    <div className='ts-import-actions'>
      <button onClick={() => setImportData('')} className='ts-secondary-button'>
        Cancelar
      </button>
      {confirmationNeeded ? (
        <div className='ts-confirmation-buttons'>
          <p>{confirmationNeeded.message}</p>
          <button onClick={() => setConfirmationNeeded(undefined)} className='ts-secondary-button'>
            Cancelar
          </button>
          <button onClick={confirmationNeeded.onConfirm} className='ts-primary-button'>
            Continuar
          </button>
        </div>
      ) : (
        <button onClick={importFlow} className='ts-primary-button'>
          <i className='fas fa-file-import' /> Importar Flujo
        </button>
      )}
    </div>
  </div>
);

/**
 * Sección de exportación para ImportExportModal
 * Extraída para reducir max-lines-per-function agresivamente
 */
export const ExportSection = ({ exportFormat, setExportFormat, exportFlow }) => (
  <div className='ts-export-section'>
    <div className='ts-export-options'>
      <h4>Opciones de Exportación</h4>
      <div className='ts-format-selection'>
        <label>
          <input
            type='radio'
            name='exportFormat'
            value='json'
            checked={exportFormat === 'json'}
            onChange={() => setExportFormat('json')}
          />
          JSON
        </label>
      </div>
    </div>
    <div className='ts-import-actions'>
      <button onClick={exportFlow} className='ts-primary-button'>
        <i className='fas fa-download' /> Exportar Flujo
      </button>
    </div>
  </div>
);

// PropTypes
ImportSection.propTypes = {
  importData: PropTypes.string.isRequired,
  setImportData: PropTypes.func.isRequired,
  importFromFile: PropTypes.func.isRequired,
  confirmationNeeded: PropTypes.object,
  setConfirmationNeeded: PropTypes.func.isRequired,
  importFlow: PropTypes.func.isRequired,
};

ExportSection.propTypes = {
  exportFormat: PropTypes.string.isRequired,
  setExportFormat: PropTypes.func.isRequired,
  exportFlow: PropTypes.func.isRequired,
};
