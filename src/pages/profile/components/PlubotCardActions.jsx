import PropTypes from 'prop-types';
import React from 'react';

const PlubotCardActions = ({
  plubot,
  isDeleting,
  isUnremovable,
  handleEditClick,
  handleViewDetails,
  handleForceRemovePlubot,
  requestDeletePlubot,
}) => (
  <div className='plubot-actions'>
    <button
      className='plubot-button icon-button'
      onClick={handleEditClick}
      title='Editar Plubot'
      disabled={isDeleting || isUnremovable}
    >
      ⚙️
    </button>
    <button
      className='plubot-button icon-button view-button'
      onClick={() => handleViewDetails(plubot)}
      title='Ver detalles'
      disabled={isDeleting || isUnremovable}
    >
      👁️
    </button>

    {isUnremovable ? (
      <button
        className='plubot-button icon-button force-delete-button'
        onClick={() => handleForceRemovePlubot(plubot.id)}
        title='Eliminar de la interfaz'
        style={{ background: '#ff5722' }}
        disabled={isDeleting}
      >
        🗑️🚫
      </button>
    ) : (
      <button
        className='plubot-button icon-button delete-button'
        onClick={() => requestDeletePlubot(plubot)}
        title='Eliminar'
        disabled={isDeleting}
      >
        🗑️
      </button>
    )}
  </div>
);

PlubotCardActions.propTypes = {
  plubot: PropTypes.object.isRequired,
  isDeleting: PropTypes.bool.isRequired,
  isUnremovable: PropTypes.bool.isRequired,
  handleEditClick: PropTypes.func.isRequired,
  handleViewDetails: PropTypes.func.isRequired,
  handleForceRemovePlubot: PropTypes.func.isRequired,
  requestDeletePlubot: PropTypes.func.isRequired,
};

export default PlubotCardActions;
