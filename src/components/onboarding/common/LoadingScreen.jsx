import React from 'react';

const loadingSpinnerStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingScreen = () => (
  <>
    <style>{loadingSpinnerStyles}</style>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'rgba(10, 20, 35, 0.95)',
      }}
    >
      <div
        style={{
          width: '50px',
          height: '50px',
          border: '5px solid rgba(0, 224, 255, 0.3)',
          borderTop: '5px solid #00e0ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ marginTop: '20px', color: '#00e0ff' }}>Cargando editor de flujos...</p>
    </div>
  </>
);

export default LoadingScreen;
