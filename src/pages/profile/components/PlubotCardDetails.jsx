import PropTypes from 'prop-types';
import React from 'react';

const PlubotCardDetails = ({ plubot, plubotPowerTitles }) => (
  <>
    <div className='plubot-detail'>Personalidad: {plubot.tone || 'N/A'}</div>
    <div className='plubot-powers'>
      <div className='plubot-detail'>
        <strong>Poderes:</strong> {plubotPowerTitles}
      </div>
    </div>
  </>
);

PlubotCardDetails.propTypes = {
  plubot: PropTypes.shape({
    tone: PropTypes.string,
  }).isRequired,
  plubotPowerTitles: PropTypes.string.isRequired,
};

export default PlubotCardDetails;
