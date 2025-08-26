import axios from 'axios';
import { io } from 'socket.io-client';

// API_BASE_URL is defined in authService
const WHATSAPP_SERVICE_URL = import.meta.env.VITE_WHATSAPP_SERVICE_URL || 'http://localhost:3001';

class WhatsAppService {
  constructor() {
    this.socket = undefined;
    this.qrUpdateCallbacks = new Set();
    this.statusUpdateCallbacks = new Set();
  }

  /**
   * Initialize WebSocket connection for real-time QR updates
   */
  initializeSocket() {
    if (this.socket) {
      return this.socket;
    }

    console.log(`🌐 Initializing WebSocket connection to: ${WHATSAPP_SERVICE_URL}`);
    this.socket = io(WHATSAPP_SERVICE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Listen for QR updates
    this.socket.on('connect', () => {
      console.log('✅ Connected to WhatsApp service with socket ID:', this.socket.id);
    });

    this.socket.on('qr-update', (data) => {
      console.log('Socket: QR update received', data);
      for (const callback of this.qrUpdateCallbacks) callback(data);
    });

    // Listen for authentication
    this.socket.on('session-authenticated', (data) => {
      console.log('🔐 Global authentication event received:', data);
      for (const callback of this.statusUpdateCallbacks)
        callback({
          status: 'authenticated',
          ...data,
        });
    });

    // Listen for ready status
    this.socket.on('session-ready', (data) => {
      console.log('✅ Global ready event received:', data);
      for (const callback of this.statusUpdateCallbacks)
        callback({
          status: 'ready',
          ...data,
        });
    });

    // Listen for disconnection
    // WhatsApp session disconnected
    this.socket.on('disconnected', (data) => {
      for (const callback of this.statusUpdateCallbacks)
        callback({
          status: 'disconnected',
          ...data,
        });
    });

    // Listen for auth failure
    this.socket.on('auth-failed', (data) => {
      for (const callback of this.statusUpdateCallbacks)
        callback({
          status: 'auth_failed',
          ...data,
        });
    });

    return this.socket;
  }

  initSocket() {
    return this.initializeSocket();
  }

  /**
   * Start WhatsApp QR session
   */
  async startQRSession(userId, plubotId, token) {
    const response = await axios.post(
      `${WHATSAPP_SERVICE_URL}/api/sessions/create`,
      {
        userId,
        plubotId,
      },
      {
        headers: {
          'x-api-key': 'internal-api-key',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    );
    return response.data;
  }

  /**
   * Check WhatsApp session status
   */
  async checkSession(plubotId, _token) {
    const userId = localStorage.getItem('userId');
    const response = await this.initializeSession(userId, plubotId, _token);
    return response.data;
  }

  async initializeSession(userId, plubotId, token) {
    const response = await axios.post(
      `${WHATSAPP_SERVICE_URL}/api/sessions/initialize`,
      {
        userId,
        plubotId,
      },
      {
        headers: {
          'x-api-key': 'internal-api-key',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    );
    return response.data;
  }

  /**
   * Get current QR session status
   */
  async getQRStatus(userId, plubotId, _token) {
    const response = await axios.get(`${WHATSAPP_SERVICE_URL}/api/sessions/${userId}/${plubotId}`, {
      headers: {
        'x-api-key': 'internal-api-key',
      },
    });
    return response.data;
  }

  /**
   * Get QR code for session
   */
  async getQRCode(userId, plubotId) {
    const response = await axios.get(`${WHATSAPP_SERVICE_URL}/api/qr/${userId}/${plubotId}`, {
      headers: {
        'x-api-key': 'internal-api-key',
      },
    });
    return response.data;
  }

  /**
   * Get QR code by sessionId
   */
  async getQR(sessionId) {
    try {
      const response = await axios.get(`${WHATSAPP_SERVICE_URL}/api/qr/${sessionId}`, {
        headers: {
          'x-api-key': 'internal-api-key',
        },
      });
      return response.data.qr;
    } catch (error) {
      console.error('Error getting QR:', error);
      return null;
    }
  }

  /**
   * Disconnect WhatsApp session
   */
  async disconnectSession(userId, plubotId) {
    const sessionId = `${userId}-${plubotId}`;
    const response = await axios.post(
      `${WHATSAPP_SERVICE_URL}/api/sessions/${sessionId}/disconnect`,
      {},
      {
        headers: {
          'x-api-key': 'internal-api-key',
        },
      },
    );
    return response.data;
  }

  /**
   * Subscribe to QR updates
   */
  onQRUpdate(callback) {
    this.qrUpdateCallbacks.add(callback);
    return () => {
      this.qrUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to status updates
   */
  onStatusUpdate(callback) {
    this.statusUpdateCallbacks.add(callback);
    return () => {
      this.statusUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to all status updates with multiple callbacks
   */
  subscribeToStatusUpdates(callbacks) {
    const sessionId = callbacks.sessionId;
    const unsubscribers = [];

    // Subscribe to socket events
    if (!this.socket) {
      this.initializeSocket();
    }

    // Subscribe to QR room if sessionId provided
    if (sessionId) {
      // Parse sessionId to get userId and plubotId
      const parts = sessionId.split('-');
      const plubotId = parts.pop(); // Last part is plubotId
      const userId = parts.join('-'); // Rest is userId
      
      console.log('Subscribing to QR updates:', { userId, plubotId, sessionId });
      this.socket.emit('subscribe-qr', { userId, plubotId });
    }

    // QR updates
    const qrHandler = (data) => {
      console.log('Socket: QR update received', data);
      if (callbacks.onQRUpdate) {
        callbacks.onQRUpdate(data);
      }
    };
    this.socket.on('qr-update', qrHandler);

    // QR limit reached
    const qrLimitHandler = (data) => {
      console.log('Socket: QR limit reached', data);
      if (callbacks.onQRLimitReached) {
        callbacks.onQRLimitReached(data);
      }
    };
    this.socket.on('qr-limit-reached', qrLimitHandler);

    // Session authenticated
    const authHandler = (data) => {
      console.log('Socket: Session authenticated', data);
      if (callbacks.onStatusUpdate) {
        callbacks.onStatusUpdate({ status: 'authenticated', ...data });
      }
    };
    this.socket.on('session-authenticated', authHandler);

    // Session ready
    const readyHandler = (data) => {
      console.log('Socket: Session ready', data);
      if (callbacks.onStatusUpdate) {
        callbacks.onStatusUpdate({ status: 'ready', ...data });
      }
    };
    this.socket.on('session-ready', readyHandler);

    // Disconnected
    const disconnectHandler = (data) => {
      console.log('Socket: Disconnected', data);
      if (callbacks.onStatusUpdate) {
        callbacks.onStatusUpdate({ status: 'disconnected', ...data });
      }
    };
    this.socket.on('disconnected', disconnectHandler);

    // Auth failed
    const authFailHandler = (data) => {
      console.log('Socket: Auth failed', data);
      if (callbacks.onAuthFailed) {
        callbacks.onAuthFailed(data);
      }
      if (callbacks.onStatusUpdate) {
        callbacks.onStatusUpdate({ status: 'auth_failed', ...data });
      }
    };
    this.socket.on('auth-failed', authFailHandler);

    // Return cleanup function
    return () => {
      this.socket.off('qr-update', qrHandler);
      this.socket.off('qr-limit-reached', qrLimitHandler);
      this.socket.off('session-authenticated', authHandler);
      this.socket.off('session-ready', readyHandler);
      this.socket.off('disconnected', disconnectHandler);
      this.socket.off('auth-failed', authFailHandler);
      if (sessionId) {
        this.socket.emit('unsubscribe-qr', sessionId);
      }
    };
  }

  /**
   * Logout WhatsApp session (full logout from WhatsApp Web)
   */
  async logoutSession(userId, plubotId) {
    const sessionId = `${userId}-${plubotId}`;
    const response = await axios.post(
      `${WHATSAPP_SERVICE_URL}/api/sessions/${sessionId}/logout`,
      {},
      {
        headers: {
          'x-api-key': 'internal-api-key',
        },
      },
    );
    return response.data;
  }

  /**
   * Create a new WhatsApp session
   */
  async createSession(sessionIdOrUserId, plubotId) {
    // Handle both sessionId string and userId/plubotId params
    let userId, finalPlubotId;
    
    if (plubotId) {
      // Called with userId and plubotId
      userId = sessionIdOrUserId;
      finalPlubotId = plubotId;
    } else {
      // Called with sessionId string
      const parts = sessionIdOrUserId.split('-');
      userId = parts[0];
      finalPlubotId = parts.slice(1).join('-');
    }
    
    const response = await axios.post(
      `${WHATSAPP_SERVICE_URL}/api/sessions/create`,
      {
        userId,
        plubotId: finalPlubotId,
      },
      {
        headers: {
          'x-api-key': 'internal-api-key',
        },
      },
    );
    return response.data;
  }

  /**
   * Destroy WhatsApp session
   */
  async destroySession(sessionIdOrUserId, plubotId) {
    // Handle both sessionId string and userId/plubotId params
    let sessionId;
    
    if (plubotId) {
      // Called with userId and plubotId
      sessionId = `${sessionIdOrUserId}-${plubotId}`;
    } else {
      // Called with sessionId string
      sessionId = sessionIdOrUserId;
    }
    
    const response = await axios.delete(
      `${WHATSAPP_SERVICE_URL}/api/sessions/${sessionId}`,
      {
        headers: {
          'x-api-key': 'internal-api-key',
        },
      },
    );
    return response.data;
  }

  /**
   * Sync flow data with WhatsApp session
   */
  async syncFlowData(_userId, _plubotId, flowData) {
    const response = await axios.post(
      `${WHATSAPP_SERVICE_URL}/api/flow/sync`,
      {
        userId: localStorage.getItem('userId') || 'guest',
        plubotId: localStorage.getItem('plubotId') || 'default',
        flowData,
      },
      {
        headers: {
          'x-api-key': 'internal-api-key',
        },
      },
    );
    return response.data;
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
    this.qrUpdateCallbacks.clear();
    this.statusUpdateCallbacks.clear();
  }
}

const whatsappServiceInstance = new WhatsAppService();
export default whatsappServiceInstance;
