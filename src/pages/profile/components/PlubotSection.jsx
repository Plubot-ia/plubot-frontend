import PropTypes from 'prop-types';
import React, { memo } from 'react';

import usePlubotSection from '../hooks/usePlubotSection';

import DeleteConfirmationModal from './DeleteConfirmationModal';
import PlubotList from './PlubotList';

const PlubotSection = memo(
  ({ animateBadges, setModalPlubot, setEditModalPlubot, showNotification, isLoading }) => {
    const {
      user,
      getPowerDetails,
      handleViewDetails,
      deletingPlubotIds,
      unremovablePlubots,
      deleteConfirmState,
      handleForceRemovePlubot,
      requestDeletePlubot,
      cancelDeletePlubot,
      confirmDeletePlubot,
    } = usePlubotSection({ setModalPlubot, showNotification });

    return (
      <div className='profile-section plubots-section'>
        <h3 className='plubots-section-title'>PLUBOTS CREADOS</h3>
        <div className='plubots-background' />

        <DeleteConfirmationModal
          isOpen={deleteConfirmState.isOpen}
          plubot={deleteConfirmState.plubot}
          onConfirm={confirmDeletePlubot}
          onCancel={cancelDeletePlubot}
        />

        <PlubotList
          user={user}
          isLoading={isLoading}
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
      </div>
    );
  },
);

PlubotSection.displayName = 'PlubotSection';

PlubotSection.propTypes = {
  animateBadges: PropTypes.bool,
  setModalPlubot: PropTypes.func.isRequired,
  setEditModalPlubot: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default PlubotSection;
