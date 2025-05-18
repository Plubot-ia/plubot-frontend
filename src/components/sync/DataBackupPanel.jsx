import React, { useState, useRef } from 'react';
import { exportAllPlubots, exportPlubot, importPlubots } from '../../services/exportImportService';
import { useSyncService } from '../../services/syncService';
import useAuthStore from '../../stores/useAuthStore';
import { motion } from 'framer-motion';
import './DataBackupPanel.css';

/**
 * Componente que permite a los usuarios exportar e importar sus plubots
 * como respaldo adicional
 */
const DataBackupPanel = () => {
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuthStore();
  const { syncAllPlubots } = useSyncService();
  
  // Manejar exportación de todos los plubots
  const handleExportAll = async () => {
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      const result = await exportAllPlubots();
      
      if (result.success) {
        setStatus({ type: 'success', message: result.message });
      } else {
        setStatus({ type: 'error', message: result.message || 'Error al exportar plubots' });
      }
    } catch (error) {
      console.error('Error al exportar plubots:', error);
      setStatus({ type: 'error', message: error.message || 'Error inesperado al exportar' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar importación de plubots
  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!fileInputRef.current.files || fileInputRef.current.files.length === 0) {
      setStatus({ type: 'error', message: 'Por favor, selecciona un archivo' });
      return;
    }
    
    const file = fileInputRef.current.files[0];
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      const result = await importPlubots(file);
      
      if (result.success) {
        setStatus({ type: 'success', message: result.message });
        // Sincronizar después de importar
        setTimeout(() => {
          syncAllPlubots();
        }, 1000);
      } else {
        setStatus({ type: 'error', message: result.message || 'Error al importar plubots' });
      }
    } catch (error) {
      console.error('Error al importar plubots:', error);
      setStatus({ type: 'error', message: error.message || 'Error inesperado al importar' });
    } finally {
      setIsLoading(false);
      // Limpiar input
      fileInputRef.current.value = '';
    }
  };
  
  // Manejar clic en el botón de importar
  const handleImportClick = () => {
    fileInputRef.current.click();
  };
  
  return (
    <div className="data-backup-panel">
      <h2>Respaldo de Datos</h2>
      <p className="panel-description">
        Exporta tus plubots como archivo JSON para tener un respaldo adicional o importa plubots previamente exportados.
      </p>
      
      <div className="backup-actions">
        <div className="action-card export-card">
          <h3>Exportar Plubots</h3>
          <p>Descarga todos tus plubots como archivo JSON para guardarlos de forma segura.</p>
          <button 
            className="action-button export-button" 
            onClick={handleExportAll}
            disabled={isLoading || !user || !user.plubots || user.plubots.length === 0}
          >
            {isLoading ? 'Exportando...' : 'Exportar todos los plubots'}
          </button>
          
          {user && user.plubots && user.plubots.length > 0 && (
            <div className="plubot-count">
              {user.plubots.length} {user.plubots.length === 1 ? 'plubot disponible' : 'plubots disponibles'}
            </div>
          )}
        </div>
        
        <div className="action-card import-card">
          <h3>Importar Plubots</h3>
          <p>Restaura plubots desde un archivo JSON previamente exportado.</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json,application/json" 
            style={{ display: 'none' }} 
          />
          <button 
            className="action-button import-button" 
            onClick={handleImportClick}
            disabled={isLoading}
          >
            {isLoading ? 'Importando...' : 'Importar desde archivo'}
          </button>
        </div>
      </div>
      
      {status.message && (
        <motion.div 
          className={`status-message ${status.type}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {status.message}
        </motion.div>
      )}
      
      <div className="backup-tips">
        <h4>Consejos de respaldo</h4>
        <ul>
          <li>Exporta regularmente tus plubots para tener respaldos actualizados.</li>
          <li>Guarda los archivos de respaldo en múltiples ubicaciones (nube, disco externo, etc.).</li>
          <li>Los respaldos incluyen toda la configuración y estructura de tus plubots.</li>
          <li>Al importar plubots existentes, puedes elegir sobrescribir o mantener ambas versiones.</li>
        </ul>
      </div>
    </div>
  );
};

export default DataBackupPanel;
