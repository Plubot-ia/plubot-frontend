import React from 'react';

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
    return null;
  }

  return (
    <div
      style={{
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
      }}
    >
      <button
        onClick={handleClose} // Conectar al onDismiss general
        style={{
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
        }}
        aria-label="Cerrar"
      >
        &times;
      </button>
      <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>⚠️ ¡Alerta de Fusión de Quanta! ⚠️</div>
      <div>Se detectó una anomalía en la matriz de nodos. ¿Restaurar desde la última singularidad estable?</div>
      <button
        onClick={handleRecovery}
        style={{
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
        }}
        onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px #FF00FF, 0 0 5px #FFFFFF'}
        onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 0 10px #FF00FF'}
      >
        Recuperar Continuidad Nodal
      </button>
      {/* Podríamos añadir un botón "Empezar de Nuevo" aquí si quisiéramos que este modal maneje ambos casos
          pero por ahora, lo mantenemos simple y dejamos que TrainingScreen decida si mostrar este u otro mensaje/acción
          cuando no hay backup. El botón de cerrar (X) llamará a onDismiss. */}
    </div>
  );
};

export default EmergencyRecovery;
