export const useModalHandlers = ({
  setOptionsMenuOpen,
  showOptionsModal,
  closeAllModals,
  finalSettingsModal,
}) => {
  const handleOpenVersionHistory = () => {
    setOptionsMenuOpen(false);
    globalThis.dispatchEvent(new CustomEvent('open-version-history'));
  };

  const handleOpenImportExport = () => {
    setOptionsMenuOpen(false);
    if (showOptionsModal) showOptionsModal();
  };

  const handleOpenSettingsModal = () => {
    setOptionsMenuOpen(false);
    if (closeAllModals) closeAllModals();
    globalThis.dispatchEvent(new CustomEvent('open-settings-modal'));
    if (typeof finalSettingsModal === 'function') {
      try {
        finalSettingsModal();
      } catch {}
    }
  };

  const handleOpenPathAnalysis = () => {
    setOptionsMenuOpen(false);
    globalThis.dispatchEvent(new CustomEvent('open-route-analysis'));
  };

  return {
    handleOpenVersionHistory,
    handleOpenImportExport,
    handleOpenSettingsModal,
    handleOpenPathAnalysis,
  };
};
