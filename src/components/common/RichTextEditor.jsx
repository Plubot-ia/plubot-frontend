import DOMPurify from 'dompurify';
import PropTypes from 'prop-types';
import { useState, useEffect, forwardRef, useCallback } from 'react';

import './RichTextEditor.css';

const RichTextEditor = forwardRef(
  (
    {
      initialValue = '',
      onChange,
      readOnly = false,
      style = {},
      placeholder = 'Escribe aquí...',
      maxLength = 2000,
      preferReducedMotion = false,
      highContrast = false,
    },
    reference,
  ) => {
    const [content, setContent] = useState(initialValue);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      setContent(initialValue);
    }, [initialValue]);

    const handleChange = useCallback(
      (event) => {
        const newContent = event.target.innerHTML;
        const sanitizedContent = DOMPurify.sanitize(newContent);

        if (sanitizedContent.length <= maxLength) {
          setContent(sanitizedContent);
          if (onChange) {
            onChange(sanitizedContent);
          }
        }
      },
      [maxLength, onChange],
    );

    const handleFocus = useCallback(() => setIsFocused(true), []);
    const handleBlur = useCallback(() => setIsFocused(false), []);

    const showPlaceholder = !content && !isFocused;

    const editorClasses = [
      'rich-text-editor',
      isFocused ? 'focused' : '',
      highContrast ? 'high-contrast' : '',
      preferReducedMotion ? 'prefer-reduced-motion' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const charCountClasses = [
      'character-count',
      content.length > maxLength * 0.9 ? 'limit-exceeded' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className='rich-text-editor-container' style={style}>
        {showPlaceholder && (
          <span className='editor-placeholder'>{placeholder}</span>
        )}
        <div
          ref={reference}
          className={editorClasses}
          contentEditable={!readOnly}
          dangerouslySetInnerHTML={{ __html: content }}
          onInput={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          role='textbox'
          aria-multiline='true'
          aria-label='Editor de texto enriquecido'
          tabIndex={0}
        />
        {maxLength && (
          <div className={charCountClasses}>
            {content.length}/{maxLength}
          </div>
        )}
      </div>
    );
  },
);

RichTextEditor.propTypes = {
  initialValue: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  style: PropTypes.object,
  placeholder: PropTypes.string,
  maxLength: PropTypes.number,
  preferReducedMotion: PropTypes.bool,
  highContrast: PropTypes.bool,
};

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
