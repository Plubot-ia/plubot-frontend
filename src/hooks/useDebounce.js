import debounce from 'lodash/debounce';
import { useEffect, useRef } from 'react';

const useDebounce = (callback, delay) => {
  const debouncedCallback = useRef(debounce(callback, delay)).current;

  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return debouncedCallback;
};

export default useDebounce;