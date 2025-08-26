// Helper functions for WhatsApp QR Panel

export const generateStatusMessage = (status) => {
  switch (status) {
    case 'initializing': {
      return 'Inicializando...';
    }
    case 'waiting_qr': {
      return 'Esperando escaneo...';
    }
    case 'scanning': {
      return 'Escaneando...';
    }
    case 'authenticated': {
      return 'Autenticado';
    }
    case 'ready': {
      return 'Conectado';
    }
    case 'disconnected': {
      return 'Desconectado';
    }
    case 'error': {
      return 'Error de conexión';
    }
    default: {
      return 'Inicializando...';
    }
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'initializing': {
      return 'blue';
    }
    case 'waiting_qr': {
      return 'blue';
    }
    case 'scanning': {
      return 'blue';
    }
    case 'authenticated': {
      return 'green';
    }
    case 'ready': {
      return 'green';
    }
    case 'disconnected': {
      return 'gray';
    }
    case 'error': {
      return 'red';
    }
    default: {
      return 'red';
    }
  }
};

export const isQRExpired = (_qrCode) => {
  // TO DO: implement QR expiration logic
  return false;
};

export const formatPhoneNumber = (phoneNumber) => {
  // TO DO: implement phone number formatting logic
  return phoneNumber;
};
