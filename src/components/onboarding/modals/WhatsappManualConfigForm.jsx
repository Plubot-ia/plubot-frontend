import PropTypes from 'prop-types';
import React from 'react';

const WhatsappManualConfigForm = ({
  manualConfig,
  onConfigChange,
  onSave,
  onCancel,
  isApiLoading,
}) => (
  <div className='manual-config-form'>
    <div className='form-header'>
      <h4>📋 Configuración Manual de WhatsApp Business</h4>
      <p className='help-text'>
        Copia estos valores desde la configuración de tu API de WhatsApp Business
      </p>
    </div>

    <div className='form-instructions'>
      <p className='step-text'>📍 Estos valores los encuentras en:</p>
      <ol>
        <li>
          Ve a{' '}
          <a href='https://developers.facebook.com' target='_blank' rel='noopener noreferrer'>
            Facebook Developers
          </a>
        </li>
        <li>Selecciona tu aplicación</li>
        <li>Ve a WhatsApp → Configuración de la API</li>
        <li>Copia los valores que se muestran ahí</li>
      </ol>
    </div>

    <div className='form-group'>
      <label htmlFor='phone-number-id'>
        <span className='label-title'>📱 Phone Number ID</span>
        <span className='label-help'>
          Identificador del número de teléfono (campo &quot;Identificador de número de
          teléfono&quot; en Facebook Developers)
        </span>
      </label>
      <input
        id='phone-number-id'
        type='text'
        value={manualConfig.phone_number_id}
        onChange={(event) =>
          onConfigChange({ ...manualConfig, phone_number_id: event.target.value })
        }
        placeholder='Ejemplo: 783440158177520'
        className='config-input'
      />
    </div>

    <div className='form-group'>
      <label htmlFor='waba-id'>
        <span className='label-title'>🏢 WABA ID</span>
        <span className='label-help'>
          Identificador de la cuenta de WhatsApp Business (campo &quot;Identificador de la cuenta de
          WhatsApp Business&quot; en Facebook Developers)
        </span>
      </label>
      <input
        id='waba-id'
        type='text'
        value={manualConfig.waba_id}
        onChange={(event) => onConfigChange({ ...manualConfig, waba_id: event.target.value })}
        placeholder='Ejemplo: 728280003377275'
        className='config-input'
      />
    </div>

    <div className='form-group'>
      <label htmlFor='phone-number'>
        <span className='label-title'>☎️ Número de Teléfono</span>
        <span className='label-help'>
          Tu número de WhatsApp Business con código de país (campo &quot;Para&quot; en Facebook
          Developers)
        </span>
      </label>
      <input
        id='phone-number'
        type='text'
        value={manualConfig.phone_number}
        onChange={(event) => onConfigChange({ ...manualConfig, phone_number: event.target.value })}
        placeholder='Ejemplo: +54 221 699-6564'
        className='config-input'
      />
    </div>

    <div className='form-group'>
      <label htmlFor='business-name'>
        <span className='label-title'>🏪 Nombre del Negocio</span>
        <span className='label-help'>El nombre de tu empresa o negocio</span>
      </label>
      <input
        id='business-name'
        type='text'
        value={manualConfig.business_name}
        onChange={(event) => onConfigChange({ ...manualConfig, business_name: event.target.value })}
        placeholder='Ejemplo: Mi Empresa'
        className='config-input'
      />
    </div>

    <div className='form-actions'>
      <button
        onClick={onSave}
        className='btn-save-config'
        disabled={
          isApiLoading ||
          !manualConfig.phone_number_id ||
          !manualConfig.waba_id ||
          !manualConfig.phone_number
        }
      >
        💾 Guardar Configuración
      </button>
      <button onClick={onCancel} className='btn-cancel-config'>
        ❌ Cancelar
      </button>
    </div>
  </div>
);

WhatsappManualConfigForm.propTypes = {
  manualConfig: PropTypes.shape({
    phone_number_id: PropTypes.string.isRequired,
    waba_id: PropTypes.string.isRequired,
    phone_number: PropTypes.string.isRequired,
    business_name: PropTypes.string.isRequired,
  }).isRequired,
  onConfigChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isApiLoading: PropTypes.bool.isRequired,
};

export default WhatsappManualConfigForm;
