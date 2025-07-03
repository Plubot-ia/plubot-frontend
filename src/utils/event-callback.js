import { useRef, useCallback } from 'react';

export const useEventCallback = (function_, dependencies) => {
  const reference = useRef(() => {
    throw new Error('Cannot call an event handler while rendering.');
  });

  reference.current = function_;

  return useCallback(
    (...arguments_) => reference.current(...arguments_),
    dependencies,
  );
};
