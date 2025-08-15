import { useEffect, useCallback } from 'react';

import { saveEdgesToLocalStorage } from '../utils/edgeRecoveryUtility';
// Importar EliteEdge para asegurar compatibilidad
import '../ui/EliteEdge';

/**
 * Componente EdgePersistenceManager
 *
 * Este componente se encarga de asegurar que las aristas se guarden correctamente
 * en localStorage cuando se modifiquen, proporcionando una capa adicional de
 * persistencia para evitar la pu00e9rdida de aristas.
 */
const EdgePersistenceManager = ({ edges }) => {
  // Obtener el ID del plubot de la URL
  const getPlubotId = useCallback(() => {
    return globalThis.location.search.match(/plubotId=([^&]*)/)?.[1];
  }, []);

  // Guardar aristas en localStorage cuando cambien
  useEffect(() => {
    const plubotId = getPlubotId();
    if (!plubotId || !edges || !Array.isArray(edges) || edges.length === 0) return;

    // Usar un timeout para evitar guardar demasiado frecuentemente
    const timeoutId = setTimeout(() => {
      try {
        // Guardar aristas en localStorage usando la utilidad
        saveEdgesToLocalStorage(plubotId, edges);

        // Emitir evento para notificar que las aristas se han guardado
        document.dispatchEvent(
          new CustomEvent('edges-saved', {
            detail: {
              count: edges.length,
              timestamp: Date.now(),
            },
          }),
        );
      } catch {}
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [edges, getPlubotId]);

  // Escuchar eventos de guardado de flujo para asegurar que las aristas tambiu00e9n se guarden
  useEffect(() => {
    const plubotId = getPlubotId();
    if (!plubotId) return;

    const handleFlowSaved = () => {
      if (edges && Array.isArray(edges) && edges.length > 0) {
        saveEdgesToLocalStorage(plubotId, edges);
      }
    };

    document.addEventListener('flow-saved', handleFlowSaved);

    return () => {
      document.removeEventListener('flow-saved', handleFlowSaved);
    };
  }, [edges, getPlubotId]);

  // Este componente no renderiza nada visible, se usa undefined para cumplir con la regla `no-null`.
};

export default EdgePersistenceManager;
