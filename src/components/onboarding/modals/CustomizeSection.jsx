import PropTypes from 'prop-types';
import React from 'react';

const CustomizeSection = ({ customization, handleCustomizationChange }) => (
  <div className='embed-section'>
    <h3>Personalizar Widget</h3>
    <p>Configura la apariencia y comportamiento del widget embebido:</p>
    <div className='embed-customize-form'>
      <div className='embed-form-group'>
        <label htmlFor='embed-theme'>Tema:</label>
        <select
          id='embed-theme'
          value={customization.theme}
          onChange={(event) => handleCustomizationChange('theme', event.target.value)}
        >
          <option value='light'>Claro</option>
          <option value='dark'>Oscuro</option>
          <option value='auto'>Automático</option>
        </select>
      </div>
      <div className='embed-form-group'>
        <label htmlFor='embed-position'>Posición:</label>
        <select
          id='embed-position'
          value={customization.position}
          onChange={(event) => handleCustomizationChange('position', event.target.value)}
        >
          <option value='right'>Derecha</option>
          <option value='left'>Izquierda</option>
          <option value='center'>Centro</option>
        </select>
      </div>
      <div className='embed-form-group'>
        <label htmlFor='embed-width'>Ancho:</label>
        <input
          id='embed-width'
          type='text'
          value={customization.width}
          onChange={(event) => handleCustomizationChange('width', event.target.value)}
        />
      </div>
      <div className='embed-form-group'>
        <label htmlFor='embed-height'>Alto:</label>
        <input
          id='embed-height'
          type='text'
          value={customization.height}
          onChange={(event) => handleCustomizationChange('height', event.target.value)}
        />
      </div>
      <div className='embed-form-group'>
        <label htmlFor='embed-primary-color'>Color Primario:</label>
        <input
          id='embed-primary-color'
          type='color'
          value={customization.primaryColor}
          onChange={(event) => handleCustomizationChange('primaryColor', event.target.value)}
        />
      </div>
      <div className='embed-form-group'>
        <label htmlFor='embed-welcome-message'>Mensaje de Bienvenida:</label>
        <textarea
          id='embed-welcome-message'
          value={customization.welcomeMessage}
          onChange={(event) => handleCustomizationChange('welcomeMessage', event.target.value)}
          rows={3}
        />
      </div>
    </div>
  </div>
);

CustomizeSection.propTypes = {
  customization: PropTypes.object.isRequired,
  handleCustomizationChange: PropTypes.func.isRequired,
};

export default CustomizeSection;
