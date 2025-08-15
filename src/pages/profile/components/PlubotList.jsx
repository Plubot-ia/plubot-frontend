import PropTypes from 'prop-types';
import React from 'react';

import PlubotCard from './PlubotCard';

const PlubotList = ({
  user,
  isLoading,
  animateBadges,
  getPowerDetails,
  handleViewDetails,
  handleForceRemovePlubot,
  requestDeletePlubot,
  setEditModalPlubot,
  deletingPlubotIds,
  unremovablePlubots,
  showNotification,
}) => {
  if (isLoading) {
    return <p className='no-plubots-message'>Cargando Plubots...</p>;
  }

  if (!user || user.plubots === undefined) {
    return <p className='no-plubots-message'>Datos de Plubots no disponibles...</p>;
  }

  if (!Array.isArray(user.plubots)) {
    return (
      <p className='no-plubots-message'>
        Error: Formato de datos de Plubots incorrecto. Por favor, recarga la página o contacta a
        soporte.
      </p>
    );
  }

  if (user.plubots.length === 0) {
    return (
      <p className='no-plubots-message'>
        Aún no has creado ningún Plubot. ¡Empieza tu aventura en el Pluniverse!
      </p>
    );
  }

  return (
    <div className='plubots-grid'>
      {user.plubots.map((plubot, index) => (
        <PlubotCard
          key={plubot.id}
          plubot={plubot}
          index={index}
          animateBadges={animateBadges}
          getPowerDetails={getPowerDetails}
          handleViewDetails={handleViewDetails}
          handleForceRemovePlubot={handleForceRemovePlubot}
          requestDeletePlubot={requestDeletePlubot}
          setEditModalPlubot={setEditModalPlubot}
          deletingPlubotIds={deletingPlubotIds}
          unremovablePlubots={unremovablePlubots}
          showNotification={showNotification}
        />
      ))}
    </div>
  );
};

PlubotList.propTypes = {
  user: PropTypes.shape({
    plubots: PropTypes.arrayOf(PropTypes.object),
  }),
  isLoading: PropTypes.bool,
  animateBadges: PropTypes.bool,
  getPowerDetails: PropTypes.func.isRequired,
  handleViewDetails: PropTypes.func.isRequired,
  handleForceRemovePlubot: PropTypes.func.isRequired,
  requestDeletePlubot: PropTypes.func.isRequired,
  setEditModalPlubot: PropTypes.func.isRequired,
  deletingPlubotIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  unremovablePlubots: PropTypes.arrayOf(PropTypes.string).isRequired,
  showNotification: PropTypes.func.isRequired,
};

export default PlubotList;
