/**
 * @file MediaNodeConfig.tsx
 * @description Panel de configuración para MediaNode
 */

import React, { memo, useState, useCallback, useEffect } from 'react';

import { MEDIA_TYPES, URL_EXAMPLES, LIMITS, DEFAULT_CONFIGS, COLORS } from './constants';
import type { MediaNodeConfigProps, MediaNodeData, MediaType } from './types';
import { validateNodeData, isValidExtensionForType } from './utils';

const MediaNodeConfig: React.FC<MediaNodeConfigProps> = memo(({ data, onSave, onCancel }) => {
  const [formData, setFormData] = useState<MediaNodeData>({
    ...data,
    config: data.config ?? DEFAULT_CONFIGS[data.type ?? 'image'],
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Validar datos cuando cambian
  useEffect(() => {
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

  return (
    <div className='media-node-config'>
      <div className='config-header'>
        <h3>Configurar Media</h3>
        <button
          onClick={onCancel}
          className='close-button'
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: COLORS.TEXT_SECONDARY,
          }}
        >
          ✕
        </button>
      </div>

      <div className='config-body'>
        {/* Selector de tipo */}
        <div className='form-group'>
          <label htmlFor='media-type-selector'>Tipo de Media</label>
          <div className='media-type-selector'>
            {MEDIA_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`type-option ${formData.type === type.value ? 'selected' : ''}`}
                style={{
                  padding: '12px',
                  border: `2px solid ${formData.type === type.value ? COLORS.PRIMARY : COLORS.BORDER}`,
                  borderRadius: '8px',
                  background: formData.type === type.value ? `${COLORS.PRIMARY}10` : 'white',
                  cursor: 'pointer',
                  flex: 1,
                  transition: 'all 0.2s',
                }}
              >
                <div className='type-icon' style={{ fontSize: '24px' }}>
                  {type.icon}
                </div>
                <div className='type-label' style={{ fontWeight: '500', marginTop: '4px' }}>
                  {type.label}
                </div>
                <div
                  className='type-description'
                  style={{ fontSize: '11px', color: COLORS.TEXT_SECONDARY, marginTop: '2px' }}
                >
                  {type.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* URL del archivo */}
        <div className='form-group'>
          <label htmlFor='media-url'>URL del Archivo</label>
          <input
            id='media-url'
            type='text'
            value={formData.url}
            onChange={handleUrlChange}
            placeholder={URL_EXAMPLES[formData.type || 'image']}
            maxLength={LIMITS.MAX_URL_LENGTH}
            className='form-input'
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${errors.some((e) => e.includes('URL')) ? COLORS.ERROR : COLORS.BORDER}`,
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          {formData.type && (
            <small style={{ color: COLORS.TEXT_SECONDARY }}>
              Formatos aceptados:{' '}
              {MEDIA_TYPES.find((t) => t.value === formData.type)?.acceptedFormats.join(', ')}
            </small>
          )}
        </div>

        {/* Caption */}
        <div className='form-group'>
          <label htmlFor='media-caption'>Descripción (Caption)</label>
          <textarea
            id='media-caption'
            value={formData.caption ?? ''}
            onChange={handleCaptionChange}
            rows={2}
            placeholder='Texto descriptivo debajo del media'
            maxLength={LIMITS.MAX_CAPTION_LENGTH}
            className='form-input'
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${COLORS.BORDER}`,
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <small style={{ color: COLORS.TEXT_SECONDARY }}>
            {formData.caption?.length ?? 0}/{LIMITS.MAX_CAPTION_LENGTH}
          </small>
        </div>

        {/* Alt Text */}
        <div className='form-group'>
          <label htmlFor='media-alt-text'>Texto Alternativo</label>
          <input
            id='media-alt-text'
            type='text'
            value={formData.altText ?? ''}
            onChange={handleAltTextChange}
            placeholder='Descripción para lectores de pantalla'
            maxLength={LIMITS.MAX_ALT_TEXT_LENGTH}
            className='form-input'
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${COLORS.BORDER}`,
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Configuración específica por tipo */}
        {formData.type === 'image' && (
          <div className='type-config'>
            <h4>Configuración de Imagen</h4>
            <div className='form-group'>
              <label htmlFor='image-fit'>Ajuste de Imagen</label>
              <select
                id='image-fit'
                value={formData.config?.imageSettings?.objectFit ?? 'cover'}
                onChange={(e) => updateTypeConfig('objectFit', e.target.value)}
                className='form-select'
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${COLORS.BORDER}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value='cover'>Cubrir</option>
                <option value='contain'>Contener</option>
              </select>
            </div>
          </div>
        )}

        {formData.type === 'video' && (
          <div className='type-config'>
            <h4>Configuración de Video</h4>
            <div className='form-group'>
              <label className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={formData.config?.videoSettings?.autoplay ?? false}
                  onChange={(e) => updateTypeConfig('autoplay', e.target.checked)}
                />
                Reproducir automáticamente
              </label>
              <label className='checkbox-label'>
                <input
                  id='video-controls'
                  type='checkbox'
                  checked={formData.config?.videoSettings?.controls ?? true}
                  onChange={(e) => updateTypeConfig('controls', e.target.checked)}
                />
                Mostrar controles
              </label>
              <label className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={formData.config?.videoSettings?.loop ?? false}
                  onChange={(e) => updateTypeConfig('loop', e.target.checked)}
                />
                Reproducir en bucle
              </label>
              <label className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={formData.config?.videoSettings?.muted ?? false}
                  onChange={(e) => updateTypeConfig('muted', e.target.checked)}
                />
                Silenciado por defecto
              </label>
            </div>
          </div>
        )}

        {formData.type === 'audio' && (
          <div className='type-config'>
            <h4>Configuración de Audio</h4>
            <div className='form-group'>
              <label className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={formData.config?.audioSettings?.autoplay ?? false}
                  onChange={(e) => updateTypeConfig('autoplay', e.target.checked)}
                />
                Reproducir automáticamente
              </label>
              <label className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={formData.config?.audioSettings?.loop ?? false}
                  onChange={(e) => updateTypeConfig('loop', e.target.checked)}
                />
                Reproducir en bucle
              </label>
            </div>
          </div>
        )}

        {/* Campo Descripción */}
        <div className='form-group'>
          <label htmlFor='media-description'>Descripción del Nodo (opcional)</label>
          <textarea
            id='media-description'
            value={formData.description ?? ''}
            onChange={handleDescriptionChange}
            placeholder='Nota interna sobre este nodo'
            maxLength={LIMITS.MAX_DESCRIPTION_LENGTH}
            rows={2}
            className='form-textarea'
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${COLORS.BORDER}`,
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Errores */}
        {errors.length > 0 && (
          <div
            className='error-messages'
            style={{
              background: `${COLORS.ERROR}10`,
              border: `1px solid ${COLORS.ERROR}30`,
              borderRadius: '6px',
              padding: '10px',
              marginTop: '10px',
            }}
          >
            {errors.map((error) => (
              <div key={error} style={{ color: COLORS.ERROR, fontSize: '13px' }}>
                • {error}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className='config-footer'
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
          padding: '15px',
          borderTop: `1px solid ${COLORS.BORDER}`,
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            border: `1px solid ${COLORS.BORDER}`,
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={errors.length > 0}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            background: errors.length > 0 ? COLORS.TEXT_LIGHT : COLORS.PRIMARY,
            color: 'white',
            cursor: errors.length > 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
});

MediaNodeConfig.displayName = 'MediaNodeConfig';

export default MediaNodeConfig;
