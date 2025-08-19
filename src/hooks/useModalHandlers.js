// Funciones movidas fuera del hook para cumplir con unicorn/consistent-function-scoping
const openVersionHistory = () => {
  globalThis.dispatchEvent(new CustomEvent('closeOptionsMenu'));
  globalThis.dispatchEvent(new CustomEvent('openVersionHistory'));
};

const openSettingsModal = () => {
  globalThis.dispatchEvent(new CustomEvent('closeOptionsMenu'));
  globalThis.dispatchEvent(new CustomEvent('openSettingsModal'));
};

const openPathAnalysis = () => {
  globalThis.dispatchEvent(new CustomEvent('closeOptionsMenu'));
  globalThis.dispatchEvent(new CustomEvent('openPathAnalysis'));
};

export const useModalHandlers = ({
  showVersionHistory: _showVersionHistory,
  showShareModal: _showShareModal,
  showImportExport,
  closeModal: _closeModal,
  plubotId: _plubotId,
}) => {
  const handleOpenVersionHistory = openVersionHistory;

  const openImportExport = () => {
    globalThis.dispatchEvent(new CustomEvent('closeOptionsMenu'));
    showImportExport();
  };

  const handleOpenImportExport = openImportExport;

  const handleOpenSettingsModal = openSettingsModal;

  const handleOpenPathAnalysis = openPathAnalysis;

  return {
    handleOpenVersionHistory,
    handleOpenImportExport,
    handleOpenSettingsModal,
    handleOpenPathAnalysis,
  };
};
