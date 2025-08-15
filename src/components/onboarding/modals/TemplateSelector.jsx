import { X, Award } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import './TemplateSelector.css';
import { categories, templates } from './data/TemplateSelectorData';

// Importar fuentes para el estilo cyberpunk
import '@fontsource/orbitron/400.css';

const TemplateSelector = ({ onSelectTemplate, onClose, className }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [animateItems, setAnimateItems] = useState(false);

  useEffect(() => {
    // Activar la animación de entrada de los elementos después de un breve retraso
    const timer = setTimeout(() => setAnimateItems(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template);
    onClose();
  };

  // Filtrar plantillas según la categoría seleccionada
  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((template) => template.category === selectedCategory);

  return (
    <div className={`template-selector-wrapper ${className ?? ''}`}>
      <div className='ts-modal'>
        <button className='ts-btn-close' onClick={onClose} aria-label='Cerrar'>
          <X size={22} />
        </button>
        <div className='ts-header'>
          <h2>Selecciona una plantilla</h2>
        </div>

        <div className='ts-categories'>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`ts-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className='ts-content'>
          <div className={`ts-template-list ${animateItems ? 'animate' : ''}`}>
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className='ts-template-item'
                onClick={() => handleSelectTemplate(template)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelectTemplate(template);
                  }
                }}
                role='button'
                tabIndex={0}
              >
                <div className='template-icon'>{template.icon || <Award size={20} />}</div>
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <div className='template-preview'>
                  {/* Aquí podría ir una vista previa del flujo */}
                  <span className='preview-text'>Vista previa</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

TemplateSelector.propTypes = {
  onSelectTemplate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default TemplateSelector;
