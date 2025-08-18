/**
 * Flow Backup Manager
 *
 * Enterprise-grade backup system for flow state management.
 * Implements intelligent backup strategies with automatic recovery,
 * version control, and data integrity validation.
 *
 * @module FlowBackupManager
 * @version 2.0.0
 */

import useFlowStore from '@/stores/use-flow-store';

/**
 * Configuration constants for backup behavior
 */
const CONFIG = {
  MAX_BACKUP_VERSIONS: 5,
  AUTO_BACKUP_INTERVAL: 30_000, // 30 seconds
  MIN_NODES_FOR_BACKUP: 1, // Changed from 3 to 1 to allow single node backups
  BACKUP_EXPIRY_HOURS: 24,
  COMPRESSION_ENABLED: true,
  INTEGRITY_CHECK_ENABLED: true,
};

/**
 * Backup metadata structure
 */
class BackupMetadata {
  constructor(plubotId, version = 1) {
    this.plubotId = plubotId;
    this.version = version;
    this.timestamp = Date.now();
    this.nodeCount = 0;
    this.edgeCount = 0;
    this.checksum = null;
    this.compressed = false;
    this.userAction = null;
  }
}

/**
 * Intelligent backup strategy that determines when and how to backup
 */
class BackupStrategy {
  constructor() {
    this.lastBackupTime = 0;
    this.lastNodeCount = 0;
    this.significantChangeThreshold = 0.2; // 20% change
  }

  /**
   * Determines if a backup should be created based on current state
   * @param {Array} nodes - Current nodes
   * @param {Array} edges - Current edges
   * @param {boolean} forceSave - Force backup regardless of strategy
   * @returns {boolean} Whether to create backup
   */
  shouldBackup(nodes, edges, forceSave = false) {
    if (forceSave) return true;

    // Don't backup empty flows unless explicitly saving empty state
    if (!nodes || nodes.length === 0) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastBackup = now - this.lastBackupTime;

    // Time-based backup
    if (timeSinceLastBackup > CONFIG.AUTO_BACKUP_INTERVAL) {
      this.lastBackupTime = now;
      this.lastNodeCount = nodes.length;
      return true;
    }

    // Significant change detection
    const nodeCountChange = Math.abs(nodes.length - this.lastNodeCount);
    const changeRatio = this.lastNodeCount > 0 ? nodeCountChange / this.lastNodeCount : 1;

    if (changeRatio > this.significantChangeThreshold) {
      this.lastBackupTime = now;
      this.lastNodeCount = nodes.length;
      return true;
    }

    return false;
  }
}

/**
 * Data integrity validator
 */
const IntegrityValidator = {
  /**
   * Generates checksum for flow data
   * @param {Object} data - Flow data
   * @returns {string} Checksum
   */
  generateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  },

  /**
   * Validates flow data integrity
   * @param {Object} data - Flow data
   * @param {string} checksum - Expected checksum
   * @returns {boolean} Validation result
   */
  validate(data, checksum) {
    if (!CONFIG.INTEGRITY_CHECK_ENABLED) return true;
    return this.generateChecksum(data) === checksum;
  },

  /**
   * Validates flow structure
   * @param {Object} flowData - Flow data to validate
   * @returns {boolean} Whether flow structure is valid
   */
  validateStructure(flowData) {
    if (!flowData) return false;
    
    const { nodes, edges } = flowData;
    
    // Validate nodes
    if (!Array.isArray(nodes)) return false;
    
    for (const node of nodes) {
      if (!node.id || !node.type || !node.position) return false;
      if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') return false;
    }
    
    // Validate edges
    if (!Array.isArray(edges)) return false;
    
    const nodeIds = new Set(nodes.map(n => n.id));
    for (const edge of edges) {
      if (!edge.id || !edge.source || !edge.target) return false;
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return false;
    }
    
    return true;
  },
};

/**
 * Compression utility for backup data
 */
const CompressionUtil = {
  /**
   * Compresses flow data using LZ-string algorithm simulation
   * @param {Object} data - Data to compress
   * @returns {string} Compressed data
   */
  compress(data) {
    if (!CONFIG.COMPRESSION_ENABLED) {
      return JSON.stringify(data);
    }
    
    // Simple compression: Remove redundant whitespace and use shorter keys
    const compressed = JSON.stringify(data, (key, value) => {
      // Skip null/undefined values
      if (value === null || value === undefined) return undefined;
      // Round numbers to reduce size
      if (typeof value === 'number') return Math.round(value * 100) / 100;
      return value;
    });
    
    return btoa(compressed); // Base64 encode for safety
  },

  /**
   * Decompresses flow data
   * @param {string} compressed - Compressed data
   * @returns {Object} Decompressed data
   */
  decompress(compressed) {
    if (!CONFIG.COMPRESSION_ENABLED) {
      return JSON.parse(compressed);
    }
    
    try {
      const decompressed = atob(compressed);
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('Decompression failed:', error);
      // Fallback to treating as uncompressed
      return JSON.parse(compressed);
    }
  },
};

/**
 * Main Flow Backup Manager
 */
