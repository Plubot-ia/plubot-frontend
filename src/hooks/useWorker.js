/**
 * @file useWorker.js
 * @description Hook de React para interactuar de forma sencilla con nuestro Web Worker genérico.
 * Abstrae la creación, terminación y comunicación con el worker.
 */

import { useState, useEffect, useRef } from 'react';

const useWorker = (workerPath) => {
  const workerReference = useRef(undefined);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState();
  const promiseReference = useRef(undefined); // Para resolver la promesa correcta

  useEffect(() => {
    // Crear una nueva instancia del worker al montar el componente
    workerReference.current = new Worker(new URL(workerPath, import.meta.url), {
      type: 'module',
    });

    const handleMessage = (event_) => {
      const { status, result, error: workerError } = event_.data;
      if (promiseReference.current) {
        if (status === 'success') {
          promiseReference.current.resolve(result);
        } else {
          promiseReference.current.reject(workerError);
        }
      }
      setIsBusy(false);
      promiseReference.current = undefined;
    };

    const handleError = (error_) => {
      setError(error_);
      if (promiseReference.current) {
        promiseReference.current.reject(error_);
      }
      setIsBusy(false);
      promiseReference.current = undefined;
    };

    workerReference.current.addEventListener('message', handleMessage);
    workerReference.current.addEventListener('error', handleError);

    // Limpieza: terminar el worker al desmontar el componente
    return () => {
      workerReference.current.removeEventListener('message', handleMessage);
      workerReference.current.removeEventListener('error', handleError);
      workerReference.current.terminate();
    };
  }, [workerPath]);

  const execute = (task, arguments_ = []) => {
    if (isBusy) {
      return Promise.reject(new Error('Worker is busy.'));
    }

    setIsBusy(true);
    setError(undefined);

    return new Promise((resolve, reject) => {
      promiseReference.current = { resolve, reject };
      workerReference.current.postMessage({ task, args: arguments_ });
    });
  };

  return { execute, isBusy, error };
};

export default useWorker;
