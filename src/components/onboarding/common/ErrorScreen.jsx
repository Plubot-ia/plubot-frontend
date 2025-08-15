import PropTypes from 'prop-types';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorScreen = ({ message }) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        background: 'rgba(20, 10, 10, 0.95)',
        color: '#ffc0c0',
      }}
    >
      <h2 style={{ color: '#ff6060' }}>Ha ocurrido un error</h2>
      <p style={{ maxWidth: '80%', margin: '1rem 0' }}>{message}</p>
      <button
        onClick={() => navigate('/profile')}
        style={{
          background: 'rgba(80, 0, 20, 0.8)',
          border: '2px solid #ff4040',
          padding: '0.8rem 1.5rem',
          fontSize: '1rem',
          color: '#ffd0d0',
          cursor: 'pointer',
        }}
      >
        ← Volver al Perfil
      </button>
    </div>
  );
};

ErrorScreen.propTypes = {
  message: PropTypes.string.isRequired,
};

export default ErrorScreen;
