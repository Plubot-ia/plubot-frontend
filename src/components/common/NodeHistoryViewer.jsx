import React, { useState, useEffect } from 'react';
import { useNodeHistory } from '@/hooks/legacy-compatibility';

/**
 * Componente para visualizar el historial de cambios de un nodo
 * @param {Object} props - Propiedades del componente
 * @param {string} props.nodeId - ID del nodo cuyo historial se quiere visualizar
 * @param {Function} props.onRestore - Función que se ejecuta al restaurar una versión
 * @param {Function} props.onClose - Función que se ejecuta al cerrar el visor
 */
const NodeHistoryViewer = ({ 
  nodeId, 
  onRestore, 
  onClose,
  preferReducedMotion = false,
  highContrast = false 
}) => {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getHistory } = useNodeHistory();

  useEffect(() => {
    if (nodeId) {
      setIsLoading(true);
      // Obtener el historial del nodo
      const history = getHistory(nodeId);
      
      // En un entorno real, esto sería una llamada asíncrona
      // Por ahora, simulamos algunos datos de historial
      const mockHistory = [
        { 
          id: '1', 
          timestamp: new Date(Date.now() - 3600000).toISOString(), 
          content: 'Versión anterior del contenido', 
          author: 'Usuario' 
        },
        { 
          id: '2', 
          timestamp: new Date(Date.now() - 7200000).toISOString(), 
          content: 'Versión más antigua del contenido', 
          author: 'Usuario' 
        }
      ];
      
      setHistoryEntries(mockHistory);
      setIsLoading(false);
    }
  }, [nodeId, getHistory]);

  const handleRestore = () => {
    if (selectedVersion && onRestore) {
      onRestore(selectedVersion);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const containerStyles = {
    backgroundColor: highContrast ? '#000' : '#fff',
    color: highContrast ? '#fff' : '#333',
    border: `1px solid ${highContrast ? '#fff' : '#d1d5db'}`,
    borderRadius: '8px',
    padding: '16px',
    maxHeight: '400px',
    overflowY: 'auto'
  };

  const buttonStyles = {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    marginRight: '8px',
    cursor: 'pointer',
    transition: preferReducedMotion ? 'none' : 'background-color 0.2s ease',
    backgroundColor: highContrast ? '#fff' : '#3b82f6',
    color: highContrast ? '#000' : '#fff'
  };

  const listItemStyles = {
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: preferReducedMotion ? 'none' : 'background-color 0.2s ease',
    backgroundColor: highContrast ? '#333' : '#f3f4f6'
  };

  const selectedItemStyles = {
    ...listItemStyles,
    backgroundColor: highContrast ? '#555' : '#e5e7eb',
    borderLeft: `4px solid ${highContrast ? '#fff' : '#3b82f6'}`
  };

  return (
    <div style={containerStyles}>
      <h3 style={{ marginTop: 0 }}>Historial de Versiones</h3>
      
      {isLoading ? (
        <p>Cargando historial...</p>
      ) : historyEntries.length === 0 ? (
        <p>No hay versiones anteriores disponibles.</p>
      ) : (
        <>
          <div style={{ marginBottom: '16px' }}>
            {historyEntries.map((entry) => (
              <div 
                key={entry.id}
                style={selectedVersion?.id === entry.id ? selectedItemStyles : listItemStyles}
                onClick={() => setSelectedVersion(entry)}
                role="button"
                tabIndex={0}
                aria-selected={selectedVersion?.id === entry.id}
              >
                <div style={{ fontWeight: 'bold' }}>
                  {formatDate(entry.timestamp)}
                </div>
                <div style={{ fontSize: '0.9em', color: highContrast ? '#ccc' : '#6b7280' }}>
                  {entry.author}
                </div>
                <div style={{ marginTop: '8px' }}>
                  {entry.content.substring(0, 100)}
                  {entry.content.length > 100 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={onClose}
              style={{
                ...buttonStyles,
                backgroundColor: 'transparent',
                border: `1px solid ${highContrast ? '#fff' : '#d1d5db'}`,
                color: highContrast ? '#fff' : '#6b7280'
              }}
            >
              Cancelar
            </button>
            <button 
              onClick={handleRestore}
              disabled={!selectedVersion}
              style={{
                ...buttonStyles,
                opacity: !selectedVersion ? 0.5 : 1
              }}
            >
              Restaurar Versión
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NodeHistoryViewer;
