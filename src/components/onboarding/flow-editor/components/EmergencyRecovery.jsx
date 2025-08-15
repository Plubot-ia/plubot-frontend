import PropTypes from 'prop-types';

import {
  emergencyRecoveryStyles,
  renderCloseButton,
  renderModalContent,
} from './EmergencyRecovery.helpers.jsx';

/**
 * Componente de recuperación de emergencia que muestra un modal cuando se le indica.
 * Controlado por props desde un componente padre (ej. TrainingScreen).
 */
const EmergencyRecovery = ({ isOpen, onRecover, onDismiss, hasBackup }) => {
  // La función handleRecovery ahora simplemente llama a la prop onRecover
  const handleRecovery = () => {
    if (onRecover) {
      onRecover();
    }
  };

  // La función handleClose ahora simplemente llama a la prop onDismiss
  const handleClose = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  // Si no está abierto o no hay backup, no renderizar nada.
  // TrainingScreen decidirá si mostrar este modal o uno para "empezar de nuevo".
  if (!isOpen || !hasBackup) {
    return;
  }

  return (
    <div style={emergencyRecoveryStyles.container}>
      {renderCloseButton(handleClose)}
      {renderModalContent(handleRecovery)}
    </div>
  );
};

EmergencyRecovery.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onRecover: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  hasBackup: PropTypes.bool.isRequired,
};

export default EmergencyRecovery;
