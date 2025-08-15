import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import './NodeHistoryViewer.css';

// Esta función no depende del estado ni de las props del componente,
// por lo que puede definirse fuera para evitar su recreación en cada render.
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Helper function to render history list
const _renderHistoryList = ({
  historyEntries,
  selectedVersion,
  setSelectedVersion,
  handleKeyDown,
  highContrast,
}) => (
  <ul className='history-list' role='listbox'>
    {historyEntries.map((entry) => {
      const isSelected = selectedVersion?.id === entry.id;
      const itemClasses = [
        'history-item',
        isSelected ? 'selected' : '',
        highContrast ? 'high-contrast' : '',
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <li
          key={entry.id}
          className={itemClasses}
          onClick={() => setSelectedVersion(entry)}
          onKeyDown={(event) => handleKeyDown(event, entry)}
          role='option'
          tabIndex={0}
          aria-selected={isSelected}
        >
          <div className='history-item-timestamp'>{formatDate(entry.timestamp)}</div>
          <div className={`history-item-author ${highContrast ? 'high-contrast' : ''}`}>
            {entry.author}
          </div>
          <div className='history-item-content'>
            {entry.content.slice(0, 100)}
            {entry.content.length > 100 ? '...' : ''}
          </div>
        </li>
      );
    })}
  </ul>
);

// Helper function to render control buttons
const _renderControlButtons = ({
  onClose,
  handleRestore,
  selectedVersion,
  highContrast,
  preferReducedMotion,
}) => (
  <div className='history-controls'>
    <button
      type='button'
      onClick={onClose}
      className={`history-button cancel ${highContrast ? 'high-contrast' : ''} ${
        preferReducedMotion ? 'prefer-reduced-motion' : ''
      }`}
    >
      Cancelar
    </button>
    <button
      type='button'
      onClick={handleRestore}
      disabled={!selectedVersion}
      className={`history-button ${highContrast ? 'high-contrast' : ''} ${
        preferReducedMotion ? 'prefer-reduced-motion' : ''
      }`}
    >
      Restaurar Versión
    </button>
  </div>
);

// Helper function to create mock history data
const _createMockHistoryData = () => [
  {
    id: '1',
    timestamp: new Date(Date.now() - 3_600_000).toISOString(),
    content: 'Versión anterior del contenido',
    author: 'Usuario',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 7_200_000).toISOString(),
    content: 'Versión más antigua del contenido',
    author: 'Usuario',
  },
];

const NodeHistoryViewer = ({
  nodeId,
  onRestore,
  onClose,
  preferReducedMotion = false,
  highContrast = false,
}) => {
  const [selectedVersion, setSelectedVersion] = useState();
  const [historyEntries, setHistoryEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Se elimina la llamada a useNodeHistory ya que se usan datos simulados
  // y la variable `getHistory` no se utilizaba, causando un error de lint.

  useEffect(() => {
    if (nodeId) {
      setIsLoading(true);
      const mockHistory = _createMockHistoryData();

      setTimeout(() => {
        setHistoryEntries(mockHistory);
        setIsLoading(false);
      }, 500); // Simular retardo de red
    }
  }, [nodeId]);

  const handleRestore = useCallback(() => {
    if (selectedVersion) {
      onRestore(selectedVersion);
    }
  }, [onRestore, selectedVersion]);

  const handleKeyDown = useCallback((event, entry) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedVersion(entry);
    }
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <p>Cargando historial...</p>;
    }

    if (historyEntries.length === 0) {
      return <p>No hay versiones anteriores disponibles.</p>;
    }

    return (
      <>
        {_renderHistoryList({
          historyEntries,
          selectedVersion,
          setSelectedVersion,
          handleKeyDown,
          highContrast,
        })}

        {_renderControlButtons({
          onClose,
          handleRestore,
          selectedVersion,
          highContrast,
          preferReducedMotion,
        })}
      </>
    );
  };

  const containerClasses = ['node-history-viewer', highContrast ? 'high-contrast' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      <h3>Historial de Versiones</h3>
      {renderContent()}
    </div>
  );
};

NodeHistoryViewer.propTypes = {
  nodeId: PropTypes.string.isRequired,
  onRestore: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  preferReducedMotion: PropTypes.bool,
  highContrast: PropTypes.bool,
};

NodeHistoryViewer.defaultProps = {
  preferReducedMotion: false,
  highContrast: false,
};

NodeHistoryViewer.displayName = 'NodeHistoryViewer';

export default NodeHistoryViewer;
