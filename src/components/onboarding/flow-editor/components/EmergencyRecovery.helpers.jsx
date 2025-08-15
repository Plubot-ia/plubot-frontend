/**
 * Estilos para el componente EmergencyRecovery
 */
export const emergencyRecoveryStyles = {
  container: {
    position: 'absolute',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(10, 20, 40, 0.9)', // Dark blueish tech background
    color: '#00FFFF', // Cyan text
    padding: '15px 25px',
    borderRadius: '10px',
    border: '1px solid #FF00FF', // Magenta border
    boxShadow: '0 0 15px rgba(255, 0, 255, 0.7), 0 0 20px rgba(0, 255, 255, 0.5) inset', // Magenta outer glow, Cyan inner glow
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    fontFamily: '"Orbitron", sans-serif', // Techy font (ensure it's imported or available)
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: '8px',
    right: '10px',
    background: 'transparent',
    border: 'none',
    color: '#00FFFF', // Cyan
    fontSize: '24px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '0',
    lineHeight: '1',
  },
  title: {
    fontSize: '1.1em',
    fontWeight: 'bold',
  },
  recoveryButton: {
    backgroundColor: '#FF00FF', // Magenta button
    color: 'white',
    border: '1px solid #00FFFF', // Cyan border
    padding: '10px 20px',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    boxShadow: '0 0 10px #FF00FF',
    transition: 'all 0.3s ease',
  },
};

/**
 * Handlers para efectos de botones
 */
export const buttonHandlers = {
  handleButtonFocus: (event) => {
    event.currentTarget.style.boxShadow = '0 0 15px #FF00FF, 0 0 5px #FFFFFF';
  },
  handleButtonBlur: (event) => {
    event.currentTarget.style.boxShadow = '0 0 10px #FF00FF';
  },
};

/**
 * Renderiza el botón de cerrar
 */
export const renderCloseButton = (handleClose) => (
  <button onClick={handleClose} style={emergencyRecoveryStyles.closeButton} aria-label='Cerrar'>
    &times;
  </button>
);

/**
 * Renderiza el contenido del modal
 */
export const renderModalContent = (handleRecovery) => (
  <>
    <div style={emergencyRecoveryStyles.title}>⚠️ ¡Alerta de Fusión de Quanta! ⚠️</div>
    <div>
      Se detectó una anomalía en la matriz de nodos. ¿Restaurar desde la última singularidad
      estable?
    </div>
    <button
      onClick={handleRecovery}
      style={emergencyRecoveryStyles.recoveryButton}
      onMouseOver={buttonHandlers.handleButtonFocus}
      onFocus={buttonHandlers.handleButtonFocus}
      onMouseOut={buttonHandlers.handleButtonBlur}
      onBlur={buttonHandlers.handleButtonBlur}
    >
      Recuperar Continuidad Nodal
    </button>
  </>
);
