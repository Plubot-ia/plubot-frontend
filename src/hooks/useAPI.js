import { useState, useCallback } from 'react';

const LOCAL_PLUBOTS_BACKUP_KEY = 'local_plubots_backup';
const USER_PLUBOTS_BACKUP_KEY = 'user_plubots_backup';

// Helper to safely parse JSON from localStorage
const getFromStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
};

// Helper to safely save JSON to localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Silently fail if storage is full or unavailable
  }
};

/**
 * Creates a local backup of a plubot before attempting to sync with the server.
 * @param {object} plubotData - The initial data for the plubot.
 * @returns {object} The plubot data augmented with local backup metadata.
 */
const _createLocalPlubotBackup = (plubotData) => {
  const plubotBackup = {
    ...plubotData,
    _localId: `local_${Date.now()}`,
    _timestamp: new Date().toISOString(),
    _synced: false,
  };

  const localPlubots = getFromStorage(LOCAL_PLUBOTS_BACKUP_KEY);
  localPlubots.push(plubotBackup);
  saveToStorage(LOCAL_PLUBOTS_BACKUP_KEY, localPlubots);

  return plubotBackup;
};

/**
 * Updates the local backup after a successful sync with the server.
 * @param {string} localId - The temporary local ID of the plubot.
 * @param {object} syncedPlubot - The plubot data returned from the server.
 */
const _updateBackupAfterSync = (localId, syncedPlubot) => {
  // Update the main local backup list
  const localPlubots = getFromStorage(LOCAL_PLUBOTS_BACKUP_KEY);
  const updatedLocalPlubots = localPlubots.map((p) =>
    p._localId === localId ? { ...p, id: syncedPlubot.id, _synced: true } : p,
  );
  saveToStorage(LOCAL_PLUBOTS_BACKUP_KEY, updatedLocalPlubots);

  // Update the user's general plubot list
  const userBots = getFromStorage(USER_PLUBOTS_BACKUP_KEY);
  if (!userBots.some((p) => p.id === syncedPlubot.id)) {
    userBots.push(syncedPlubot);
    saveToStorage(USER_PLUBOTS_BACKUP_KEY, userBots);
  }
};

import instance from '../utils/axios-config';

const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const request = useCallback(async (method, url, data, config = {}) => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await instance({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (requestError) {
      const errorMessage =
        requestError.response?.data?.message ?? requestError.message ?? 'Error en la solicitud';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBot = useCallback(
    async (plubotData) => {
      // La lógica de reintentos y modo offline ha sido eliminada para un manejo de errores más directo.
      // El componente que llama ahora es responsable de manejar los errores de la API.
      const response = await request('POST', '/plubots/create', plubotData);

      if (response && response.status === 'success' && response.plubot) {
        // Opcionalmente, aún se podría mantener un backup si se desea, pero la lógica principal es más simple.
        return response; // Se devuelve la respuesta completa para que el componente la procese.
      }

      // Si la respuesta no es exitosa, se lanza un error para que sea capturado por el componente.
      throw new Error(response?.message ?? 'La creación del Plubot falló.');
    },
    [request],
  );

  return { loading, error, request, createBot };
};

export default useAPI;
