import PropTypes from 'prop-types';

const DeleteConfirmationModal = ({ isOpen, plubot, onConfirm, onCancel }) => {
  if (!isOpen || !plubot) {
    // eslint-disable-next-line unicorn/no-null
    return null; // Retornar null es idiomático en React para no renderizar.
  }

  // Styles for Delete Confirmation Modal
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10_000,
  };

  const modalContentStyle = {
    backgroundColor: '#1a2035',
    color: '#00e0ff',
    padding: '30px',
    borderRadius: '10px',
    border: '1px solid #ff00ff',
    textAlign: 'center',
    boxShadow: '0 0 20px rgba(255,0,255,0.5)',
    maxWidth: '400px',
  };

  const modalTitleStyle = {
    marginTop: 0,
    color: '#ff00ff',
    fontSize: '1.5em',
  };
  const modalStrongStyle = { color: '#ff00ff' };
  const modalTextStyle = { fontSize: '1.1em' };
  const modalButtonContainerStyle = { marginTop: '25px' };

  const modalButtonStyle = {
    cursor: 'pointer',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '12px 25px',
    borderRadius: '5px',
  };

  const confirmButtonStyle = {
    ...modalButtonStyle,
    backgroundColor: '#ff00ff',
    color: 'white',
    border: '1px solid #00e0ff',
    marginRight: '15px',
  };

  const cancelButtonStyle = {
    ...modalButtonStyle,
    backgroundColor: 'transparent',
    color: '#00e0ff',
    border: '1px solid #00e0ff',
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3 style={modalTitleStyle}>Confirmar Desintegración Quántica</h3>
        <p style={modalTextStyle}>
          Estás a punto de enviar al Plubot <strong style={modalStrongStyle}>{plubot.name}</strong>{' '}
          al vacío.
        </p>
        <p>Esta acción es irreversible y su rastro de Quanta se perderá para siempre.</p>
        <div style={modalButtonContainerStyle}>
          <button onClick={onConfirm} style={confirmButtonStyle}>
            Confirmar Desintegración
          </button>
          <button onClick={onCancel} style={cancelButtonStyle}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  plubot: PropTypes.shape({
    name: PropTypes.string,
  }),
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default DeleteConfirmationModal;
