export const useModalHandlers = (
  _showOptionsModal,
  showVersionHistory,
  showShareModal,
  _openModal,
  closeModal,
  plubotId,
) => {
  const handleOpenVersionHistory = () => {
    // Close options menu if it exists
    globalThis.dispatchEvent(new CustomEvent('close-options-menu'));
    globalThis.dispatchEvent(new CustomEvent('open-version-history'));
  };

  const handleOpenImportExport = () => {
    // Close options menu if it exists
    globalThis.dispatchEvent(new CustomEvent('close-options-menu'));
    globalThis.dispatchEvent(new CustomEvent('open-import-export'));
  };

  const handleOpenSettingsModal = () => {
    // Close options menu if it exists
    globalThis.dispatchEvent(new CustomEvent('close-options-menu'));
    globalThis.dispatchEvent(new CustomEvent('open-settings-modal'));
  };

  const handleOpenPathAnalysis = () => {
    // Close options menu if it exists
    globalThis.dispatchEvent(new CustomEvent('close-options-menu'));
    globalThis.dispatchEvent(new CustomEvent('open-route-analysis'));
  };

  return {
    handleOpenVersionHistory,
    handleOpenImportExport,
    handleOpenSettingsModal,
    handleOpenPathAnalysis,
  };
};