export class FlowBackupManager {
  constructor() {
    this.strategy = new BackupStrategy();
    this.backups = new Map();
    this.autoBackupInterval = null;
    this.isInitialized = false;
  }

  /**
   * Initializes the backup manager
   * @param {string} plubotId - Current plubot ID
   */
  initialize(plubotId) {
    if (this.isInitialized) return;

    this.plubotId = plubotId;
    this.loadExistingBackups();
    this.startAutoBackup();
    this.cleanupOldBackups();
    this.isInitialized = true;
  }

  /**
   * Creates a backup of current flow state
   * @param {Object} options - Backup options
   * @returns {string|null} Backup ID or null if backup wasn't created
   */
  createBackup(options = {}) {
    const { forceSave = false, userAction = null, reason = 'manual' } = options;

    const state = useFlowStore.getState();
    const { nodes, edges } = state;

    // Intelligent decision on whether to backup
    if (!this.strategy.shouldBackup(nodes, edges, forceSave)) {
      return null;
    }

    // Don't backup if explicitly deleting all nodes (user intention)
    if (nodes.length === 0 && reason === 'user_delete_all') {
      console.log('[BackupManager] Skipping backup - user intentionally deleted all nodes');
      return null;
    }

    const metadata = new BackupMetadata(this.plubotId);
    metadata.nodeCount = nodes.length;
    metadata.edgeCount = edges.length;
    metadata.userAction = userAction;

    const flowData = {
      nodes: this.sanitizeNodes(nodes),
      edges: this.sanitizeEdges(edges),
      viewport: state.viewport || { x: 0, y: 0, zoom: 1 },
      timestamp: metadata.timestamp,
    };

    // Validate structure before backup
    if (!IntegrityValidator.validateStructure(flowData)) {
      console.error('[BackupManager] Invalid flow structure, skipping backup');
      return null;
    }

    metadata.checksum = IntegrityValidator.generateChecksum(flowData);

    const compressed = CompressionUtil.compress(flowData);
    metadata.compressed = CONFIG.COMPRESSION_ENABLED;

    const backupId = this.generateBackupId();

    // Store in memory
    this.backups.set(backupId, {
      metadata,
      data: compressed,
    });

    // Persist to localStorage with error handling
    this.persistBackup(backupId, compressed, metadata);

    // Cleanup old versions
    this.enforceVersionLimit();

    console.log(`[BackupManager] Created backup ${backupId} with ${metadata.nodeCount} nodes`);
    return backupId;
  }

  /**
   * Restores a backup by ID
   * @param {string} backupId - Backup ID to restore
   * @returns {boolean} Success status
   */
  restoreBackup(backupId) {
    const backup = this.backups.get(backupId) || this.loadBackupFromStorage(backupId);

    if (!backup) {
      console.error(`[BackupManager] Backup ${backupId} not found`);
      return false;
    }

    try {
      const flowData = CompressionUtil.decompress(backup.data);

      // Validate integrity
      if (!IntegrityValidator.validate(flowData, backup.metadata.checksum)) {
        console.error('[BackupManager] Backup integrity check failed');
        return false;
      }

      // Validate structure
      if (!IntegrityValidator.validateStructure(flowData)) {
        console.error('[BackupManager] Backup structure validation failed');
        return false;
      }

      // Restore to store
      const store = useFlowStore.getState();
      store.setNodes(flowData.nodes);
      store.setEdges(flowData.edges);
      if (flowData.viewport) {
        store.setViewport(flowData.viewport);
      }

      console.log(`[BackupManager] Restored backup ${backupId}`);
      return true;
    } catch (error) {
      console.error('[BackupManager] Restore failed:', error);
      return false;
    }
  }

  /**
   * Gets the most recent valid backup
   * @returns {Object|null} Backup data or null
   */
  getMostRecentBackup() {
    const sortedBackups = [...this.backups.entries()].sort(
      (a, b) => b[1].metadata.timestamp - a[1].metadata.timestamp,
    );

    for (const [id, backup] of sortedBackups) {
      try {
        const flowData = CompressionUtil.decompress(backup.data);
        if (IntegrityValidator.validateStructure(flowData) && flowData.nodes.length > 0) {
          return { id, ...backup };
        }
      } catch (error) {
        console.error(`[BackupManager] Invalid backup ${id}:`, error);
      }
    }

    return null;
  }

  /**
   * Intelligent recovery system
   * @returns {boolean} Whether recovery was successful
   */
  attemptIntelligentRecovery() {
    console.log('[BackupManager] Attempting intelligent recovery...');

    const currentState = useFlowStore.getState();

    // Don't recover if there are already nodes
    if (currentState.nodes && currentState.nodes.length > 0) {
      console.log('[BackupManager] Current state has nodes, skipping recovery');
      return false;
    }

    // Try to find the most recent valid backup
    const recentBackup = this.getMostRecentBackup();

    if (recentBackup) {
      console.log(`[BackupManager] Found valid backup: ${recentBackup.id}`);
      return this.restoreBackup(recentBackup.id);
    }

    console.log('[BackupManager] No valid backups found for recovery');
    return false;
  }

