/**
 * @file MediaNodeConfig.tsx
 * @description Premium configuration panel for MediaNode with Apple-inspired design
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Image, Film, Music, FileImage, Check, X, AlertCircle, Info, Save } from 'lucide-react';
import React, { memo, useState, useCallback, useEffect } from 'react';

import { MEDIA_TYPES, DEFAULT_CONFIGS, URL_EXAMPLES, LIMITS } from './constants';
import type { MediaNodeConfigProps, MediaNodeData, MediaType } from './types';
import { validateNodeData, isValidExtensionForType } from './utils';
import './MediaNodeConfig.css';

const MediaNodeConfig: React.FC<MediaNodeConfigProps> = memo(({ data, onSave, onCancel }) => {
  const [formData, setFormData] = useState<MediaNodeData>({
    ...data,
    config: data.config ?? DEFAULT_CONFIGS[data.type ?? 'image'],
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Validar datos cuando cambian
  useEffect(() => {
    // No validar si el formulario está completamente vacío (estado inicial)
    if (!formData.type && !formData.url && !formData.caption && !formData.description) {
      setErrors([]);
      return;
    }

    // Validar solo si hay algún dato
    const validation = validateNodeData(formData);
    setErrors(validation.errors);
  }, [formData]);

  // Manejador de cambio de tipo
  const handleTypeChange = useCallback((type: MediaType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      // eslint-disable-next-line security/detect-object-injection
      config: DEFAULT_CONFIGS[type],
    }));
  }, []);

  // Manejador de cambio de URL
  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      setFormData((prev) => ({
        ...prev,
        url,
      }));

      // Validar extensión si hay un tipo seleccionado
      if (formData.type && url && !isValidExtensionForType(url, formData.type)) {
        setErrors((prev) => [
          ...prev,
          `La extensión del archivo no es válida para ${formData.type}`,
        ]);
      }
    },
    [formData.type],
  );

  // Manejador de cambio de caption
  const handleCaptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      caption: e.target.value,
    }));
  }, []);

  // Manejador de cambio de alt text
  const handleAltTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      altText: e.target.value,
    }));
  }, []);

  // Manejador de cambio de descripción
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      description: e.target.value,
    }));
  }, []);

  // Manejador de guardar
  const handleSave = useCallback(() => {
    const validation = validateNodeData(formData);
    if (validation.isValid) {
      onSave(formData);
    } else {
      setErrors(validation.errors);
    }
  }, [formData, onSave]);

  // Actualizar configuración específica del tipo
  const updateTypeConfig = useCallback((key: string, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [`${prev.type}Settings`]: {
          ...prev.config?.[`${prev.type}Settings` as keyof typeof prev.config],
          [key]: value,
        },
      },
    }));
  }, []);

  // Get icon for media type
  const getMediaIcon = (type: MediaType) => {
    const icons = {
      image: Image,
      video: Film,
      audio: Music,
      file: FileImage,
    };
    return icons[type] || FileImage;
  };

  return (
    <motion.div
      className='media-config-premium'
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Premium Header */}
      <div className='config-premium-header'>
        <div className='config-header-content'>
          <div className='config-icon-wrapper'>
            {formData.type && React.createElement(getMediaIcon(formData.type), { size: 20 })}
          </div>
          <div className='config-header-text'>
            <h3 className='config-title'>Configurar Media</h3>
            <p className='config-subtitle'>Personaliza el contenido multimedia</p>
          </div>
        </div>
        <div className='config-header-actions'>
          <motion.button
            onClick={handleSave}
            className='config-header-btn save-btn'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title='Guardar cambios'
            type='button'
          >
            <Save size={16} />
          </motion.button>
          <motion.button
            onClick={onCancel}
            className='config-header-btn cancel-btn'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title='Cancelar y cerrar'
          >
            <X size={16} />
          </motion.button>
        </div>
      </div>

      <div className='config-premium-body'>
        {/* Media Type Selector */}
        <div className='config-section'>
          <label className='config-label'>
            <span className='label-text'>Tipo de Media</span>
            <Info size={14} className='label-info' />
          </label>
          <div className='media-type-grid'>
            {MEDIA_TYPES.map((type) => {
              const IconComponent = getMediaIcon(type.value);
              const isSelected = formData.type === type.value;

              return (
                <motion.button
                  key={type.value}
                  onClick={() => handleTypeChange(type.value)}
                  className={`media-type-card ${isSelected ? 'selected' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`type-card-icon ${isSelected ? 'selected' : ''}`}>
                    <IconComponent size={24} />
                  </div>
                  <div className='type-card-content'>
                    <div className='type-card-label'>{type.label}</div>
                    <div className='type-card-description'>{type.description}</div>
                  </div>
                  {isSelected && (
                    <motion.div
                      className='type-card-check'
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <Check size={16} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* URL Input */}
        <div className='config-section'>
          <label className='config-label' htmlFor='media-url'>
            <span className='label-text'>URL del Archivo</span>
            {errors.some((e) => e.includes('URL')) && (
              <span className='label-error'>
                <AlertCircle size={14} />
              </span>
            )}
          </label>
          <div className='input-wrapper'>
            <input
              id='media-url'
              type='text'
              value={formData.url}
              onChange={handleUrlChange}
              placeholder={URL_EXAMPLES[formData.type || 'image']}
              maxLength={LIMITS.MAX_URL_LENGTH}
              className={`config-input ${errors.some((e) => e.includes('URL')) ? 'error' : ''}`}
            />
            {formData.type && (
              <div className='input-hint'>
                Formatos:{' '}
                {MEDIA_TYPES.find((t) => t.value === formData.type)?.acceptedFormats.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Caption */}
        <div className='config-section'>
          <label className='config-label' htmlFor='media-caption'>
            <span className='label-text'>Descripción (Caption)</span>
            <span className='label-counter'>
              {formData.caption?.length ?? 0}/{LIMITS.MAX_CAPTION_LENGTH}
            </span>
          </label>
          <textarea
            id='media-caption'
            value={formData.caption ?? ''}
            onChange={handleCaptionChange}
            rows={2}
            placeholder='Texto descriptivo debajo del media'
            maxLength={LIMITS.MAX_CAPTION_LENGTH}
            className='config-textarea'
          />
        </div>

        {/* Alt Text */}
        <div className='config-section'>
          <label className='config-label' htmlFor='media-alt-text'>
            <span className='label-text'>Texto Alternativo</span>
            <Info size={14} className='label-info' />
          </label>
          <input
            id='media-alt-text'
            type='text'
            value={formData.altText ?? ''}
            onChange={handleAltTextChange}
            placeholder='Descripción para lectores de pantalla'
            maxLength={LIMITS.MAX_ALT_TEXT_LENGTH}
            className='config-input'
          />
        </div>

        {/* Type-specific Configuration */}
        <AnimatePresence mode='wait'>
          {formData.type === 'image' && (
            <motion.div
              className='config-section type-specific'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className='section-title'>Configuración de Imagen</h4>
              <div className='config-group'>
                <label className='config-label' htmlFor='image-fit'>
                  <span className='label-text'>Ajuste de Imagen</span>
                </label>
                <select
                  id='image-fit'
                  value={formData.config?.imageSettings?.objectFit ?? 'cover'}
                  onChange={(e) => updateTypeConfig('objectFit', e.target.value)}
                  className='config-select'
                >
                  <option value='cover'>Cubrir</option>
                  <option value='contain'>Contener</option>
                  <option value='fill'>Rellenar</option>
                  <option value='none'>Original</option>
                </select>
              </div>
            </motion.div>
          )}

          {formData.type === 'video' && (
            <motion.div
              className='config-section type-specific'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className='section-title'>Configuración de Video</h4>
              <div className='config-switches'>
                <label className='config-switch'>
                  <input
                    type='checkbox'
                    checked={formData.config?.videoSettings?.autoplay ?? false}
                    onChange={(e) => updateTypeConfig('autoplay', e.target.checked)}
                  />
                  <span className='switch-slider' />
                  <span className='switch-label'>Reproducir automáticamente</span>
                </label>
                <label className='config-switch'>
                  <input
                    type='checkbox'
                    checked={formData.config?.videoSettings?.controls ?? true}
                    onChange={(e) => updateTypeConfig('controls', e.target.checked)}
                  />
                  <span className='switch-slider' />
                  <span className='switch-label'>Mostrar controles</span>
                </label>
                <label className='config-switch'>
                  <input
                    type='checkbox'
                    checked={formData.config?.videoSettings?.loop ?? false}
                    onChange={(e) => updateTypeConfig('loop', e.target.checked)}
                  />
                  <span className='switch-slider' />
                  <span className='switch-label'>Reproducir en bucle</span>
                </label>
                <label className='config-switch'>
                  <input
                    type='checkbox'
                    checked={formData.config?.videoSettings?.muted ?? false}
                    onChange={(e) => updateTypeConfig('muted', e.target.checked)}
                  />
                  <span className='switch-slider' />
                  <span className='switch-label'>Silenciado por defecto</span>
                </label>
              </div>
            </motion.div>
          )}

          {formData.type === 'audio' && (
            <motion.div
              className='config-section type-specific'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className='section-title'>Configuración de Audio</h4>
              <div className='config-switches'>
                <label className='config-switch'>
                  <input
                    type='checkbox'
                    checked={formData.config?.audioSettings?.autoplay ?? false}
                    onChange={(e) => updateTypeConfig('autoplay', e.target.checked)}
                  />
                  <span className='switch-slider' />
                  <span className='switch-label'>Reproducir automáticamente</span>
                </label>
                <label className='config-switch'>
                  <input
                    type='checkbox'
                    checked={formData.config?.audioSettings?.loop ?? false}
                    onChange={(e) => updateTypeConfig('loop', e.target.checked)}
                  />
                  <span className='switch-slider' />
                  <span className='switch-label'>Reproducir en bucle</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Node Description */}
        <div className='config-section'>
          <label className='config-label' htmlFor='media-description'>
            <span className='label-text'>Descripción del Nodo</span>
            <span className='label-optional'>Opcional</span>
          </label>
          <textarea
            id='media-description'
            value={formData.description ?? ''}
            onChange={handleDescriptionChange}
            placeholder='Nota interna sobre este nodo'
            maxLength={LIMITS.MAX_DESCRIPTION_LENGTH}
            rows={2}
            className='config-textarea'
          />
        </div>

        {/* Error Messages */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              className='config-errors'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {errors.map((error) => (
                <div key={error} className='error-item'>
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

MediaNodeConfig.displayName = 'MediaNodeConfig';

export default MediaNodeConfig;
