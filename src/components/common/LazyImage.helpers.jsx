/**
 * Determina la fuente final de la imagen considerando soporte WebP
 */
export const determineFinalSource = (source, webpSupport, supportsWebP) => {
  if (webpSupport && supportsWebP && !source.endsWith('.webp') && !source.endsWith('.svg')) {
    return source.replace(/\.(jpe?g|png)$/i, '.webp');
  }
  return source;
};

/**
 * Renderiza el placeholder de la imagen
 */
export const renderPlaceholder = (placeholderSource, alt, placeholderColor) => (
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
);

/**
 * Crea el manejador de errores de imagen
 */
export const createImageErrorHandler =
  ({ webpSupport, supportsWebP }, { currentSource, source }, { setCurrentSource, onError }) =>
  (event) => {
    if (webpSupport && supportsWebP && currentSource?.endsWith('.webp')) {
      setCurrentSource(source);
    } else if (onError) {
      onError(event);
    }
  };
