/**
 * autoInstrument.js - Auto-instrumentación de componentes para render tracking
 * Detecta y agrega automáticamente render tracking a componentes React
 */

import React from 'react';

import { info } from './logControl';
import renderTracker from './renderTracker';

class AutoInstrument {
  constructor() {
    this.instrumentedComponents = new Set();
    this.componentRegistry = new Map();
    this.isEnabled = false;
  }

  /**
   * Habilita la auto-instrumentación
   */
  enable() {
    this.isEnabled = true;
    info('🔧 Auto-instrumentación habilitada', {}, 'AutoInstrument');
  }

  /**
   * Deshabilita la auto-instrumentación
   */
  disable() {
    this.isEnabled = false;
    info('🔧 Auto-instrumentación deshabilitada', {}, 'AutoInstrument');
  }

  /**
   * Registra un componente para tracking automático
   * @param {string} componentName - Nombre del componente
   * @param {Function} component - Referencia al componente
   * @param {Object} options - Opciones de instrumentación
   */
  registerComponent(componentName, component, options = {}) {
    if (this.instrumentedComponents.has(componentName)) {
      return component; // Ya instrumentado
    }

    const {
      trackingKey = componentName,
      reasonExtractor = () => 'auto-tracked',
      priority = 'normal',
    } = options;

    // Crear wrapper instrumentado
    const instrumentedComponent = this.createInstrumentedWrapper(
      component,
      trackingKey,
      reasonExtractor,
      priority,
    );

    this.componentRegistry.set(componentName, {
      original: component,
      instrumented: instrumentedComponent,
      options,
    });

    this.instrumentedComponents.add(componentName);

    info(`🎯 Componente ${componentName} auto-instrumentado`, {}, 'AutoInstrument');
    return instrumentedComponent;
  }

  /**
   * Crea un wrapper instrumentado para un componente
   */
  createInstrumentedWrapper(OriginalComponent, trackingKey, reasonExtractor, _priority) {
    const { isEnabled } = this; // Capture context with destructuring
    const InstrumentedWrapper = (props) => {
      // Hook de tracking
      React.useEffect(() => {
        if (isEnabled) {
          const reason =
            typeof reasonExtractor === 'function' ? reasonExtractor(props) : reasonExtractor;
          renderTracker.track(trackingKey, reason);
        }
      });

      return React.createElement(OriginalComponent, props);
    };

    // Preservar displayName y propTypes
    InstrumentedWrapper.displayName = `Instrumented(${OriginalComponent.displayName || OriginalComponent.name || 'Component'})`;
    InstrumentedWrapper.propTypes = OriginalComponent.propTypes;
    InstrumentedWrapper.defaultProps = OriginalComponent.defaultProps;

    return InstrumentedWrapper;
  }

  /**
   * Instrumenta automáticamente componentes basado en patrones
   * @param {Object} componentMap - Mapa de componentes a instrumentar
   */
  instrumentComponents(componentMap) {
    const results = {};

    for (const [name, component] of Object.entries(componentMap)) {
      // eslint-disable-next-line security/detect-object-injection
      results[name] =
        typeof component === 'function'
          ? this.registerComponent(name, component, {
              reasonExtractor: (props) => {
                // Detectar razones comunes de re-render
                if (props.selected) return 'selected';
                if (props.isEditing) return 'editing';
                if (props.data && typeof props.data === 'object') return 'data-change';
                return 'props-change';
              },
            })
          : component;
    }

    return results;
  }

  /**
   * Instrumenta nodos de ReactFlow automáticamente
   * @param {Object} nodeTypes - Tipos de nodos de ReactFlow
   */
  instrumentNodeTypes(nodeTypes) {
    const instrumentedNodeTypes = {};

    for (const [nodeType, NodeComponent] of Object.entries(nodeTypes)) {
      // eslint-disable-next-line security/detect-object-injection
      instrumentedNodeTypes[nodeType] = this.registerComponent(`${nodeType}Node`, NodeComponent, {
        reasonExtractor: (props) => {
          const reasons = [];
          if (props.selected) reasons.push('selected');
          if (props.data?.isEditing) reasons.push('editing');
          if (props.data?.lodLevel) reasons.push(`LOD-${props.data.lodLevel}`);
          return reasons.length > 0 ? reasons.join('+') : 'render';
        },
        priority: 'high', // Los nodos son críticos para performance
      });
    }

    // eslint-disable-next-line no-console
    console.log(`🎯 ${Object.keys(instrumentedNodeTypes).length} tipos de nodos instrumentados`);
    return instrumentedNodeTypes;
  }

