import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import PropTypes from 'prop-types';

import { useIntersection } from '../../hooks/useIntersection';
import { useWebPSupport } from '../../hooks/useWebPSupport';

import './Loader.css';

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
const LazyImageComponent = ({
  src,
  alt,
  className = '',
  style = {},
  placeholderSrc: placeholderSource,
  placeholderColor = '#f0f0f0',
  threshold = 0.1,
  onLoad,
  onError,
  webpSupport = true,
  ...properties
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSource, setCurrentSource] = useState(
    placeholderSource || undefined,
  );
  const containerRef = useRef(null);

  const supportsWebP = useWebPSupport();
  const isInView = useIntersection(containerRef, { threshold });

  useEffect(() => {
    if (!isInView || !src) return;

    let finalSource = src;
    if (
      webpSupport &&
      supportsWebP &&
      !src.endsWith('.webp') &&
      !src.endsWith('.svg')
    ) {
      finalSource = src.replace(/\.(jpe?g|png)$/i, '.webp');
    }
    setCurrentSource(finalSource);
  }, [isInView, src, supportsWebP, webpSupport]);

  const handleImageLoad = useCallback(
    (event) => {
      setIsLoaded(true);
      if (onLoad) {
        onLoad(event);
      }
    },
    [onLoad],
  );

  const handleImageError = useCallback(
    (event) => {
      if (webpSupport && supportsWebP && currentSource?.endsWith('.webp')) {
        setCurrentSource(src);
      } else if (onError) {
        onError(event);
      }
    },
    [currentSource, onError, src, supportsWebP, webpSupport],
  );

  return (
    <div
      ref={containerRef}
      className={['lazy-image-container', className].filter(Boolean).join(' ')}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: isLoaded ? 'transparent' : placeholderColor,
        ...style,
      }}
      {...properties}
    >
      {currentSource && (
        <img
          src={currentSource}
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
          className='lazy-image-placeholder'
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
          {placeholderSource ? (
            <img
              src={placeholderSource}
              alt={`${alt} placeholder`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div className='lazy-image-loading-indicator spinner' />
          )}
        </div>
      )}
    </div>
  );
};

LazyImageComponent.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  placeholderSrc: PropTypes.string,
  placeholderColor: PropTypes.string,
  threshold: PropTypes.number,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  webpSupport: PropTypes.bool,
};

LazyImageComponent.displayName = 'LazyImage';

const LazyImage = memo(LazyImageComponent);

export default LazyImage;
