import React, { useState, useEffect, forwardRef } from 'react';
import DOMPurify from 'dompurify';

/**
 * Editor de texto enriquecido para el componente EndNode
 * @param {Object} props - Propiedades del componente
 * @param {string} props.initialValue - Valor inicial del editor
 * @param {Function} props.onChange - Función que se ejecuta cuando cambia el contenido
 * @param {boolean} props.readOnly - Si el editor es de solo lectura
 * @param {Object} props.style - Estilos adicionales para el editor
 */
const RichTextEditor = forwardRef(({ 
  initialValue = '', 
  onChange, 
  readOnly = false,
  style = {},
  placeholder = 'Escribe aquí...',
  maxLength = 2000,
  preferReducedMotion = false,
  highContrast = false,
}, ref) => {
  const [content, setContent] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setContent(initialValue);
  }, [initialValue]);

  const handleChange = (e) => {
    const newContent = e.target.innerHTML;
    const sanitizedContent = DOMPurify.sanitize(newContent);
    
    if (sanitizedContent.length <= maxLength) {
      setContent(sanitizedContent);
      onChange && onChange(sanitizedContent);
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const editorStyles = {
    minHeight: '100px',
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${isFocused ? '#3b82f6' : '#d1d5db'}`,
    outline: 'none',
    transition: preferReducedMotion ? 'none' : 'border-color 0.2s ease',
    backgroundColor: highContrast ? '#000' : '#fff',
    color: highContrast ? '#fff' : '#333',
    ...style
  };

  return (
    <div className="rich-text-editor-container">
      <div
        ref={ref}
        contentEditable={!readOnly}
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={editorStyles}
        placeholder={placeholder}
        role="textbox"
        aria-multiline="true"
        aria-label="Editor de texto enriquecido"
        tabIndex={0}
      />
      {maxLength && (
        <div className="character-count" style={{ 
          textAlign: 'right', 
          fontSize: '0.75rem',
          color: content.length > maxLength * 0.9 ? '#ef4444' : '#6b7280'
        }}>
          {content.length}/{maxLength}
        </div>
      )}
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
