import PropTypes from 'prop-types';
import { memo, useCallback } from 'react';

const getCardClassName = ({
  animateBadges,
  plubot,
  isDeleting,
  isUnremovable,
}) => {
  const classes = ['plubot-card'];
  if (animateBadges) classes.push('animate-in');
  if (!plubot.color) classes.push('plubot-card-fallback');
  if (isDeleting) classes.push('deleting');
  if (isUnremovable) classes.push('unremovable');
  return classes.join(' ');
};

const getCardStyle = ({ plubot, index, isDeleting }) => ({
  background: plubot.color
    ? `linear-gradient(135deg, ${plubot.color}40, rgba(0, 40, 80, 0.8))`
    : undefined,
  borderColor: plubot.color || undefined,
  animationDelay: `${index * 150}ms`,
  opacity: isDeleting ? 0.6 : 1,
  position: 'relative',
});

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
    const plubotPowers = Array.isArray(plubot.powers)
      ? plubot.powers.filter(Boolean)
      : [];
    const plubotPowerTitles =
      plubotPowers
        .map((powerId) => getPowerDetails(powerId).title)
        .join(', ') || 'Ninguno';
    const plubotIcon =
      plubotPowers.length > 0 ? getPowerDetails(plubotPowers[0]).icon : '🤖';

    const isDeleting = deletingPlubotIds.includes(plubot.id);
    const isUnremovable = unremovablePlubots.includes(plubot.id);

    const cardClassName = getCardClassName({
      animateBadges,
      plubot,
      isDeleting,
      isUnremovable,
    });
    const cardStyle = getCardStyle({ plubot, index, isDeleting });

    const handleEditClick = useCallback(() => {
      if (!plubot || !plubot.id) {
        showNotification('Error: Plubot no válido.', 'error');
        return;
      }
      setEditModalPlubot(plubot);
    }, [plubot, setEditModalPlubot, showNotification]);

    return (
      <div className={cardClassName} style={cardStyle}>
        {isDeleting && (
          <div
            className='deleting-overlay'
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 10,
              borderRadius: 'inherit',
            }}
          >
            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>
              Eliminando...
            </span>
          </div>
        )}

        <div className='plubot-icon-container'>
          <div className='plubot-icon'>{plubotIcon}</div>
        </div>

        <h4 className='plubot-name'>
          {plubot.name || 'Plubot'}
          {isUnremovable && (
            <span
              title='Este Plubot no existe en el servidor pero aparece en la interfaz'
              style={{ color: '#ff9800' }}
            >
              {' '}
              (Fantasma)
            </span>
          )}
        </h4>

        <div className='plubot-detail'>
          Personalidad: {plubot.tone || 'N/A'}
        </div>
        <div className='plubot-powers'>
          <div className='plubot-detail'>
            <strong>Poderes:</strong> {plubotPowerTitles}
          </div>
        </div>
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
