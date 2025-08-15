/* global process */
/**
 * globalLogControl.js - Utilidad global para control de logs en desarrollo
 * Permite habilitar/deshabilitar logs fácilmente desde consola del navegador
 */

import {
  showConfig,
  silenceAll,
  enableComponent,
  disableComponent,
  enableCategory,
  disableCategory,
  reset,
} from './logControl';

// Exponer controles globales en window para debugging fácil
if (
  globalThis.window !== undefined &&
  (typeof process !== 'undefined' && process.env ? process.env.NODE_ENV === 'development' : true)
) {
  globalThis.logControl = {
    // Mostrar configuración actual
    showConfig: () => showConfig(),

    // Silenciar todos los logs
    silenceAll: () => silenceAll(),

    // Habilitar logs de un componente específico
    enableComponent: (componentName) => enableComponent(componentName),

    // Deshabilitar logs de un componente específico
    disableComponent: (componentName) => disableComponent(componentName),

    // Habilitar categoría específica
    enableCategory: (category) => enableCategory(category),

    // Deshabilitar categoría específica
    disableCategory: (category) => disableCategory(category),

    // Habilitar logs de render tracking temporalmente
    enableRenderTracking: () => {
      enableCategory('renderTracking');
      // eslint-disable-next-line no-console
      console.log(
        '🔊 Render tracking enabled. Use logControl.disableCategory("renderTracking") to disable.',
      );
    },

    // Habilitar logs de memo comparisons temporalmente
    enableMemoLogs: () => {
      enableCategory('memoComparisons');
      // eslint-disable-next-line no-console
      console.log(
        '🔊 Memo comparison logs enabled. Use logControl.disableCategory("memoComparisons") to disable.',
      );
    },

    // Habilitar logs de performance temporalmente
    enablePerformanceLogs: () => {
      enableCategory('performanceReports');
      // eslint-disable-next-line no-console
      console.log(
        '🔊 Performance logs enabled. Use logControl.disableCategory("performanceReports") to disable.',
      );
    },

    // Debugging específico de EliteEdge
    debugEliteEdge: () => {
      enableComponent('EliteEdge');
      enableCategory('renderTracking');
      enableCategory('memoComparisons');
      // eslint-disable-next-line no-console
      console.log('🔊 EliteEdge debugging enabled. Use logControl.silenceAll() to disable.');
    },

    // Debugging específico de OptionNode
    debugOptionNode: () => {
      enableComponent('OptionNode');
      enableCategory('renderTracking');
      enableCategory('memoComparisons');
      // eslint-disable-next-line no-console
      console.log('🔊 OptionNode debugging enabled. Use logControl.silenceAll() to disable.');
    },

    // Reset completo
    reset: () => {
      reset();
      // eslint-disable-next-line no-console
      console.log('🔄 Log control reset to silent mode.');
    },

    // Ayuda
    help: () => {
      // eslint-disable-next-line no-console
      console.log(`
🔧 LOG CONTROL COMMANDS:

📋 CONFIGURATION:
  logControl.showConfig()           - Show current configuration
  logControl.reset()                - Reset to silent mode

🔇 GLOBAL CONTROLS:
  logControl.silenceAll()           - Silence all logs except errors
  
📊 CATEGORY CONTROLS:
  logControl.enableRenderTracking() - Enable render tracking logs
  logControl.enableMemoLogs()       - Enable memo comparison logs
  logControl.enablePerformanceLogs() - Enable performance logs
  
🧩 COMPONENT CONTROLS:
  logControl.enableComponent('ComponentName')  - Enable logs for specific component
  logControl.disableComponent('ComponentName') - Disable logs for specific component
  
🔍 DEBUGGING SHORTCUTS:
  logControl.debugEliteEdge()       - Enable EliteEdge debugging
  logControl.debugOptionNode()      - Enable OptionNode debugging
  
📚 HELP:
  logControl.help()                 - Show this help message

Available components: EliteEdge, OptionNode, EndNode, EpicHeader, FlowMain, CustomMiniMap, NodePalette, ByteAssistant, BackgroundScene, MessageNode, DecisionNode, StartNode
Available categories: renderTracking, memoComparisons, performanceReports, optimization, debugging, info, warnings, errors
      `);
    },
  };

  // Mostrar mensaje de bienvenida en desarrollo
  // eslint-disable-next-line no-console
  console.log(`
🔧 LOG CONTROL SYSTEM LOADED
Type 'logControl.help()' in console for available commands.
All logs are silenced by default. Use specific commands to enable debugging.
  `);
}

export { default } from './logControl';
