import { useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';

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