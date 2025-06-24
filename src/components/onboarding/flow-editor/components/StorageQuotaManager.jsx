import React, { useEffect } from 'react';

import { cleanupStorage } from '../utils/storage-manager';

/**
 * Componente que gestiona la cuota de almacenamiento local
 * Este componente no renderiza nada visible, solo ejecuta la limpieza de localStorage
 * cuando se monta y periódicamente
 */
const StorageQuotaManager = () => {
  useEffect(() => {
    // Limpiar localStorage al montar el componente
    cleanupStorage(40, 24 * 60 * 60 * 1000); // Mantener máximo 40 entradas, eliminar las más antiguas de 24 horas

    // Configurar limpieza periódica cada 2 minutos
    const intervalId = setInterval(() => {
      cleanupStorage(40, 24 * 60 * 60 * 1000);
    }, 2 * 60 * 1000);

    // Limpiar intervalo al desmontar
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Este componente no renderiza nada visible
  return null;
};

export default StorageQuotaManager;
