import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Trash2 } from 'lucide-react';
import useFlowStore from '@/stores/useFlowStore';
import useTrainingStore from '@/stores/useTrainingStore';
import './ModalStyles.css';
import './VersionHistory.css';

const VersionHistory = ({ onClose }) => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  
  // Obtener nodos y bordes actuales del store
  const { nodes, edges, setNodes, setEdges } = useFlowStore(state => ({
    nodes: state.nodes,
    edges: state.edges,
    setNodes: state.setNodes,
    setEdges: state.setEdges
  }));
  
  const { setByteMessage } = useTrainingStore(state => ({
    setByteMessage: state.setByteMessage
  }));

  // Cargar versiones al montar el componente
  useEffect(() => {
    loadVersions();
  }, []);

  // Función para cargar versiones desde localStorage
  const loadVersions = () => {
    try {
      const savedVersions = localStorage.getItem('plubotVersions');
      if (savedVersions) {
        const parsedVersions = JSON.parse(savedVersions);
        setVersions(parsedVersions);
      } else {
        // Si no hay versiones guardadas, crear una versión inicial
        saveCurrentVersion('Versión inicial');
      }
    } catch (error) {
      console.error('Error al cargar versiones:', error);
      setByteMessage('⚠️ Error al cargar el historial de versiones');
    }
  };

  // Función para guardar la versión actual
  const saveCurrentVersion = (versionName = null) => {
    try {
      const name = versionName || `Versión ${new Date().toLocaleString()}`;
      const newVersion = {
        id: Date.now().toString(),
        name,
        timestamp: new Date().toISOString(),
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges))
      };
      
      const updatedVersions = [newVersion, ...versions];
      setVersions(updatedVersions);
      localStorage.setItem('plubotVersions', JSON.stringify(updatedVersions));
      setByteMessage('💾 Versión guardada correctamente');
    } catch (error) {
      console.error('Error al guardar versión:', error);
      setByteMessage('⚠️ Error al guardar la versión');
    }
  };

  // Función para restaurar una versión
  const restoreVersion = (version) => {
    try {
      if (!version || !version.nodes || !version.edges) {
        setByteMessage('⚠️ Datos de versión incompletos');
        return;
      }
      
      // Guardar la versión actual antes de restaurar
      saveCurrentVersion('Versión antes de restaurar');
      
      // Restaurar nodos y bordes de la versión seleccionada
      setNodes(version.nodes);
      setEdges(version.edges);
      
      setByteMessage('🔄 Versión restaurada correctamente');
      onClose(); // Cerrar el modal después de restaurar
    } catch (error) {
      console.error('Error al restaurar versión:', error);
      setByteMessage('⚠️ Error al restaurar la versión');
    }
  };

  // Función para eliminar una versión
  const deleteVersion = (versionId) => {
    try {
      const updatedVersions = versions.filter(v => v.id !== versionId);
      setVersions(updatedVersions);
      localStorage.setItem('plubotVersions', JSON.stringify(updatedVersions));
      
      if (selectedVersion && selectedVersion.id === versionId) {
        setSelectedVersion(null);
      }
      
      setByteMessage('🗑️ Versión eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar versión:', error);
      setByteMessage('⚠️ Error al eliminar la versión');
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Fecha desconocida';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container version-history-modal">
        <div className="modal-header">
          <h2>Historial de Versiones</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="version-actions">
            <button 
              className="primary-button"
              onClick={() => saveCurrentVersion()}
            >
              <Save size={16} />
              <span>Guardar versión actual</span>
            </button>
          </div>
          
          <div className="versions-list">
            {versions.length === 0 ? (
              <p className="no-versions">No hay versiones guardadas</p>
            ) : (
              versions.map(version => (
                <div 
                  key={version.id} 
                  className={`version-item ${selectedVersion?.id === version.id ? 'selected' : ''}`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="version-info">
                    <h3>{version.name}</h3>
                    <p>Fecha: {formatDate(version.timestamp)}</p>
                    <p>Nodos: {version.nodes.length} | Conexiones: {version.edges.length}</p>
                  </div>
                  <div className="version-actions">
                    <button 
                      className="action-button restore-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreVersion(version);
                      }}
                      title="Restaurar esta versión"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button 
                      className="action-button delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVersion(version.id);
                      }}
                      title="Eliminar esta versión"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Cerrar
          </button>
          {selectedVersion && (
            <button 
              className="primary-button"
              onClick={() => restoreVersion(selectedVersion)}
            >
              <RotateCcw size={16} />
              <span>Restaurar seleccionada</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