  /**
   * Sanitizes nodes for backup
   * @private
   */
  sanitizeNodes(nodes) {
    return nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
      },
      data: node.data,
      width: node.width,
      height: node.height,
      selected: false, // Don't save selection state
      dragging: false, // Don't save dragging state
    }));
  }

  /**
   * Sanitizes edges for backup
   * @private
   */
  sanitizeEdges(edges) {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      data: edge.data,
      selected: false, // Don't save selection state
    }));
  }

  /**
   * Generates unique backup ID
   * @private
   */
  generateBackupId() {
    return `backup_${this.plubotId}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Persists backup to localStorage
   * @private
   */
  persistBackup(backupId, data, metadata) {
    try {
      const storageKey = `flow_backup_${this.plubotId}_${backupId}`;
      const storageData = {
        metadata,
        data,
      };
      localStorage.setItem(storageKey, JSON.stringify(storageData));
    } catch (error) {
      console.error('[BackupManager] Failed to persist backup:', error);
      // Clean up old backups if storage is full
      this.cleanupOldBackups(true);
    }
  }

  /**
   * Loads backup from localStorage
   * @private
   */
  loadBackupFromStorage(backupId) {
    try {
      const storageKey = `flow_backup_${this.plubotId}_${backupId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[BackupManager] Failed to load backup from storage:', error);
    }
    return null;
  }

  /**
   * Loads existing backups from localStorage
   * @private
   */
  loadExistingBackups() {
    const prefix = `flow_backup_${this.plubotId}_`;
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(prefix));

    for (const key of keys) {
      try {
        const stored = JSON.parse(localStorage.getItem(key));
        const backupId = key.replace(prefix, '');
        this.backups.set(backupId, stored);
      } catch (error) {
        console.error(`[BackupManager] Failed to load backup ${key}:`, error);
        localStorage.removeItem(key); // Clean up corrupted backup
      }
    }
  }

  /**
   * Enforces version limit
   * @private
   */
  enforceVersionLimit() {
    if (this.backups.size <= CONFIG.MAX_BACKUP_VERSIONS) return;

    const sortedBackups = [...this.backups.entries()].sort(
      (a, b) => b[1].metadata.timestamp - a[1].metadata.timestamp,
    );

    // Keep only the most recent backups
    const toDelete = sortedBackups.slice(CONFIG.MAX_BACKUP_VERSIONS);

    for (const [id] of toDelete) {
      this.backups.delete(id);
      const storageKey = `flow_backup_${this.plubotId}_${id}`;
      localStorage.removeItem(storageKey);
    }
  }

  /**
   * Cleans up old backups
   * @private
   */
  cleanupOldBackups(aggressive = false) {
    const now = Date.now();
    const maxAge = aggressive
      ? 1000 * 60 * 60 // 1 hour if aggressive
      : CONFIG.BACKUP_EXPIRY_HOURS * 60 * 60 * 1000;

    for (const [id, backup] of this.backups.entries()) {
      if (now - backup.metadata.timestamp > maxAge) {
        this.backups.delete(id);
        const storageKey = `flow_backup_${this.plubotId}_${id}`;
        localStorage.removeItem(storageKey);
      }
    }
  }

  /**
   * Starts automatic backup
   * @private
   */
  startAutoBackup() {
    if (this.autoBackupInterval) return;

    this.autoBackupInterval = setInterval(() => {
      this.createBackup({ reason: 'auto' });
    }, CONFIG.AUTO_BACKUP_INTERVAL);
  }

  /**
   * Stops automatic backup
   */
  stopAutoBackup() {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
    }
  }

  /**
   * Destroys the backup manager
   */
  destroy() {
    this.stopAutoBackup();
    this.backups.clear();
    this.isInitialized = false;
  }

  /**
   * Gets backup statistics
   */
  getStats() {
    return {
      totalBackups: this.backups.size,
      oldestBackup: Math.min(...[...this.backups.values()].map((b) => b.metadata.timestamp)),
      newestBackup: Math.max(...[...this.backups.values()].map((b) => b.metadata.timestamp)),
      totalSize: [...this.backups.values()].reduce((accumulator, b) => accumulator + b.data.length, 0),
    };
  }
}

// Singleton instance
let backupManagerInstance = null;

/**
 * Gets or creates the backup manager instance
 * @returns {FlowBackupManager} Backup manager instance
 */
export function getBackupManager() {
  if (!backupManagerInstance) {
    backupManagerInstance = new FlowBackupManager();
  }
  return backupManagerInstance;
}

/**
 * Hook for using backup manager in React components
 */
export function useFlowBackup() {
  const manager = getBackupManager();
  const plubotId = useFlowStore((state) => state.plubotId);

  // Initialize on plubotId change
  if (plubotId && !manager.isInitialized) {
    manager.initialize(plubotId);
  }

  return {
    createBackup: (options) => manager.createBackup(options),
    restoreBackup: (backupId) => manager.restoreBackup(backupId),
    attemptRecovery: () => manager.attemptIntelligentRecovery(),
    getStats: () => manager.getStats(),
  };
}

export default FlowBackupManager;
