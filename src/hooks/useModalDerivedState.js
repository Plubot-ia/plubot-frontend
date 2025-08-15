import { useState, useEffect, useCallback } from 'react';

export const useModalDerivedState = (modals) => {
  const [hasBlockingModal, setHasBlockingModal] = useState(false);

  useEffect(() => {
    const blocking = [...modals.values()].some((modal) => modal.isOpen && modal.blocking);
    setHasBlockingModal(blocking);
  }, [modals]);

  const getModalState = useCallback(
    (id) => {
      return modals.get(id) ?? undefined;
    },
    [modals],
  );

  return { hasBlockingModal, getModalState };
};
