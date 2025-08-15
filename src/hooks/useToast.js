import { useState, useCallback } from 'react';

import { createToastElement, applyToastStyles } from './toast-helpers';
import { useToastContainerManager } from './useToastContainerManager';
import { useToastLifecycle } from './useToastLifecycle';

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const containerRef = useToastContainerManager();
  const { closeToast } = useToastLifecycle(setToasts);

  const showToast = useCallback(
    (message, type = 'info', duration = 3000) => {
      if (!containerRef.current) return;

      const id = Date.now().toString();
      const newToast = { id, message, type, duration };

      const toastElement = createToastElement(id, message, () => closeToast(id));
      applyToastStyles(toastElement, type);

      containerRef.current.append(toastElement);

      setTimeout(() => closeToast(id), duration);

      setToasts((previousToasts) => [...previousToasts, newToast]);

      return id;
    },
    [containerRef, closeToast],
  );

  const hideToast = useCallback(
    (id) => {
      closeToast(id);
    },
    [closeToast],
  );

  const hideAllToasts = useCallback(() => {
    // Hacemos una copia porque `closeToast` modificará el estado y, por ende, el array original.
    const allToastIds = toasts.map((toast) => toast.id);
    for (const id of allToastIds) {
      closeToast(id);
    }
  }, [toasts, closeToast]);

  return {
    showToast,
    hideToast,
    hideAllToasts,
    toasts,
  };
};

export default useToast;
