import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useState } from 'react';

import useGoogleSheets from '@/hooks/useGoogleSheets';
import './SheetsViewer.css';

const ConnectionView = ({
  onConnect,
  loading,
  credentialsJson,
  setCredentialsJson,
  showCredentialsInput,
  setShowCredentialsInput,
}) => (
  <div className='connection-section'>
    <motion.button
      className='connect-button'
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setShowCredentialsInput(true)}
    >
      Conectar con Google Sheets
    </motion.button>

    {showCredentialsInput && (
      <motion.div
        className='credentials-input-container'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className='instruction-text'>
          Para conectar con Google Sheets, necesitas crear un proyecto en Google Cloud Platform
        </p>
        <p>
          Para conectar, necesitas las credenciales de una cuenta de servicio de Google Cloud con la
          API de Google Sheets habilitada. Pega el contenido del archivo JSON de credenciales a
          continuación.
        </p>
        <p>
          Si no tienes credenciales, sigue la{' '}
          <a
            href='https://developers.google.com/workspace/guides/create-credentials'
            target='_blank'
            rel='noopener noreferrer'
          >
            guía de Google
          </a>{' '}
          para crearlas.
        </p>
        <textarea
          className='credentials-textarea'
          value={credentialsJson}
          onChange={(event) => setCredentialsJson(event.target.value)}
          placeholder='Pega aquí el JSON de credenciales de tu cuenta de servicio de Google'
          rows={10}
        />
        <div className='credentials-actions'>
          <motion.button
            className='cancel-button'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCredentialsInput(false)}
          >
            Cancelar
          </motion.button>
          <motion.button
            className='connect-button'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onConnect}
            disabled={loading}
          >
            {loading ? 'Conectando...' : 'Conectar'}
          </motion.button>
        </div>
      </motion.div>
    )}
  </div>
);

ConnectionView.propTypes = {
  onConnect: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  credentialsJson: PropTypes.string.isRequired,
  setCredentialsJson: PropTypes.func.isRequired,
  showCredentialsInput: PropTypes.bool.isRequired,
  setShowCredentialsInput: PropTypes.func.isRequired,
};

const dataTablePropertyTypes = {
  sheetsData: PropTypes.shape({
    headers: PropTypes.arrayOf(PropTypes.string),
    raw_data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any)),
  }).isRequired,
};

const DataTable = ({ sheetsData }) => (
  <div className='table-container'>
    <h3>Datos de la hoja de cálculo:</h3>
    <div className='table-wrapper'>
      <table className='sheets-table'>
        <thead>
          <tr>
            {sheetsData.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheetsData.raw_data.slice(1).map((row, rowIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <td key={cellIndex}>{cell}</td>
              ))}
              {sheetsData.headers.length > row.length &&
                Array.from({
                  length: sheetsData.headers.length - row.length,
                })
                  .fill()
                  .map((_, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <td key={`empty-cell-${index}`} />
                  ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

DataTable.propTypes = dataTablePropertyTypes;

const SheetDataView = ({
  spreadsheetId,
  setSpreadsheetId,
  range,
  setRange,
  onFetchData,
  loading,
  uiError,
  error,
  sheetsData,
}) => (
  <div className='sheets-data-section'>
    <div className='fetch-controls'>
      <div className='input-group'>
        <label htmlFor='spreadsheet-id'>ID de la hoja de cálculo:</label>
        <input
          id='spreadsheet-id'
          type='text'
          value={spreadsheetId}
          onChange={(event) => setSpreadsheetId(event.target.value)}
          placeholder='Ej: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
          className='sheet-input'
        />
      </div>
      <div className='input-group'>
        <label htmlFor='range'>Rango (opcional):</label>
        <input
          id='range'
          type='text'
          value={range}
          onChange={(event) => setRange(event.target.value)}
          placeholder='Ej: Hoja1!A1:D10'
          className='sheet-input'
        />
      </div>
      <motion.button
        className='fetch-button'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onFetchData}
        disabled={loading}
      >
        {loading ? 'Cargando datos...' : 'Cargar datos'}
      </motion.button>
    </div>

    {uiError && <div className='error-message'>{uiError}</div>}
    {error && <div className='error-message'>Error: {error}</div>}

    {sheetsData && sheetsData.success && <DataTable sheetsData={sheetsData} />}
  </div>
);

SheetDataView.propTypes = {
  spreadsheetId: PropTypes.string.isRequired,
  setSpreadsheetId: PropTypes.func.isRequired,
  range: PropTypes.string.isRequired,
  setRange: PropTypes.func.isRequired,
  onFetchData: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  uiError: PropTypes.string,
  error: PropTypes.string,
  sheetsData: PropTypes.shape({
    success: PropTypes.bool,
    headers: PropTypes.arrayOf(PropTypes.string),
    raw_data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any)),
  }),
};

SheetDataView.defaultProps = {
  uiError: undefined,
  error: undefined,
  sheetsData: undefined,
};

const SheetsViewer = () => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [range, setRange] = useState('A1:Z100');
  const [isConnected, setIsConnected] = useState(false);
  const [credentialsJson, setCredentialsJson] = useState('');
  const [showCredentialsInput, setShowCredentialsInput] = useState(false);
  const [uiError, setUiError] = useState();

  const { loading, error, sheetsData, connectGoogleSheets, fetchSheetData } = useGoogleSheets();

  const handleConnect = async () => {
    setUiError(undefined);
    try {
      let credentials;
      try {
        credentials = JSON.parse(credentialsJson);
      } catch {
        setUiError('El formato JSON de las credenciales no es válido.');
        return;
      }

      await connectGoogleSheets(credentials);
      setIsConnected(true);
      setShowCredentialsInput(false);
    } catch {
      // The useGoogleSheets hook handles and exposes the error state
    }
  };

  const handleFetchData = async () => {
    setUiError(undefined);
    if (!spreadsheetId) {
      setUiError('Por favor, ingresa el ID de la hoja de cálculo.');
      return;
    }

    try {
      await fetchSheetData(spreadsheetId, range);
    } catch {
      // The useGoogleSheets hook handles and exposes the error state
    }
  };

  return (
    <div className='sheets-viewer-container'>
      <h2 className='section-title'>Integración con Google Sheets</h2>

      {isConnected ? (
        <SheetDataView
          spreadsheetId={spreadsheetId}
          setSpreadsheetId={setSpreadsheetId}
          range={range}
          setRange={setRange}
          onFetchData={handleFetchData}
          loading={loading}
          uiError={uiError}
          error={error}
          sheetsData={sheetsData}
        />
      ) : (
        <ConnectionView
          onConnect={handleConnect}
          loading={loading}
          credentialsJson={credentialsJson}
          setCredentialsJson={setCredentialsJson}
          showCredentialsInput={showCredentialsInput}
          setShowCredentialsInput={setShowCredentialsInput}
        />
      )}
    </div>
  );
};

export default SheetsViewer;
