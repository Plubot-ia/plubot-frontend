import React from 'react';

const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#0a0e2f',
      color: '#fff',
    }}
  >
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img src='/logo.svg' alt='Plubot Logo' style={{ width: '120px', height: 'auto' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          className='spinner'
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            borderTop: '4px solid #ffffff',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
      <style>
        {`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  </div>
);

export default LoadingFallback;
