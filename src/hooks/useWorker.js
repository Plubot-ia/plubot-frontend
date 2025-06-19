/**
 * @file useWorker.js
 * @description Hook de React para interactuar de forma sencilla con nuestro Web Worker genérico.
 * Abstrae la creación, terminación y comunicación con el worker.
 */

import { useState, useEffect, useRef } from 'react';

const useWorker = (workerPath) => {
  const workerRef = useRef(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(null);
  const promiseRef = useRef(null); // Para resolver la promesa correcta

  useEffect(() => {
    // Crear una nueva instancia del worker al montar el componente
    workerRef.current = new Worker(new URL(workerPath, import.meta.url), { type: 'module' });

    const handleMessage = (e) => {
      const { status, result, error: workerError } = e.data;
      if (promiseRef.current) {
        if (status === 'success') {
          promiseRef.current.resolve(result);
        } else {
          promiseRef.current.reject(workerError);
        }
      }
      setIsBusy(false);
      promiseRef.current = null;
    };

    const handleError = (err) => {
      console.error('Error in Web Worker:', err);
      setError(err);
      if (promiseRef.current) {
        promiseRef.current.reject(err);
      }
      setIsBusy(false);
      promiseRef.current = null;
    };

    workerRef.current.addEventListener('message', handleMessage);
    workerRef.current.addEventListener('error', handleError);

    // Limpieza: terminar el worker al desmontar el componente
    return () => {
      workerRef.current.terminate();
      workerRef.current.removeEventListener('message', handleMessage);
      workerRef.current.removeEventListener('error', handleError);
    };
  }, [workerPath]);

  const execute = (task, args = []) => {
    if (isBusy) {
      return Promise.reject(new Error('Worker is busy.'));
    }

    setIsBusy(true);
    setError(null);

    return new Promise((resolve, reject) => {
      promiseRef.current = { resolve, reject };
      workerRef.current.postMessage({ task, args });
    });
  };

  return { execute, isBusy, error };
};

export default useWorker;
