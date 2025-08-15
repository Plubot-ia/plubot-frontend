import { useMemo, useCallback } from 'react';

const getCardClassName = ({ animateBadges, plubot, isDeleting, isUnremovable }) => {
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
  borderColor: plubot.color ?? undefined,
  animationDelay: `${index * 150}ms`,
  opacity: isDeleting ? 0.6 : 1,
  position: 'relative',
});

const usePlubotCard = ({
  plubot,
  index,
  animateBadges,
  getPowerDetails,
  setEditModalPlubot,
  deletingPlubotIds,
  unremovablePlubots,
  showNotification,
}) => {
  const plubotPowers = useMemo(
    () => (Array.isArray(plubot.powers) ? plubot.powers.filter(Boolean) : []),
    [plubot.powers],
  );

  const plubotPowerTitles = useMemo(
    () => plubotPowers.map((powerId) => getPowerDetails(powerId).title).join(', ') || 'Ninguno',
    [plubotPowers, getPowerDetails],
  );

  const plubotIcon = useMemo(
    () => (plubotPowers.length > 0 ? getPowerDetails(plubotPowers[0]).icon : '🤖'),
    [plubotPowers, getPowerDetails],
  );

  const isDeleting = useMemo(
    () => deletingPlubotIds.includes(plubot.id),
    [deletingPlubotIds, plubot.id],
  );

  const isUnremovable = useMemo(
    () => unremovablePlubots.includes(plubot.id),
    [unremovablePlubots, plubot.id],
  );

  const cardClassName = useMemo(
    () => getCardClassName({ animateBadges, plubot, isDeleting, isUnremovable }),
    [animateBadges, plubot, isDeleting, isUnremovable],
  );

  const cardStyle = useMemo(
    () => getCardStyle({ plubot, index, isDeleting }),
    [plubot, index, isDeleting],
  );

  const handleEditClick = useCallback(() => {
    if (!plubot || !plubot.id) {
      showNotification('Error: Plubot no válido.', 'error');
      return;
    }
    setEditModalPlubot(plubot);
  }, [plubot, setEditModalPlubot, showNotification]);

  return {
    plubotPowerTitles,
    plubotIcon,
    isDeleting,
    isUnremovable,
    cardClassName,
    cardStyle,
    handleEditClick,
  };
};

export default usePlubotCard;
