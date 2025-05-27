import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useGoogleSheets from '@/hooks/useGoogleSheets';
import './SheetsViewer.css';

const SheetsViewer = ({ plubotId }) => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [range, setRange] = useState('A1:Z100');
  const [isConnected, setIsConnected] = useState(false);
  const [credentialsJson, setCredentialsJson] = useState('');
  const [showCredentialsInput, setShowCredentialsInput] = useState(false);
  
  const { loading, error, sheetsData, connectGoogleSheets, fetchSheetData } = useGoogleSheets();

  const handleConnect = async () => {
    try {
      let credentials;
      try {
        credentials = JSON.parse(credentialsJson);
      } catch (e) {
        alert('El formato JSON de las credenciales no es válido');
        return;
      }
      
      await connectGoogleSheets(credentials);
      setIsConnected(true);
      setShowCredentialsInput(false);
    } catch (err) {
      console.error('Error al conectar:', err);
    }
  };

  const handleFetchData = async () => {
    if (!spreadsheetId) {
      alert('Por favor, ingresa el ID de la hoja de cálculo');
      return;
    }
    
    try {
      await fetchSheetData(spreadsheetId, range);
    } catch (err) {
      console.error('Error al obtener datos:', err);
    }
  };

  return (
    <div className="sheets-viewer-container">
      <h2 className="section-title">Integración con Google Sheets</h2>
      
      {!isConnected ? (
        <div className="connection-section">
          <motion.button
            className="connect-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCredentialsInput(true)}
          >
            Conectar con Google Sheets
          </motion.button>
          
          {showCredentialsInput && (
            <motion.div 
              className="credentials-input-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="instruction-text">
                Para conectar con Google Sheets, necesitas crear un proyecto en Google Cloud Platform 
                y obtener credenciales de cuenta de servicio. Pega el JSON de credenciales a continuación:
              </p>
              <textarea
                className="credentials-textarea"
                value={credentialsJson}
                onChange={(e) => setCredentialsJson(e.target.value)}
                placeholder="Pega aquí el JSON de credenciales de tu cuenta de servicio de Google"
                rows={10}
              />
              <div className="credentials-actions">
                <motion.button
                  className="cancel-button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCredentialsInput(false)}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  className="connect-button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConnect}
                  disabled={loading}
                >
                  {loading ? 'Conectando...' : 'Conectar'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="sheets-data-section">
          <div className="fetch-controls">
            <div className="input-group">
              <label htmlFor="spreadsheet-id">ID de la hoja de cálculo:</label>
              <input
                id="spreadsheet-id"
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="Ej: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="sheet-input"
              />
            </div>
            <div className="input-group">
              <label htmlFor="range">Rango (opcional):</label>
              <input
                id="range"
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="Ej: Hoja1!A1:D10"
                className="sheet-input"
              />
            </div>
            <motion.button
              className="fetch-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFetchData}
              disabled={loading}
            >
              {loading ? 'Cargando datos...' : 'Cargar datos'}
            </motion.button>
          </div>
          
          {error && (
            <div className="error-message">
              Error: {error}
            </div>
          )}
          
          {sheetsData && sheetsData.success && (
            <div className="data-display">
              <h3>Datos de la hoja</h3>
              <div className="sheets-table-container">
                <table className="sheets-table">
                  <thead>
                    <tr>
                      {sheetsData.headers.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheetsData.raw_data.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell}</td>
                        ))}
                        {/* Rellenar celdas vacías si la fila es más corta que los encabezados */}
                        {sheetsData.headers.length > row.length && 
                          Array(sheetsData.headers.length - row.length).fill().map((_, i) => (
                            <td key={`empty-${rowIndex}-${i}`}></td>
                          ))
                        }
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SheetsViewer;