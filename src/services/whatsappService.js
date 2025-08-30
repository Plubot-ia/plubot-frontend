import axios from 'axios';
import { io } from 'socket.io-client';

// API_BASE_URL is defined in authService
const WHATSAPP_SERVICE_URL = import.meta.env.VITE_WHATSAPP_SERVICE_URL || 'http://localhost:3001';
const WHATSAPP_API_KEY = import.meta.env.VITE_WHATSAPP_API_KEY || 'dev-api-key-2024-secure';

class WhatsAppService {
  constructor() {
    this.baseURL = WHATSAPP_SERVICE_URL;
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

    // Socket initialization with authentication
    this.socket = io(WHATSAPP_SERVICE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: WHATSAPP_API_KEY, // Add authentication token
      },
    });

    // Listen for QR updates
    this.socket.on('connect', () => {
      console.log('[WhatsApp Service] WebSocket connected');
    });

    // Listen for QR updates from server
    this.socket.on('qr-update', (data) => {
      console.log('[WhatsApp Service] QR update received:', data);
      for (const callback of this.qrUpdateCallbacks) callback(data);
    });

    // Also listen for legacy 'qr' event
    this.socket.on('qr', (data) => {
      console.log('[WhatsApp Service] QR event received:', data);
      for (const callback of this.qrUpdateCallbacks) callback(data);
    });

    // Listen for authentication
    this.socket.on('session-authenticated', (data) => {
      console.log('[WhatsApp Service] Session authenticated event:', data);
      for (const callback of this.statusUpdateCallbacks)
        callback({
          status: 'authenticated',
          ...data,
        });
    });

    // Listen for session ready event
    this.socket.on('session-ready', (data) => {
      console.log('[WhatsApp Service] Session ready event:', data);
      for (const callback of this.statusUpdateCallbacks)
        callback({
          status: 'ready',
          ...data,
        });
    });

    // Listen for queue position updates
    this.socket.on('queue-position', (data) => {
      console.log('[WhatsApp Service] Queue position:', data);
      for (const callback of this.statusUpdateCallbacks)
        callback({
          status: 'queued',
          ...data,
        });
    });

    // Listen for session activation from queue
    this.socket.on('session-activated', (data) => {
      console.log('[WhatsApp Service] Session activated from queue:', data);
      for (const callback of this.statusUpdateCallbacks)
        callback({
          status: 'activated',
          ...data,
        });
    });

    // Listen for session disconnection
    this.socket.on('session-disconnected', (data) => {
      console.log('[WhatsApp Service] Session disconnected event:', data);
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
          'x-api-key': WHATSAPP_API_KEY,
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
          'x-api-key': WHATSAPP_API_KEY,
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
        'x-api-key': 'dev-api-key-2024-secure',
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
        'x-api-key': 'dev-api-key-2024-secure',
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
          'x-api-key': WHATSAPP_API_KEY,
        },
      });
      return response.data.qr;
    } catch {
      // Error getting QR
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
          'x-api-key': WHATSAPP_API_KEY,
        },
      },
    );
    return response.data;
  }

  /**
   * Subscribe to QR updates for a specific session
   */
  subscribeToQRUpdates(userId, plubotId, callback) {
    if (!this.socket) {
      this.initializeSocket();
    }

    const roomId = `qr-${userId}:${plubotId}`;
    console.log('[WhatsApp Service] Joining room:', roomId);
    this.socket.emit('join-room', roomId);

    this.qrUpdateCallbacks.add(callback);
    return () => {
      this.qrUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Unsubscribe from QR updates
   */
  unsubscribeFromQRUpdates(callback) {
    this.qrUpdateCallbacks.delete(callback);
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
   * Refresh QR code for a session
   */
  async refreshQR(userId, plubotId) {
    try {
      const sessionId = `${userId}-${plubotId}`;
      const response = await axios.post(
        `${this.baseURL}/api/sessions/${sessionId}/refresh-qr`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'dev-api-key-2024-secure',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('[WhatsAppService] Error refreshing QR:', error);
      throw error;
    }
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
   * Unsubscribe from status updates
   */
  offStatusUpdate(callback) {
    this.statusUpdateCallbacks.delete(callback);
  }

  /**
   * Subscribe to all status updates with multiple callbacks
   */
  subscribeToStatusUpdates(callbacks) {
    const { sessionId } = callbacks;

    // Subscribe to socket events
    if (!this.socket) {
      this.initializeSocket();
    }

    // Subscribe to session room if sessionId provided
    if (sessionId) {
      console.log('[WhatsApp Service] Subscribing to session:', sessionId);
      // Use the correct event name that backend expects
      this.socket.emit('join-session', sessionId);
      this.socket.emit('subscribe:session', sessionId); // Also emit legacy event for compatibility
    }

    // QR updates
    const qrHandler = (data) => {
      console.log('[WhatsApp Service] QR update handler:', data);
      if (callbacks.onQRUpdate) {
        callbacks.onQRUpdate(data);
      }
    };
    this.socket.on('qr-update', qrHandler);
    this.socket.on('qr', qrHandler); // Also listen for legacy event

    // Session authenticated
    const authHandler = (data) => {
      console.log('[WhatsApp Service] Auth handler:', data);
      if (callbacks.onAuthenticated) {
        callbacks.onAuthenticated(data);
      }
    };
    this.socket.on('session-authenticated', authHandler);

    // Session ready
    const readyHandler = (data) => {
      console.log('[WhatsApp Service] Ready handler:', data);
      if (callbacks.onReady) {
        callbacks.onReady(data);
      }
    };
    this.socket.on('session-ready', readyHandler);

    // Session disconnected
    const disconnectHandler = (data) => {
      console.log('[WhatsApp Service] Disconnect handler:', data);
      if (callbacks.onDisconnected) {
        callbacks.onDisconnected(data);
      }
    };
    this.socket.on('disconnected', disconnectHandler);
    this.socket.on('session-disconnected', disconnectHandler);

    // Return cleanup function
    return () => {
      console.log('[WhatsApp Service] Unsubscribing from session:', sessionId);
      if (sessionId) {
        this.socket.emit('unsubscribe:session', sessionId);
      }
      this.socket.off('qr-update', qrHandler);
      this.socket.off('qr', qrHandler);
      this.socket.off('session-authenticated', authHandler);
      this.socket.off('session-ready', readyHandler);
      this.socket.off('disconnected', disconnectHandler);
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
          'x-api-key': WHATSAPP_API_KEY,
        },
      },
    );
    return response.data;
  }

  /**
   * Create a new WhatsApp session
   */
  async createSession(sessionIdOrUserId, plubotId, forceNew = false) {
    // Handle both sessionId string and userId/plubotId params
    let userId, finalPlubotId;

    if (typeof plubotId === 'boolean') {
      // Called with sessionId and forceNew flag
      const parts = sessionIdOrUserId.split('-');
      [userId] = parts;
      finalPlubotId = parts.slice(1).join('-');
      forceNew = plubotId; // plubotId is actually forceNew in this case
    } else if (plubotId) {
      // Called with userId and plubotId
      userId = sessionIdOrUserId;
      finalPlubotId = plubotId;
    } else {
      // Called with sessionId string
      const parts = sessionIdOrUserId.split('-');
      [userId] = parts;
      finalPlubotId = parts.slice(1).join('-');
    }

    try {
      console.log('[WhatsApp Service] Creating session:', {
        userId,
        plubotId: finalPlubotId,
        forceNew,
        url: WHATSAPP_SERVICE_URL,
      });

      const response = await axios.post(
        `${WHATSAPP_SERVICE_URL}/api/sessions/create`,
        {
          userId,
          plubotId: finalPlubotId,
          forceNew,
        },
        {
          headers: {
            'x-api-key': WHATSAPP_API_KEY,
          },
        },
      );

      // If session is already connected but no QR, force recreate
      if (response.data.status === 'connected' && !response.data.qr && !forceNew) {
        console.log('Session connected but no QR, forcing recreation...');

        // Retry with forceNew flag
        const newResponse = await axios.post(
          `${WHATSAPP_SERVICE_URL}/api/sessions/create`,
          {
            userId,
            plubotId: finalPlubotId,
            forceNew: true,
          },
          {
            headers: {
              'x-api-key': WHATSAPP_API_KEY,
            },
          },
        );

        return newResponse.data;
      }

      return response.data;
    } catch (error) {
      console.error('[WhatsApp Service] Error creating session:', error);
      throw error;
    }
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
          'x-api-key': WHATSAPP_API_KEY,
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
