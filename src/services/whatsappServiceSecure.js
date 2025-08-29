import io from 'socket.io-client';

class WhatsAppServiceSecure {
  constructor() {
    this.baseURL = import.meta.env.VITE_WHATSAPP_API_URL || 'http://localhost:3001';
    this.socket = null;
    this.token = null;
    this.apiKey = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with the service
   */
  async authenticate(credentials = null) {
    try {
      // Use API key if provided
      if (credentials?.apiKey) {
        this.apiKey = credentials.apiKey;
        this.token = null;
        return { success: true, type: 'apiKey' };
      }

      // Use JWT authentication
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials || {
          username: 'default_user',
          password: 'default_pass'
        })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      this.token = data.token;
      this.tokenExpiry = new Date(Date.now() + this.parseExpiry(data.expiresIn));
      
      // Store token in localStorage for persistence
      localStorage.setItem('whatsapp_jwt', this.token);
      localStorage.setItem('whatsapp_jwt_expiry', this.tokenExpiry.toISOString());

      return { success: true, type: 'jwt', expiresIn: data.expiresIn };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    } else if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Check if token needs refresh
   */
  async checkTokenExpiry() {
    if (!this.token || !this.tokenExpiry) return;

    const now = new Date();
    const timeUntilExpiry = this.tokenExpiry - now;
    
    // Refresh if less than 5 minutes until expiry
    if (timeUntilExpiry < 5 * 60 * 1000) {
      await this.refreshAuthToken();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshAuthToken() {
    try {
      // Re-authenticate for now (implement refresh endpoint later)
      await this.authenticate();
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid token
      this.token = null;
      localStorage.removeItem('whatsapp_jwt');
      localStorage.removeItem('whatsapp_jwt_expiry');
      throw error;
    }
  }

  /**
   * Initialize from stored credentials
   */
  async initializeAuth() {
    const storedToken = localStorage.getItem('whatsapp_jwt');
    const storedExpiry = localStorage.getItem('whatsapp_jwt_expiry');
    
    if (storedToken && storedExpiry) {
      this.token = storedToken;
      this.tokenExpiry = new Date(storedExpiry);
      
      // Check if token is still valid
      if (this.tokenExpiry > new Date()) {
        await this.checkTokenExpiry();
        return true;
      }
    }
    
    // No valid stored credentials, need to authenticate
    return false;
  }

  /**
   * Create WhatsApp session
   */
  async createSession(userId, plubotId, forceNew = false) {
    try {
      await this.checkTokenExpiry();
      
      const response = await fetch(`${this.baseURL}/api/sessions/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          userId,
          plubotId,
          forceNew
        })
      });

      if (response.status === 401) {
        await this.refreshAuthToken();
        return this.createSession(userId, plubotId, forceNew);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      const data = await response.json();
      console.log('Session created:', data);
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get QR code for session
   */
  async getQRCode(userId, plubotId) {
    try {
      await this.checkTokenExpiry();
      
      const response = await fetch(`${this.baseURL}/api/qr/${userId}/${plubotId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.status === 401) {
        await this.refreshAuthToken();
        return this.getQRCode(userId, plubotId);
      }

      if (response.status === 404) {
        return { success: false, error: 'QR code not found' };
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get QR code');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(sessionId) {
    try {
      await this.checkTokenExpiry();
      
      const response = await fetch(`${this.baseURL}/api/sessions/${sessionId}/status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.status === 401) {
        await this.refreshAuthToken();
        return this.getSessionStatus(sessionId);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get session status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting session status:', error);
      throw error;
    }
  }

  /**
   * Send message
   */
  async sendMessage(sessionId, to, message, type = 'text') {
    try {
      await this.checkTokenExpiry();
      
      const response = await fetch(`${this.baseURL}/api/messages/send`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          sessionId,
          to,
          message,
          type
        })
      });

      if (response.status === 401) {
        await this.refreshAuthToken();
        return this.sendMessage(sessionId, to, message, type);
      }

      if (response.status === 429) {
        const error = await response.json();
        throw new Error(`Rate limit exceeded. ${error.error}`);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Disconnect session
   */
  async disconnectSession(sessionId) {
    try {
      await this.checkTokenExpiry();
      
      const response = await fetch(`${this.baseURL}/api/sessions/${sessionId}/disconnect`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (response.status === 401) {
        await this.refreshAuthToken();
        return this.disconnectSession(sessionId);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disconnect session');
      }

      const data = await response.json();
      console.log('Session disconnected:', data);
      return data;
    } catch (error) {
      console.error('Error disconnecting session:', error);
      throw error;
    }
  }

  /**
   * Destroy session completely
   */
  async destroySession(sessionId) {
    try {
      await this.checkTokenExpiry();
      
      const response = await fetch(`${this.baseURL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (response.status === 401) {
        await this.refreshAuthToken();
        return this.destroySession(sessionId);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to destroy session');
      }

      const data = await response.json();
      console.log('Session destroyed:', data);
      return data;
    } catch (error) {
      console.error('Error destroying session:', error);
      throw error;
    }
  }

  /**
   * Initialize WebSocket connection
   */
  initializeWebSocket(sessionId) {
    if (this.socket) {
      this.socket.disconnect();
    }

    const auth = this.token ? { token: this.token } : {};
    const headers = this.apiKey ? { 'x-api-key': this.apiKey } : {};

    this.socket = io(this.baseURL, {
      auth,
      extraHeaders: headers,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      if (sessionId) {
        this.socket.emit('join-session', sessionId);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      if (error.message === 'Authentication required') {
        // Try to re-authenticate
        this.refreshAuthToken().then(() => {
          this.initializeWebSocket(sessionId);
        }).catch(err => {
          console.error('Failed to re-authenticate WebSocket:', err);
        });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    return this.socket;
  }

  /**
   * Subscribe to WebSocket events
   */
  onWebSocketEvent(event, callback) {
    if (!this.socket) {
      console.error('WebSocket not initialized');
      return;
    }
    this.socket.on(event, callback);
  }

  /**
   * Unsubscribe from WebSocket events
   */
  offWebSocketEvent(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    this.apiKey = null;
    this.tokenExpiry = null;
  }

  /**
   * Parse expiry time string
   */
  parseExpiry(expiresIn) {
    const match = expiresIn.match(/(\d+)([dhms])/);
    if (!match) return 24 * 60 * 60 * 1000; // Default 24 hours
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      case 's': return value * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      
      if (!response.ok) {
        throw new Error('Health check failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking health:', error);
      return { success: false, status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Get detailed health status (requires auth)
   */
  async getDetailedHealthStatus() {
    try {
      await this.checkTokenExpiry();
      
      const response = await fetch(`${this.baseURL}/health/detailed`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.status === 401) {
        await this.refreshAuthToken();
        return this.getDetailedHealthStatus();
      }

      if (!response.ok) {
        throw new Error('Detailed health check failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking detailed health:', error);
      throw error;
    }
  }
}

// Export singleton instance
const whatsappServiceSecure = new WhatsAppServiceSecure();
export default whatsappServiceSecure;
