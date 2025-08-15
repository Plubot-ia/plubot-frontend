import PropTypes from 'prop-types';
import { memo } from 'react';

import usePlubotCard from '../hooks/usePlubotCard';

import DeletingOverlay from './DeletingOverlay';
import PlubotCardActions from './PlubotCardActions';
import PlubotCardDetails from './PlubotCardDetails';
import PlubotCardHeader from './PlubotCardHeader';

const PlubotCard = memo(
  ({
    plubot,
    index,
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
    const {
      plubotPowerTitles,
      plubotIcon,
      isDeleting,
      isUnremovable,
      cardClassName,
      cardStyle,
      handleEditClick,
    } = usePlubotCard({
      plubot,
      index,
      animateBadges,
      getPowerDetails,
      setEditModalPlubot,
      deletingPlubotIds,
      unremovablePlubots,
      showNotification,
    });

    return (
      <div className={cardClassName} style={cardStyle}>
        <DeletingOverlay isDeleting={isDeleting} />
        <PlubotCardHeader plubot={plubot} plubotIcon={plubotIcon} isUnremovable={isUnremovable} />
        <PlubotCardDetails plubot={plubot} plubotPowerTitles={plubotPowerTitles} />
        <PlubotCardActions
          plubot={plubot}
          isDeleting={isDeleting}
          isUnremovable={isUnremovable}
          handleEditClick={handleEditClick}
          handleViewDetails={handleViewDetails}
          handleForceRemovePlubot={handleForceRemovePlubot}
          requestDeletePlubot={requestDeletePlubot}
        />
      </div>
    );
  },
);

PlubotCard.displayName = 'PlubotCard';

PlubotCard.propTypes = {
  plubot: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
    tone: PropTypes.string,
    color: PropTypes.string,
    model: PropTypes.string,
    is_public: PropTypes.bool,
    powers: PropTypes.arrayOf(PropTypes.string),
    flows: PropTypes.arrayOf(PropTypes.object),
    edges: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  index: PropTypes.number.isRequired,
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

export default PlubotCard;
