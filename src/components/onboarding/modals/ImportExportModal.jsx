import PropTypes from 'prop-types';
import { useState } from 'react';

import './ImportExportModal.css';
// Importar el contexto global
import useByteMessageContext from '../../../hooks/useByteMessageContext';
import useFlowDataContext from '../../../hooks/useFlowDataContext';
import useModalContext from '../../../hooks/useModalContext';

const ImportExportModal = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  plubotData,
  updatePlubotData,
  exportFormat,
  setExportFormat,
  importData,
  setImportData,
  setExportMode,
  setByteMessage: propertySetByteMessage, // Renombramos para evitar conflictos
  onClose, // Mantener para retrocompatibilidad
}) => {
  // Usar el contexto global para notificaciones y gestión de modales
  const { currentFlowData, updateCurrentFlowData } = useFlowDataContext();
  const { showNotification, setByteMessage: globalSetByteMessage } =
    useByteMessageContext();
  const { closeModal } = useModalContext();

  const [confirmationNeeded, setConfirmationNeeded] = useState(null);

  // Función para mostrar mensajes utilizando múltiples métodos disponibles

  const exportFlow = () => {
    try {
      const flowData = {
        metadata: {
          version: '1.0',
          plubotName: plubotData?.name || 'Unnamed Plubot',
          createdAt: new Date().toISOString(),
          nodeCount: nodes.length,
          edgeCount: edges.length,
        },
        nodes: nodes.map((node) => ({
          ...node,
          __rf: undefined,
          dragging: undefined,
          selected: undefined,
        })),
        edges,
      };
      const exportString = JSON.stringify(flowData, undefined, 2);
      const blob = new Blob([exportString], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${plubotData?.name || 'plubot'}_flow_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      showNotification(
        `¡Flujo exportado con éxito! Se guardó como ${downloadLink.download}`,
        'success',
      );
    } catch {
      showNotification(
        'Error al exportar el flujo. Por favor, intenta de nuevo.',
        'error',
      );
    }
  };

  const importFlow = () => {
    try {
      if (!importData.trim()) {
        showNotification(
          'Por favor, ingresa datos de flujo para importar.',
          'warning',
        );
        return;
      }
      const parsedData = JSON.parse(importData);
      if (
        !parsedData.nodes ||
        !Array.isArray(parsedData.nodes) ||
        !parsedData.edges ||
        !Array.isArray(parsedData.edges)
      ) {
        throw new Error(
          'Formato de datos inválido. El flujo debe contener arrays de nodos y aristas.',
        );
      }
      const hasStart = parsedData.nodes.some((node) => node.type === 'start');
      const hasMessage = parsedData.nodes.some(
        (node) => node.type === 'message',
      );
      if (!hasStart || !hasMessage) {
        showNotification(
          'Precaución: El flujo importado puede estar incompleto. Asegúrate de tener nodos de inicio y mensaje.',
          'warning',
        );
      }
      const validNodes = parsedData.nodes.filter(
        (node) =>
          node &&
          node.id &&
          node.type &&
          node.position &&
          typeof node.position.x === 'number' &&
          typeof node.position.y === 'number' &&
          node.data &&
          typeof node.data.label === 'string',
      );
      const validNodeIds = new Set(validNodes.map((node) => node.id));
      const validEdges = parsedData.edges.filter(
        (edge) =>
          edge &&
          edge.id &&
          edge.source &&
          edge.target &&
          validNodeIds.has(edge.source) &&
          validNodeIds.has(edge.target),
      );
      if (
        validNodes.length < parsedData.nodes.length ||
        validEdges.length < parsedData.edges.length
      ) {
        setConfirmationNeeded({
          message: `Advertencia: ${parsedData.nodes.length - validNodes.length} nodos y ${
            parsedData.edges.length - validEdges.length
          } conexiones son inválidos y serán ignorados. ¿Deseas continuar?`,
          onConfirm: () => {
            setNodes(validNodes);
            setEdges(validEdges);
            setExportMode(false);
            setImportData('');
            notifyMessage(
              `¡Flujo importado con éxito! Se cargaron ${validNodes.length} nodos y ${validEdges.length} conexiones.`,
              'success',
            );
            closeModal('importExportModal');
            setConfirmationNeeded(null);
          },
        });
        return;
      }
      setNodes(validNodes);
      setEdges(validEdges);
      setExportMode(false);
      setImportData('');
      showNotification(
        `¡Flujo importado con éxito! Se cargaron ${validNodes.length} nodos y ${validEdges.length} conexiones.`,
        'success',
      );
      showNotification(
        'Flujo importado con éxito. ¡Bienvenido de vuelta!',
        'success',
      );
      closeModal('importExportModal'); // Cierra el modal al importar con éxito
    } catch (error) {
      showNotification(`Error al importar el flujo: ${error.message}`, 'error');
    }
  };

  const importFromFile = async (event) => {
    const [file] = event.target.files;
    if (!file) {
      return;
    }
    try {
      const fileContent = await file.text();
      setImportData(fileContent);
    } catch (error) {
      notifyMessage(`Error al leer el archivo: ${error.message}`, 'error');
    }
  };

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
            ✕
          </button>
        </div>

        <div className='ts-modal-tabs'>
          <button
            className={importData ? '' : 'active'}
            onClick={() => setImportData('')}
          >
            Exportar
          </button>
          <button
            className={importData ? 'active' : ''}
            onClick={() => setImportData(' ')}
          >
            Importar
          </button>
        </div>

        {importData ? (
          <div className='ts-import-section'>
            <div className='ts-import-options'>
              <h4>Importar Flujo</h4>
              <p>
                Puedes pegar el contenido del flujo directamente o seleccionar
                un archivo:
              </p>
              <div className='ts-file-input-container'>
                <input
                  type='file'
                  accept='.json,.txt'
                  onChange={importFromFile}
                  id='flow-file-input'
                />
                <label
                  htmlFor='flow-file-input'
                  className='ts-file-input-label'
                >
                  <i className='fas fa-file-upload' /> Seleccionar archivo
                </label>
              </div>
              <textarea
                placeholder='Pega aquí el contenido del flujo para importar...'
                value={importData}
                onChange={(event) => setImportData(event.target.value)}
                rows={10}
                className='ts-import-textarea'
              />
            </div>
            <div className='ts-warning-message'>
              <i className='fas fa-exclamation-triangle' />
              <p>
                La importación reemplazará tu flujo actual. Asegúrate de hacer
                una copia de seguridad si no quieres perder tu trabajo actual.
              </p>
            </div>
            <div className='ts-import-actions'>
              <button
                onClick={() => setImportData('')}
                className='ts-secondary-button'
              >
                Cancelar
              </button>
              {confirmationNeeded ? (
                <div className='ts-confirmation-buttons'>
                  <p>{confirmationNeeded.message}</p>
                  <button
                    onClick={() => setConfirmationNeeded(null)}
                    className='ts-secondary-button'
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmationNeeded.onConfirm}
                    className='ts-primary-button'
                  >
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
        ) : (
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
        )}
      </div>
    </div>
  );
};

ImportExportModal.propTypes = {
  nodes: PropTypes.array.isRequired,
  edges: PropTypes.array.isRequired,
  setNodes: PropTypes.func.isRequired,
  setEdges: PropTypes.func.isRequired,
  plubotData: PropTypes.object.isRequired,
  updatePlubotData: PropTypes.func.isRequired,
  exportFormat: PropTypes.string.isRequired,
  setExportFormat: PropTypes.func.isRequired,
  importData: PropTypes.string.isRequired,
  setImportData: PropTypes.func.isRequired,
  setExportMode: PropTypes.func.isRequired,
  setByteMessage: PropTypes.func,
  onClose: PropTypes.func,
};

ImportExportModal.defaultProps = {
  setByteMessage: () => {
    /* no-op */
  },
  onClose: () => {
    /* no-op */
  },
};

export default ImportExportModal;
