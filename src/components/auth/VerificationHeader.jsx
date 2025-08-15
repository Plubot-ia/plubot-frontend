import PropTypes from 'prop-types';
import React from 'react';

import plubotLogo from '../../assets/img/logo.svg';

const VerificationHeader = ({ title, subtitle }) => (
  <div className='notice-card-header'>
    <div className='notice-logo'>
      <img src={plubotLogo} alt='Plubot Logo' />
    </div>
    <h2 className='notice-card-title'>{title}</h2>
    <p className='notice-card-subtitle'>{subtitle}</p>
  </div>
);

VerificationHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

VerificationHeader.defaultProps = {
  subtitle: '',
};

export default VerificationHeader;
