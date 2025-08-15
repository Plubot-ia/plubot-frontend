import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { powers } from '@/data/powers';

const AddPowerForm = ({ onAddPower, existingPowers }) => {
  const [newPower, setNewPower] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onAddPower(newPower);
    setNewPower('');
  };

  // Filter out powers that the user already has
  const availablePowers = powers.filter((power) => !existingPowers.includes(power.id));

  return (
    <form className='power-form-container' onSubmit={handleSubmit}>
      <select
        value={newPower}
        onChange={(event) => setNewPower(event.target.value)}
        className='power-select-styles'
      >
        <option value=''>Selecciona un poder</option>
        {availablePowers.map((power) => (
          <option key={power.id} value={power.id}>
            {power.title}
          </option>
        ))}
      </select>
      <button type='submit' className='cyber-button glow-effect'>
        AGREGAR PODER
      </button>
    </form>
  );
};

AddPowerForm.propTypes = {
  onAddPower: PropTypes.func.isRequired,
  existingPowers: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default AddPowerForm;
