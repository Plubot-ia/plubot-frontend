/**
 * @file MediaPreview.tsx
 * @description Ultra-optimized media preview component with Apple-inspired design
 * @version 2.0.0 - Complete optimization with memoization and premium aesthetics
 */

import {
  Film,
  Music,
  FileImage,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Maximize2,
} from 'lucide-react';
import React, { memo, useState, useCallback, useMemo, useRef } from 'react';

// import { COLORS } from './constants'; // No se usa
import type { MediaPreviewProps } from './types';
import './MediaPreview.css';

// Mapeo de colores por tipo de media
const MEDIA_COLORS = {
  image: '#667eea',
  video: '#764ba2',
  audio: '#ec4899',
  file: '#f59e0b',
};

/**
 * MediaPreview principal con renderizado optimizado por tipo
 */
const MediaPreview: React.FC<MediaPreviewProps> = memo(
  ({ type, url, caption, altText, config }) => {
    // Referencias para elementos multimedia
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Estado mínimo optimizado
    const [imageError, setImageError] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(config?.videoSettings?.muted ?? false);
    const [isLoading, setIsLoading] = useState(true);

    // Colores memoizados por tipo
    const mediaColor = useMemo(() => {
      switch (type) {
        case 'image':
          return MEDIA_COLORS.image;
        case 'video':
          return MEDIA_COLORS.video;
        case 'audio':
          return MEDIA_COLORS.audio;
        case 'file':
          return MEDIA_COLORS.file;
        default:
          return MEDIA_COLORS.file;
      }
    }, [type]);

    // Callbacks optimizados
    const handleImageLoad = useCallback(() => {
      setIsLoading(false);
    }, []);

    const handleImageError = useCallback(() => {
      setImageError(true);
      setIsLoading(false);
    }, []);

    const handleVideoLoad = useCallback(() => {
      setIsLoading(false);
    }, []);

    const handleVideoError = useCallback(() => {
      setVideoError(true);
      setIsLoading(false);
    }, []);

    const handleAudioLoad = useCallback(() => {
      setIsLoading(false);
    }, []);

    const handleAudioError = useCallback(() => {
      setAudioError(true);
      setIsLoading(false);
    }, []);

    const handlePlayPause = useCallback(() => {
      setIsPlaying((prev) => !prev);
    }, []);

    const handleToggleMute = useCallback(() => {
      setIsMuted((prev) => !prev);
    }, []);

    // Render vacío optimizado
    if (!url) {
      return (
        <div className='media-preview-empty'>
          <div className='empty-icon-wrapper' style={{ backgroundColor: `${mediaColor}15` }}>
            <FileImage size={24} color={mediaColor} />
          </div>
          <p className='empty-text'>Sin contenido multimedia</p>
        </div>
      );
    }

    // Render optimizado por tipo
    switch (type) {
      case 'image':
        if (imageError) {
          return (
            <div className='media-preview media-preview-error'>
              <div className='error-content'>
                <AlertCircle size={24} color={mediaColor} />
                <p>Error al cargar imagen</p>
                <small>{url}</small>
              </div>
            </div>
          );
        }
        return (
          <div className='media-preview media-preview-image'>
            {isLoading && (
              <div className='preview-loading'>
                <div className='loading-shimmer' />
              </div>
            )}
            <div className='preview-image-container'>
              <img
                src={url}
                alt={altText ?? caption ?? 'Media preview'}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className='preview-image'
                style={{
                  objectFit: config?.imageSettings?.objectFit ?? 'cover',
                  display: isLoading ? 'none' : 'block',
                }}
                loading='lazy'
              />
              <div className='preview-overlay'>
                <button className='preview-action-btn' aria-label='Expandir'>
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>
            {caption && (
              <div className='preview-caption'>
                <p>{caption}</p>
              </div>
            )}
          </div>
        );

      case 'video':
        if (videoError) {
          return (
            <div className='media-preview media-preview-error'>
              <div className='error-content'>
                <AlertCircle size={24} color={mediaColor} />
                <p>Error al cargar video</p>
                <small>{url}</small>
              </div>
            </div>
          );
        }
        return (
          <div className='media-preview media-preview-video'>
            {isLoading && (
              <div className='preview-loading'>
                <div className='loading-shimmer' />
              </div>
            )}
            <div className='video-container'>
              <video
                ref={videoRef}
                src={url}
                controls={config?.videoSettings?.controls !== false}
                autoPlay={config?.videoSettings?.autoplay}
                loop={config?.videoSettings?.loop}
                muted={config?.videoSettings?.muted}
                className='preview-video'
                onLoadedData={handleVideoLoad}
                onError={handleVideoError}
                poster={config?.videoSettings?.thumbnail}
              >
                <track kind='captions' />
              </video>
              {!config?.videoSettings?.controls && (
                <div className='video-custom-controls'>
                  <button
                    onClick={handlePlayPause}
                    className='control-btn control-btn-primary'
                    aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                    style={{ backgroundColor: mediaColor }}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    onClick={handleToggleMute}
                    className='control-btn'
                    aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>
              )}
              <div
                className='video-badge'
                style={{ backgroundColor: `${mediaColor}20`, color: mediaColor }}
              >
                <Film size={14} />
                <span>Video</span>
              </div>
            </div>
            {caption && (
              <div className='preview-caption'>
                <p>{caption}</p>
              </div>
            )}
          </div>
        );

      case 'audio': {
        if (audioError) {
          return (
            <div className='media-preview media-preview-error'>
              <div className='error-content'>
                <AlertCircle size={24} color={mediaColor} />
                <p>Error al cargar audio</p>
                <small>{url}</small>
              </div>
            </div>
          );
        }
        // Generate audio visualization bars
        const bars = Array.from({ length: 5 }, () => 30 + Math.random() * 40);
        return (
          <div className='media-preview media-preview-audio'>
            {isLoading && (
              <div className='preview-loading'>
                <div className='loading-shimmer' />
              </div>
            )}
            <div className='audio-container'>
              <div className='audio-visualization'>
                <div className='audio-icon-wrapper' style={{ backgroundColor: `${mediaColor}15` }}>
                  <Music size={32} color={mediaColor} />
                </div>
                <div className='audio-waves'>
                  {bars.map((height, index) => {
                    const uniqueKey = `audio-bar-${url}-${height}-${index}`;
                    return (
                      <div
                        key={uniqueKey}
                        className='audio-bar'
                        style={{
                          height: `${height}%`,
                          animationDelay: `${index * 0.1}s`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <audio
                ref={audioRef}
                src={url}
                controls={config?.audioSettings?.controls !== false}
                autoPlay={config?.audioSettings?.autoplay}
                loop={config?.audioSettings?.loop}
                className='preview-audio'
                onLoadedData={handleAudioLoad}
                onError={handleAudioError}
              >
                <track kind='captions' />
              </audio>
            </div>
            {caption && (
              <div className='preview-caption'>
                <p>{caption}</p>
              </div>
            )}
          </div>
        );
      }

      case 'file':
      default: {
        const fileName = url?.split('/').pop() ?? caption ?? 'archivo';
        const truncatedFileName =
          fileName.length > 30 ? `${fileName.substring(0, 27)}...` : fileName;

        return (
          <div className='media-preview media-preview-file'>
            <div className='file-container'>
              <div className='file-icon-wrapper' style={{ backgroundColor: `${mediaColor}15` }}>
                <FileImage size={32} color={mediaColor} />
              </div>
              <div className='file-info'>
                <p className='file-name'>{truncatedFileName}</p>
                <div className='file-actions'>
                  <a
                    href={url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='file-download-btn'
                    style={{ backgroundColor: mediaColor }}
                  >
                    <Download size={14} />
                    <span>Descargar</span>
                  </a>
                </div>
              </div>
            </div>
            {caption && (
              <div className='preview-caption'>
                <p>{caption}</p>
              </div>
            )}
          </div>
        );
      }
    }
  },
  (prevProps, nextProps) => {
    // Comparación superficial optimizada
    return (
      prevProps.type === nextProps.type &&
      prevProps.url === nextProps.url &&
      prevProps.caption === nextProps.caption &&
      prevProps.altText === nextProps.altText &&
      JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config)
    );
  },
);

MediaPreview.displayName = 'MediaPreview';

export default MediaPreview;
