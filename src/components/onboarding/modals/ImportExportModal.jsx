import PropTypes from 'prop-types';
import React, { useState } from 'react';

import './ImportExportModal.css';
// Importar el contexto global
import useByteMessageContext from '../../../hooks/useByteMessageContext';
import useModalContext from '../../../hooks/useModalContext';

import {
  validateImportData,
  validateFlowIntegrity,
  filterValidNodes,
  filterValidEdges,
  createConfirmationData,
  processSuccessfulImport,
} from './ImportExportModal.helpers';
import ImportExportModalContent from './ImportExportModalContent';

// Helper para filtrar elementos válidos - moved to outer scope for better performance
const _filterValidElements = (parsedData) => {
  const validNodes = filterValidNodes(parsedData.nodes);
  const validNodeIds = new Set(validNodes.map((node) => node.id));
  const validEdges = filterValidEdges(parsedData.edges, validNodeIds);
  return { validNodes, validEdges };
};

// Helper para crear datos de exportación
const _createExportData = (nodes, edges, plubotData) => ({
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
});

// Helper para descargar archivo
const _downloadFile = (flowData, plubotData, exportFormat) => {
  const exportString = JSON.stringify(flowData, undefined, 2);
  const blob = new Blob([exportString], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `${plubotData?.name || 'plubot'}_flow_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  return downloadLink.download;
};

const ImportExportModal = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  plubotData,
  // eslint-disable-next-line react/prop-types
  _updatePlubotData,
  exportFormat,
  setExportFormat,
  importData,
  setImportData,
  setExportMode,
  setByteMessage: _propertySetByteMessage, // Renombramos para evitar conflictos
  onClose, // Mantener para retrocompatibilidad
}) => {
  // Usar el contexto global para notificaciones y gestión de modales
  const { showNotification } = useByteMessageContext();
  const { closeModal } = useModalContext();

  const [confirmationNeeded, setConfirmationNeeded] = useState();
  // Función para exportar flujo
  const exportFlow = () => {
    try {
      const flowData = _createExportData(nodes, edges, plubotData);
      const fileName = _downloadFile(flowData, plubotData, exportFormat);
      showNotification(`¡Flujo exportado con éxito! Se guardó como ${fileName}`, 'success');
    } catch {
      showNotification('Error al exportar el flujo. Por favor, intenta de nuevo.', 'error');
    }
  };

  // Helper para validar y procesar datos de importación
  const _validateImportData = () => {
    const validation = validateImportData(importData);
    if (!validation.isValid) {
      showNotification(validation.error, validation.type);
      return;
    }
    const { parsedData } = validation;
    const integrityCheck = validateFlowIntegrity(parsedData);
    if (!integrityCheck.isValid) {
      showNotification(integrityCheck.warning, 'warning');
    }
    return parsedData;
  };
  // Helper para crear callback de confirmación
  const _createConfirmCallback = (validNodes, validEdges) => () => {
    processSuccessfulImport(
      validNodes,
      validEdges,
      setNodes,
      setEdges,
      setImportData,
      showNotification,
    );
    setExportMode(false);
    closeModal('importExportModal');
    setConfirmationNeeded(undefined);
  };

  const importFlow = () => {
    // 1. Validar datos de entrada
    const parsedData = _validateImportData();
    if (!parsedData) return;

    // 2. Filtrar elementos válidos
    const { validNodes, validEdges } = _filterValidElements(parsedData);

    // 3. Crear callback para confirmación
    const onConfirmCallback = _createConfirmCallback(validNodes, validEdges);

    // 4. Verificar si hay elementos inválidos
    if (
      validNodes.length < parsedData.nodes.length ||
      validEdges.length < parsedData.edges.length
    ) {
      const confirmationData = createConfirmationData(
        parsedData,
        validNodes,
        validEdges,
        onConfirmCallback,
      );
      setConfirmationNeeded(confirmationData);
      return;
    }

    // 5. Importación directa (sin elementos inválidos)
    onConfirmCallback();
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
      showNotification(`Error al leer el archivo: ${error.message}`, 'error');
    }
  };

  return (
    <ImportExportModalContent
      importData={importData}
      setImportData={setImportData}
      exportFormat={exportFormat}
      setExportFormat={setExportFormat}
      confirmationNeeded={confirmationNeeded}
      setConfirmationNeeded={setConfirmationNeeded}
      importFlow={importFlow}
      exportFlow={exportFlow}
      importFromFile={importFromFile}
      closeModal={closeModal}
      onClose={onClose}
    />
  );
};

// PropTypes y defaultProps extraídos para reducir líneas del componente
const IMPORT_EXPORT_MODAL_PROP_TYPES = {
  nodes: PropTypes.array.isRequired,
  edges: PropTypes.array.isRequired,
  setNodes: PropTypes.func.isRequired,
  setEdges: PropTypes.func.isRequired,
  plubotData: PropTypes.object.isRequired,
  exportFormat: PropTypes.string.isRequired,
  setExportFormat: PropTypes.func.isRequired,
  importData: PropTypes.string.isRequired,
  setImportData: PropTypes.func.isRequired,
  setExportMode: PropTypes.func.isRequired,
  setByteMessage: PropTypes.func,
  onClose: PropTypes.func,
};

const IMPORT_EXPORT_MODAL_DEFAULT_PROPS = {
  setByteMessage: () => {
    /* no-op */
  },
  onClose: () => {
    /* no-op */
  },
};

ImportExportModal.propTypes = IMPORT_EXPORT_MODAL_PROP_TYPES;
ImportExportModal.defaultProps = IMPORT_EXPORT_MODAL_DEFAULT_PROPS;

export default ImportExportModal;
