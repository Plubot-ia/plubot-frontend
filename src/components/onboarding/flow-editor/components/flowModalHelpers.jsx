/**
 * Helper components for modal rendering logic in FlowMain.jsx
 * Extraído para reducir líneas y complejidad del componente principal
 *
 * @author Cascade AI
 * @version 1.0.0
 */

import React from 'react';

import EmbedModal from '@/components/onboarding/modals/EmbedModal';
import ImportExportModal from '@/components/onboarding/modals/ImportExportModal';

/**
 * Genera la función onClose para modales con fallback a globalThis
 *
 * @param {Function} externalCloseModal - Función externa de cierre
 * @param {string} modalType - Tipo de modal ('embedModal' | 'importExportModal')
 * @returns {Function} Función onClose configurada
 */
const createModalCloseHandler = (externalCloseModal, modalType) => {
  return () => {
    if (typeof externalCloseModal === 'function') {
      externalCloseModal(modalType);
    } else {
      globalThis.dispatchEvent(
        new CustomEvent('plubot-close-modal', {
          detail: { modal: modalType },
        }),
      );
    }
  };
};

/**
 * Renderiza el EmbedModal cuando está activo
 *
 * @param {Object} props - Propiedades del modal
 * @param {boolean} props.show - Si debe mostrar el modal
 * @param {Function} props.externalCloseModal - Función de cierre externa
 * @param {string} props.flowId - ID del flujo
 * @param {Object} props.plubotInfo - Información del plubot
 * @returns {JSX.Element|null} EmbedModal o null
 */
export const renderEmbedModal = ({ show, externalCloseModal, flowId, plubotInfo }) => {
  if (!show) return;

  return (
    <div style={{ pointerEvents: 'auto' }}>
      <EmbedModal
        onClose={createModalCloseHandler(externalCloseModal, 'embedModal')}
        plubotId={flowId}
        customization={plubotInfo?.customization}
      />
    </div>
  );
};

/**
 * Renderiza el ImportExportModal cuando está activo
 *
 * @param {Object} props - Propiedades del modal
 * @param {boolean} props.show - Si debe mostrar el modal
 * @param {Function} props.externalCloseModal - Función de cierre externa
 * @param {Function} props.onExport - Función de exportación
 * @param {Function} props.onImport - Función de importación
 * @returns {JSX.Element|null} ImportExportModal o null
 */
export const renderImportExportModal = ({ show, externalCloseModal, onExport, onImport }) => {
  if (!show) return;

  return (
    <div style={{ pointerEvents: 'auto' }}>
      <ImportExportModal
        onClose={createModalCloseHandler(externalCloseModal, 'importExportModal')}
        onExport={onExport}
        onImport={onImport}
      />
    </div>
  );
};
