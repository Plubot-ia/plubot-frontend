import PropTypes from 'prop-types';
import { useState, useEffect, useRef, memo, useCallback } from 'react';

import { useIntersection } from '../../hooks/useIntersection';
import { useWebPSupport } from '../../hooks/useWebPSupport';

import { determineFinalSource, renderPlaceholder } from './LazyImage.helpers';

import './Loader.css';

/**
 * Construye las clases CSS del contenedor de la imagen lazy
 * @param {string} className - Clases CSS adicionales
 * @returns {string} Clases CSS combinadas
 */
function _getContainerClasses(className) {
  return ['lazy-image-container', className].filter(Boolean).join(' ');
}

/**
 * Construye los estilos del contenedor de la imagen lazy
 * @param {Object} style - Estilos adicionales
 * @param {boolean} isLoaded - Si la imagen ya está cargada
 * @param {string} placeholderColor - Color de placeholder
 * @returns {Object} Estilos del contenedor
 */
function _getContainerStyles(style, isLoaded, placeholderColor) {
  return {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: isLoaded ? 'transparent' : placeholderColor,
    ...style,
  };
}

/**
 * Construye los estilos de la imagen lazy
 * @param {boolean} isLoaded - Si la imagen ya está cargada
 * @returns {Object} Estilos de la imagen
 */
function _getImageStyles(isLoaded) {
  return {
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };
}

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
  const [currentSource, setCurrentSource] = useState(placeholderSource ?? undefined);
  const containerRef = useRef(null);

  const supportsWebP = useWebPSupport();
  const isInView = useIntersection(containerRef, { threshold });

  useEffect(() => {
    if (!isInView || !src) return;
    const finalSource = determineFinalSource(src, webpSupport, supportsWebP);
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
      className={_getContainerClasses(className)}
      style={_getContainerStyles(style, isLoaded, placeholderColor)}
      {...properties}
    >
      {currentSource && (
        <img
          src={currentSource}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
          style={_getImageStyles(isLoaded)}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {!isLoaded && renderPlaceholder(placeholderSource, alt, placeholderColor)}
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
