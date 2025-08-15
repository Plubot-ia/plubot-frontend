import PropTypes from 'prop-types';
import React from 'react';

import plubotLogo from '@/assets/img/logo.svg';

const EditModalHeader = ({ plubotName = 'Plubot' }) => (
  <div className='edit-modal-header'>
    <div className='edit-modal-avatar'>
      <div className='avatar-hologram'>
        <div className='hologram-ring' />
        <div className='hologram-ring' />
        <div className='hologram-image'>
          <img src={plubotLogo} alt='Plubot Logo' className='plubot-logo' />
        </div>
      </div>
    </div>
    <h3 className='edit-modal-title-styles'>
      <span className='edit-modal-title-glow'>Personalizar</span> {plubotName}
    </h3>
  </div>
);

EditModalHeader.propTypes = {
  plubotName: PropTypes.string,
};

export default EditModalHeader;