  /**
   * Detecta componentes con alto render rate y los marca para optimización
   */
  detectHighRenderComponents() {
    const stats = renderTracker.getAllStats();
    const highRenderComponents = stats.filter((stat) => stat.rendersPerSecond > 1.5);

    if (highRenderComponents.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ COMPONENTES CON ALTO RENDER RATE DETECTADOS:');
      for (const comp of highRenderComponents) {
        // eslint-disable-next-line no-console
        console.warn(
          `   ${comp.component}: ${comp.rendersPerSecond.toFixed(2)}/s (${comp.totalRenders} total)`,
        );

        // Marcar para análisis detallado
        renderTracker.markForAnalysis(comp.component, {
          reason: 'high-render-rate',
          threshold: 1.5,
          currentRate: comp.rendersPerSecond,
        });
      }
    }

    return highRenderComponents;
  }

  /**
   * Genera reporte de componentes instrumentados
   */
  generateInstrumentationReport() {
    const report = {
      totalInstrumented: this.instrumentedComponents.size,
      components: [...this.instrumentedComponents],
      isEnabled: this.isEnabled,
      registrySize: this.componentRegistry.size,
    };

    info(
      `📊 REPORTE DE INSTRUMENTACIÓN:\n   Componentes instrumentados: ${report.totalInstrumented}\n   Estado: ${report.isEnabled ? 'Habilitado' : 'Deshabilitado'}\n   Componentes en registry: ${report.registrySize}`,
      {},
      'AutoInstrument',
    );

    return report;
  }

  /**
   * Limpia la instrumentación de todos los componentes
   */
  clearInstrumentation() {
    this.instrumentedComponents.clear();
    this.componentRegistry.clear();
    info('🧹 Instrumentación limpiada', {}, 'AutoInstrument');
  }

  /**
   * Obtiene estadísticas de un componente específico
   */
  getComponentStats(componentName) {
    const stats = renderTracker.getAllStats();
    return stats.find((stat) => stat.component === componentName);
  }

  /**
   * Configura instrumentación automática para patrones comunes
   */
  setupCommonPatterns() {
    // Patrón para componentes de nodos
    this.setupNodePattern();

    // Patrón para componentes de UI
    this.setupUIPattern();

    // Patrón para componentes de editor
    this.setupEditorPattern();
  }

  setupNodePattern() {
    // Auto-detectar y instrumentar componentes que terminan en "Node"
    const nodePattern = /Node$/;

    // Esta función sería llamada cuando se registren nuevos componentes
    this.addPattern('node', {
      test: (name) => nodePattern.test(name),
      reasonExtractor: (props) => {
        if (props.selected) return 'selected';
        if (props.data?.lodLevel) return `LOD-${props.data.lodLevel}`;
        return 'node-render';
      },
      priority: 'high',
    });
  }

  setupUIPattern() {
    // Componentes de UI generales
    const uiComponents = ['Button', 'Modal', 'Tooltip', 'Dropdown', 'Menu'];

    this.addPattern('ui', {
      test: (name) => uiComponents.some((ui) => name.includes(ui)),
      reasonExtractor: (props) => {
        if (props.isOpen || props.visible) return 'visible';
        if (props.disabled) return 'disabled';
        return 'ui-render';
      },
      priority: 'low',
    });
  }

  setupEditorPattern() {
    // Componentes específicos del editor
    const editorComponents = ['Flow', 'Editor', 'Canvas', 'Palette'];

    this.addPattern('editor', {
      test: (name) => editorComponents.some((editor) => name.includes(editor)),
      reasonExtractor: (props) => {
        if (props.isUltraMode) return 'ultra-mode';
        if (props.nodes?.length) return `nodes-${props.nodes.length}`;
        return 'editor-render';
      },
      priority: 'critical',
    });
  }

  addPattern(patternName, _config) {
    // Implementación para agregar patrones personalizados
    info(`🎨 Patrón ${patternName} configurado`, {}, 'AutoInstrument');
  }
}

// Instancia singleton
const autoInstrument = new AutoInstrument();

// Métodos de conveniencia para uso global
globalThis.enableAutoInstrument = () => autoInstrument.enable();
globalThis.disableAutoInstrument = () => autoInstrument.disable();
globalThis.instrumentComponents = (components) => autoInstrument.instrumentComponents(components);
globalThis.getInstrumentationReport = () => autoInstrument.generateInstrumentationReport();
globalThis.detectHighRenderComponents = () => autoInstrument.detectHighRenderComponents();

export default autoInstrument;
