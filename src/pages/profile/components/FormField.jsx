import PropTypes from 'prop-types';
import React from 'react';

const FormField = ({ id, label, ...props }) => (
  <div className='form-group'>
    <label htmlFor={id}>{label}</label>
    <input id={id} {...props} />
  </div>
);

FormField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

export default FormField;
