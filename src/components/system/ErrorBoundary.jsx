import PropTypes from 'prop-types';
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  // eslint-disable-next-line sonarjs/public-static-readonly
  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  constructor(properties) {
    super(properties);
    this.state = { hasError: false };
  }

  componentDidCatch(_error, _errorInfo) {
    // Se puede registrar el error en un servicio de monitoreo
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: 'white',
          }}
        >
          <h2>¡Ups! Algo salió mal.</h2>
          <p>Por favor, recarga la página o inténtalo de nuevo más tarde.</p>
          <button
            onClick={() => globalThis.location.reload()}
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
