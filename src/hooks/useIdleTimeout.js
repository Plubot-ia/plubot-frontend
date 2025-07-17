import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook personalizado para detectar la inactividad del usuario y ejecutar una acción.
 * @param {function} onIdle - La función a llamar cuando el usuario está inactivo.
 * @param {number} idleTimeSeconds - El tiempo de inactividad en segundos antes de llamar a onIdle.
 */
export const useIdleTimeout = (
  onIdle,
  idleTimeSeconds = 900, // 15 minutos por defecto
  enabled = true,
) => {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef(null);

  const handleResetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      onIdle();
    }, idleTimeSeconds * 1000);
  }, [onIdle, idleTimeSeconds]);

  useEffect(() => {
    if (!enabled) {
      // Si está deshabilitado, limpiar el temporizador y no hacer nada.
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];

    const handleActivity = () => {
      handleResetTimer();
    };

    // Iniciar el temporizador al montar el componente
    handleResetTimer();

    // Añadir listeners de eventos
    for (const event of events) {
      globalThis.addEventListener(event, handleActivity, { passive: true });
    }

    // Limpiar al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      for (const event of events) {
        globalThis.removeEventListener(event, handleActivity);
      }
    };
  }, [handleResetTimer, enabled]);

  return isIdle;
};
