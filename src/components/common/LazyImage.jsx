import React, { useState, useEffect, useRef, memo } from 'react';

/**
 * Componente LazyImage que carga imágenes solo cuando están a punto de entrar en el viewport
 *
 * @param {Object} props - Propiedades del componente
 * @param {string} props.src - URL de la imagen
 * @param {string} props.alt - Texto alternativo para la imagen
 * @param {string} props.className - Clases CSS para aplicar a la imagen
 * @param {Object} props.style - Estilos inline para aplicar a la imagen
 * @param {string} props.placeholderSrc - URL de la imagen de placeholder (opcional)
 * @param {string} props.placeholderColor - Color de fondo mientras se carga la imagen (opcional)
 * @param {number} props.threshold - Valor entre 0 y 1 que indica qué porcentaje del elemento debe ser visible para cargar la imagen (opcional, por defecto 0.1)
 * @param {Function} props.onLoad - Callback que se ejecuta cuando la imagen termina de cargar (opcional)
 * @param {Function} props.onError - Callback que se ejecuta si hay un error al cargar la imagen (opcional)
 * @param {boolean} props.webpSupport - Si es true, intentará cargar la versión WebP de la imagen si está disponible (opcional)
 * @returns {JSX.Element} - Componente de imagen con carga perezosa
 */
const LazyImage = memo(({
  src,
  alt,
  className,
  style,
  placeholderSrc,
  placeholderColor = '#f0f0f0',
  threshold = 0.1,
  onLoad,
  onError,
  webpSupport = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [imgSrc, setImgSrc] = useState(placeholderSrc || '');
  const imgRef = useRef(null);

  // Detectar soporte de WebP
  const [supportsWebP, setSupportsWebP] = useState(false);

  useEffect(() => {
    // Comprobar soporte de WebP
    const checkWebPSupport = async () => {
      if (!webpSupport) return;

      try {
        const webPTest = new Image();
        webPTest.onload = () => setSupportsWebP(true);
        webPTest.onerror = () => setSupportsWebP(false);
        webPTest.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
      } catch (e) {
        setSupportsWebP(false);
      }
    };

    checkWebPSupport();
  }, [webpSupport]);

  useEffect(() => {
    // Configurar el Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: '200px', // Precargar imágenes que están a 200px de entrar en viewport
      },
    );

    // Observar el elemento
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    // Limpiar el observer al desmontar
    return () => {
      if (imgRef.current) {
        observer.disconnect();
      }
    };
  }, [threshold]);

  useEffect(() => {
    // Cuando la imagen entra en el viewport, cargar la imagen real
    if (isInView && src) {
      // Si soporta WebP y la imagen original no es WebP, intentar cargar la versión WebP
      let finalSrc = src;
      if (supportsWebP && webpSupport && !src.endsWith('.webp') && !src.endsWith('.svg')) {
        // Intentar cargar versión WebP si existe
        const webpSrc = src.replace(/\.(jpe?g|png)$/i, '.webp');
        finalSrc = webpSrc;
      }

      setImgSrc(finalSrc);
    }
  }, [isInView, src, supportsWebP, webpSupport]);

  // Manejar la carga de la imagen
  const handleImageLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  // Manejar errores de carga
  const handleImageError = (e) => {
    // Si falla la carga de WebP, intentar con la imagen original
    if (supportsWebP && imgSrc.endsWith('.webp') && imgSrc !== src) {
      setImgSrc(src);
    } else if (onError) {
      onError(e);
    }
  };

  return (
    <div
      ref={imgRef}
      className={`lazy-image-container ${className || ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: !isLoaded ? placeholderColor : 'transparent',
        ...style,
      }}
      {...props}
    >
      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
          style={{
            transition: 'opacity 0.3s ease-in-out',
            opacity: isLoaded ? 1 : 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {!isLoaded && (
        <div
          className="lazy-image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: placeholderColor,
          }}
        >
          {placeholderSrc ? (
            <img
              src={placeholderSrc}
              alt={`${alt} placeholder`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              className="lazy-image-loading-indicator"
              style={{
                width: '30px',
                height: '30px',
                border: '3px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '50%',
                borderTop: '3px solid #00e0ff',
                animation: 'spin 1s linear infinite',
              }}
            />
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

export default LazyImage;
