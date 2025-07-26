import { useCallback } from 'react';

const ANIMATION_DURATION = 300;

export const useToastLifecycle = (setToasts) => {
  const removeToastFromState = useCallback(
    (id) => {
      setToasts((previousToasts) => previousToasts.filter((t) => t.id !== id));
    },
    [setToasts],
  );

  const closeToast = useCallback(
    (id) => {
      const toastElement = document.querySelector(`#toast-${id}`);
      if (!toastElement) {
        // Si el elemento no existe, al menos lo eliminamos del estado
        removeToastFromState(id);
        return;
      }

      const handleAnimationEnd = () => {
        if (document.body.contains(toastElement)) {
          toastElement.remove();
        }
        removeToastFromState(id);
      };

      toastElement.style.animation = `toast-out ${ANIMATION_DURATION / 1000}s ease forwards`;
      setTimeout(handleAnimationEnd, ANIMATION_DURATION);
    },
    [removeToastFromState],
  );

  return { closeToast };
};
