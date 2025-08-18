/**
 * prevent-flow-reset.js
 *
 * Enterprise-grade flow protection system that prevents unintended data loss
 * while respecting user intentions for flow modifications.
 */

import useFlowStore from '@/stores/use-flow-store';

import { getBackupManager } from './flow-backup-manager';

// Configuration
const CONFIG = {
  PROTECTION_ENABLED: true,
  ALLOW_EMPTY_FLOW_SAVE: true, // Allow users to intentionally save empty flows
  DEBUG_MODE: false,
};

/**
 * Intelligent flow reset protection
 * Only prevents resets that would cause unintended data loss
 */
const _createResetFlowProtection = (flowStore, originalResetFlow) => {
  return (...arguments_) => {
    const state = flowStore.getState();
    const options = arguments_[2] ?? {};

    // Always allow explicit resets
    if (options.allowResetFromLoader === true || options.userInitiated === true) {
      if (CONFIG.DEBUG_MODE) console.log('[FlowProtection] Allowing explicit reset');
      return originalResetFlow(...arguments_);
    }

    // Allow reset if flow is already empty
    if (!state.nodes || state.nodes.length === 0) {
      return originalResetFlow(...arguments_);
    }

    // Block unexpected resets of non-empty flows
    if (CONFIG.DEBUG_MODE) {
      console.warn('[FlowProtection] Blocked unexpected reset of non-empty flow');
    }
    return state;
  };
};

/**
 * Smart protection logic that respects user intentions
 */
const _shouldActivateProtection = (currentNodes, newNodes, callStack) => {
  // Never protect if explicitly disabled
  if (!CONFIG.PROTECTION_ENABLED) return false;

  // Allow empty flows if user is intentionally clearing
  if (CONFIG.ALLOW_EMPTY_FLOW_SAVE && callStack.includes('saveFlow')) {
    return false;
  }

  // Allow deletions from user actions
  const userActions = [
    'deleteNode',
    'deleteElements',
    'onNodesDelete',
    'handleDelete',
    'clearFlow',
  ];
  if (userActions.some((action) => callStack.includes(action))) {
    return false;
  }

  // Only protect against unexpected clearing of non-empty flows
  return (
    currentNodes.length > 0 &&
    (!newNodes || (Array.isArray(newNodes) && newNodes.length === 0)) &&
    !callStack.includes('TrainingScreen')
  );
};

/**
 * Process valid nodes with intelligent backup
 */
const _processValidNodes = (newNodes, backupManager) => {
  if (!Array.isArray(newNodes)) return;

  // Create backup for significant changes
  if (newNodes.length > 0) {
    backupManager.createBackup({
      reason: 'node_update',
      forceSave: false,
    });
  }
};

/**
 * Intelligent setNodes protection
 */
const _createSetNodesProtection = (flowStore, originalSetNodes, backupManager) => {
  return (newNodes) => {
    const callStack = new Error('Stack trace').stack ?? '';
    const state = flowStore.getState();
    const currentNodes = state.nodes ?? [];

    // Check if this is a user-initiated deletion of all nodes
    const isUserDeletingAll =
      callStack.includes('deleteElements') ||
      callStack.includes('onNodesDelete') ||
      callStack.includes('clearFlow');

    if (isUserDeletingAll && (!newNodes || newNodes.length === 0)) {
      // User is intentionally clearing the flow
      if (CONFIG.DEBUG_MODE) {
        console.log('[FlowProtection] User intentionally clearing flow');
      }
      // Don't create backup for intentional clear
      return originalSetNodes(newNodes);
    }

    if (_shouldActivateProtection(currentNodes, newNodes, callStack)) {
      // Create emergency backup before potential data loss
      backupManager.createBackup({
        reason: 'emergency',
        forceSave: true,
      });

      if (CONFIG.DEBUG_MODE) {
        console.warn('[FlowProtection] Blocked unexpected node clearing');
      }
      return; // Block the change
    }

    // Process valid changes
    _processValidNodes(newNodes, backupManager);
    return originalSetNodes(newNodes);
  };
};

