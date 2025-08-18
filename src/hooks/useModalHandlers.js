export const useModalHandlers = ({
  showVersionHistory: _showVersionHistory,
  showShareModal: _showShareModal,
  showImportExport,
  closeModal: _closeModal,
  plubotId: _plubotId,
}) => {
  // Funciones movidas fuera del scope para evitar recreación
  const openVersionHistory = () => {
    window.dispatchEvent(new CustomEvent('closeOptionsMenu'));
    window.dispatchEvent(new CustomEvent('openVersionHistory'));
  };

  const handleOpenVersionHistory = openVersionHistory;

  const openImportExport = () => {
    window.dispatchEvent(new CustomEvent('closeOptionsMenu'));
    showImportExport();
  };

  const handleOpenImportExport = openImportExport;

  const openSettingsModal = () => {
    window.dispatchEvent(new CustomEvent('closeOptionsMenu'));
    window.dispatchEvent(new CustomEvent('openSettingsModal'));
  };

  const handleOpenSettingsModal = openSettingsModal;

  const openPathAnalysis = () => {
    window.dispatchEvent(new CustomEvent('closeOptionsMenu'));
    window.dispatchEvent(new CustomEvent('openPathAnalysis'));
  };

  const handleOpenPathAnalysis = openPathAnalysis;

  return {
    handleOpenVersionHistory,
    handleOpenImportExport,
    handleOpenSettingsModal,
    handleOpenPathAnalysis,
  };
};
