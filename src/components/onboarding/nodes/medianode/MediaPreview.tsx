/**
 * @file MediaPreview.tsx
 * @description Componente para renderizar el contenido multimedia
 */

import React, { memo, useState, useCallback } from 'react';

import { COLORS } from './constants';
import type { MediaPreviewProps } from './types';
import { getFileNameFromUrl } from './utils';

/**
 * Componente de preview de imagen
 */
const ImagePreview: React.FC<MediaPreviewProps> = memo(
  ({ url, altText, caption, onLoad, onError }) => {
    const [imageError, setImageError] = useState(false);

    const handleError = useCallback(() => {
      setImageError(true);
      onError?.();
    }, [onError]);

    if (imageError) {
      return (
        <div className='media-error'>
          <span className='error-icon'>🖼️❌</span>
          <p>No se pudo cargar la imagen</p>
          <small>{url}</small>
        </div>
      );
    }

    return (
      <div className='media-image-container'>
        <img
          src={url}
          alt={altText ?? caption ?? 'Imagen'}
          onLoad={onLoad}
          onError={handleError}
          className='media-image'
        />
        {caption && <p className='media-caption'>{caption}</p>}
      </div>
    );
  },
);

ImagePreview.displayName = 'ImagePreview';

/**
 * Componente de preview de video
 */
const VideoPreview: React.FC<MediaPreviewProps> = memo(
  ({ url, caption, config, onLoad, onError }) => {
    const [videoError, setVideoError] = useState(false);
    const videoSettings = config?.videoSettings;

    const handleError = useCallback(() => {
      setVideoError(true);
      onError?.();
    }, [onError]);

    if (videoError) {
      return (
        <div className='media-error'>
          <span className='error-icon'>🎥❌</span>
          <p>No se pudo cargar el video</p>
          <small>{url}</small>
        </div>
      );
    }

    return (
      <div className='media-video-container'>
        <video
          src={url}
          controls={videoSettings?.controls ?? true}
          autoPlay={videoSettings?.autoplay ?? false}
          loop={videoSettings?.loop ?? false}
          muted={videoSettings?.muted ?? false}
          poster={videoSettings?.thumbnail}
          onLoadedData={onLoad}
          onError={handleError}
          className='media-video'
        >
          <track kind='captions' />
        </video>
        {caption && <p className='media-caption'>{caption}</p>}
      </div>
    );
  },
);

VideoPreview.displayName = 'VideoPreview';

/**
 * Componente de preview de audio
 */
const AudioPreview: React.FC<MediaPreviewProps> = memo(
  ({ url, caption, config, onLoad, onError }) => {
    const [audioError, setAudioError] = useState(false);
    const audioSettings = config?.audioSettings;

    const handleError = useCallback(() => {
      setAudioError(true);
      onError?.();
    }, [onError]);

    if (audioError) {
      return (
        <div className='media-error'>
          <span className='error-icon'>🎵❌</span>
          <p>No se pudo cargar el audio</p>
          <small>{url}</small>
        </div>
      );
    }

    return (
      <div className='media-audio-container'>
        <div className='audio-player'>
          <span className='audio-icon'>🎵</span>
          <audio
            src={url}
            controls={audioSettings?.controls ?? true}
            autoPlay={audioSettings?.autoplay ?? false}
            loop={audioSettings?.loop ?? false}
            onLoadedData={onLoad}
            onError={handleError}
            className='media-audio'
          >
            <track kind='captions' />
          </audio>
        </div>
        {caption && <p className='media-caption'>{caption}</p>}
      </div>
    );
  },
);

AudioPreview.displayName = 'AudioPreview';

/**
 * Componente de preview de archivo
 */
const FilePreview: React.FC<MediaPreviewProps> = memo(({ url, caption, config }) => {
  const fileName = config?.fileSettings?.fileName ?? getFileNameFromUrl(url);
  const fileSize = config?.fileSettings?.fileSize;

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [url, fileName]);

  return (
    <div className='media-file-container'>
      <div className='file-info'>
        <span className='file-icon'>📎</span>
        <div className='file-details'>
          <p className='file-name'>{fileName}</p>
          {fileSize && <small className='file-size'>{fileSize}</small>}
        </div>
        <button
          onClick={handleDownload}
          className='download-button'
          style={{
            backgroundColor: COLORS.PRIMARY,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
        >
          Descargar
        </button>
      </div>
      {caption && <p className='media-caption'>{caption}</p>}
    </div>
  );
});

FilePreview.displayName = 'FilePreview';

/**
 * Componente principal de preview
 */
const MediaPreview: React.FC<MediaPreviewProps> = memo((props) => {
  const { type } = props;

  switch (type) {
    case 'image':
      return <ImagePreview {...props} />;
    case 'video':
      return <VideoPreview {...props} />;
    case 'audio':
      return <AudioPreview {...props} />;
    case 'file':
      return <FilePreview {...props} />;
    default:
      return (
        <div className='media-unsupported'>
          <span className='unsupported-icon'>❓</span>
          <p>Tipo de media no soportado: {type}</p>
        </div>
      );
  }
});

MediaPreview.displayName = 'MediaPreview';

export default MediaPreview;