/**
 * Smart recovery that respects user intentions
 */
const _createSmartRecovery = (backupManager) => {
  return (options = {}) => {
    const { forceRecover = false } = options;
    const state = useFlowStore.getState();

    // Don't recover if there are already nodes
    if (state.nodes && state.nodes.length > 0 && !forceRecover) {
      return false;
    }

    // Only attempt recovery if requested or after unexpected data loss
    if (forceRecover || options.afterCrash) {
      return backupManager.attemptIntelligentRecovery();
    }

    return false;
  };
};

/**
 * Cleanup old emergency backups
 */
const _cleanupOldBackups = (plubotId) => {
  if (!plubotId) return;

  try {
    // Remove old emergency backup keys (deprecated)
    const oldBackupKey = `plubot-nodes-emergency-backup-${plubotId}`;
    if (localStorage.getItem(oldBackupKey)) {
      localStorage.removeItem(oldBackupKey);
      if (CONFIG.DEBUG_MODE) {
        console.log('[FlowProtection] Cleaned up old emergency backup');
      }
    }
  } catch (error) {
    console.error('[FlowProtection] Cleanup error:', error);
  }
};

/**
 * Cleanup function
 */
const _createCleanupFunction = ({
  flowStore,
  originalResetFlow,
  originalSetNodes,
  backupManager,
}) => {
  return () => {
    try {
      // Restore original functions
      if (originalResetFlow) {
        flowStore.setState({ resetFlow: originalResetFlow });
      }
      if (originalSetNodes) {
        flowStore.setState({ setNodes: originalSetNodes });
      }

      // Stop backup manager
      if (backupManager) {
        backupManager.stopAutoBackup();
      }
    } catch (error) {
      console.error('[FlowProtection] Cleanup error:', error);
    }
  };
};

/**
 * Main flow protection system
 */
export const preventFlowReset = () => {
  let originalResetFlow;
  let originalSetNodes;
  let backupManager;

  try {
    const flowStore = useFlowStore;
    if (!flowStore || !flowStore.getState) return;

    const state = flowStore.getState();
    const { plubotId } = state;

    // Initialize backup manager
    backupManager = getBackupManager();
    if (plubotId) {
      backupManager.initialize(plubotId);
      _cleanupOldBackups(plubotId);
    }

    // 1. Protect resetFlow function
    if (typeof state.resetFlow === 'function') {
      originalResetFlow = state.resetFlow;
      const protectedReset = _createResetFlowProtection(flowStore, originalResetFlow);
      flowStore.setState({ resetFlow: protectedReset });
    }

    // 2. Protect setNodes function
    if (typeof state.setNodes === 'function') {
      originalSetNodes = state.setNodes;
      const protectedSetNodes = _createSetNodesProtection(
        flowStore,
        originalSetNodes,
        backupManager,
      );
      flowStore.setState({ setNodes: protectedSetNodes });
    }

    // 3. Add smart recovery function
    const smartRecovery = _createSmartRecovery(backupManager);
    flowStore.setState({ smartRecovery });

    // 4. Add explicit save handler for empty flows
    flowStore.setState({
      saveEmptyFlow: () => {
        // Allow saving empty flow when user explicitly wants to
        const state = flowStore.getState();
        if (state.nodes?.length === 0) {
          backupManager.createBackup({
            reason: 'user_delete_all',
            forceSave: false,
          });
        }
      },
    });

    if (CONFIG.DEBUG_MODE) {
      console.log('[FlowProtection] Protection system initialized');
    }

    // Return cleanup function
    return _createCleanupFunction({
      flowStore,
      originalResetFlow,
      originalSetNodes,
      backupManager,
    });
  } catch (error) {
    console.error('[FlowProtection] Initialization error:', error);
  }
};

export default preventFlowReset;
