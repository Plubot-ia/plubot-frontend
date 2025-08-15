import { useCallback } from 'react';

export const useModalLifecycle = (modals, setModals, setModalHistory) => {
  const openModal = useCallback(
    (id, data) => {
      setModals((previousModals) => {
        const modal = previousModals.get(id);
        if (!modal) return previousModals;

        const newModals = new Map(previousModals);
        newModals.set(id, { ...modal, isOpen: true, data });

        if (modal.history) {
          setModalHistory((previousHistory) => [...previousHistory, { id, data }]);
        }

        return newModals;
      });
    },
    [setModals, setModalHistory],
  );

  const closeModal = useCallback(
    async (id, result) => {
      const modal = modals.get(id);
      if (!modal) return;

      if (modal.onBeforeClose) {
        try {
          const shouldClose = await modal.onBeforeClose(result);
          if (shouldClose === false) return;
        } catch {
          // Continue closing despite the error
        }
      }

      setModals((previous) => {
        const newModals = new Map(previous);
        const currentModal = newModals.get(id);
        if (currentModal) {
          newModals.set(id, {
            ...currentModal,
            isOpen: false,
            data: undefined,
          });
        }
        return newModals;
      });

      if (modal.history) {
        setModalHistory((previous) => previous.filter((item) => item.id !== id));
      }
    },
    [modals, setModals, setModalHistory],
  );

  const closeAllModals = useCallback(() => {
    setModals((previousModals) => {
      const newModals = new Map(previousModals);
      let hasChanged = false;
      for (const [modalId, modal] of newModals.entries()) {
        if (modal.isOpen) {
          newModals.set(modalId, { ...modal, isOpen: false, data: undefined });
          hasChanged = true;
        }
      }
      return hasChanged ? newModals : previousModals;
    });

    setModalHistory([]);
  }, [setModals, setModalHistory]);

  return { openModal, closeModal, closeAllModals };
};
