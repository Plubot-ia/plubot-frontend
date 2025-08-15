import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar el soporte del navegador para imágenes WebP.
 * @returns {boolean} - True si el navegador soporta WebP, de lo contrario false.
 */
export function useWebPSupport() {
  const [supportsWebP, setSupportsWebP] = useState(false);

  useEffect(() => {
    const webPTest = new Image();

    const handleSuccess = () => setSupportsWebP(true);
    const handleFailure = () => setSupportsWebP(false);

    webPTest.addEventListener('load', handleSuccess);
    webPTest.addEventListener('error', handleFailure);

    webPTest.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';

    return () => {
      webPTest.removeEventListener('load', handleSuccess);
      webPTest.removeEventListener('error', handleFailure);
    };
  }, []);

  return supportsWebP;
}
