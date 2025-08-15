/**
 * renderAnalysis.js - Análisis avanzado de renders para componentes React Flow
 * Detecta patrones de over-rendering y proporciona recomendaciones específicas
 */

import React from 'react';

class RenderAnalysis {
  constructor() {
    this.componentAnalysis = new Map();
    this.nodeAnalysis = new Map();
    this.edgeAnalysis = new Map();
    this.storeSubscriptions = new Map();
  }

  analyzeComponent(componentName, renderData, componentType = 'general') {
    const analysis = {
      componentName,
      componentType,
      renderFrequency: renderData.rendersPerSecond,
      totalRenders: renderData.totalRenders,
      efficiency: renderData.efficiency,
      recommendations: this.generateRecommendations(renderData, componentType),
      optimizationPriority: this.calculateOptimizationPriority(renderData),
      renderReasons: renderData.reasons,
    };

    this.componentAnalysis.set(componentName, analysis);
    return analysis;
  }

  generateRecommendations(renderData, componentType) {
    const recommendations = [];
    const { rendersPerSecond, reasons, totalRenders } = renderData;

    // High frequency renders
    if (rendersPerSecond > 10) {
      recommendations.push({
        type: 'CRITICAL',
        message: `Extremely high render frequency (${rendersPerSecond}/s). Implement React.memo immediately.`,
        solution: 'React.memo with custom comparison function',
      });
    } else if (rendersPerSecond > 5) {
      recommendations.push({
        type: 'HIGH',
        message: `High render frequency (${rendersPerSecond}/s). Consider memoization.`,
        solution: 'React.memo or useMemo for expensive computations',
      });
    }

    // Parent-render cascades
    if (reasons['parent-render'] && reasons['parent-render'] > totalRenders * 0.7) {
      recommendations.push({
        type: 'HIGH',
        message: 'Component re-renders mostly due to parent changes. Implement React.memo.',
        solution: 'React.memo with shallow comparison or custom areEqual function',
      });
    }

    // Dependency-related renders
    if (reasons['dependency-change'] && reasons['dependency-change'] > totalRenders * 0.5) {
      recommendations.push({
        type: 'MEDIUM',
        message: 'Frequent dependency changes. Review useEffect/useMemo dependencies.',
        solution: 'Optimize dependency arrays, use useCallback for functions',
      });
    }

    // Component-specific recommendations
    switch (componentType) {
      case 'node': {
        recommendations.push(...this.getNodeSpecificRecommendations(renderData));

        break;
      }
      case 'edge': {
        recommendations.push(...this.getEdgeSpecificRecommendations(renderData));

        break;
      }
      case 'flow-component': {
        recommendations.push(...this.getFlowComponentRecommendations(renderData));

        break;
      }
      // No default
    }

    return recommendations;
  }

  getNodeSpecificRecommendations(renderData) {
    const recommendations = [];

    if (renderData.rendersPerSecond > 2) {
      recommendations.push({
        type: 'HIGH',
        message: 'ReactFlow nodes should render minimally. Check for unnecessary prop changes.',
        solution: 'Memoize node data, implement shouldComponentUpdate logic',
      });
    }

    return recommendations;
  }

  getEdgeSpecificRecommendations(renderData) {
    const recommendations = [];

    if (renderData.rendersPerSecond > 1) {
      recommendations.push({
        type: 'MEDIUM',
        message: 'Edges should be static unless path changes. Check edge props stability.',
        solution: 'Memoize edge calculations, stable edge styling',
      });
    }

    return recommendations;
  }

  getFlowComponentRecommendations(renderData) {
    const recommendations = [];

    if (renderData.rendersPerSecond > 3) {
      recommendations.push({
        type: 'HIGH',
        message: 'Flow components should use selective Zustand subscriptions.',
        solution: 'Use shallow selectors, split store subscriptions',
      });
    }

    return recommendations;
  }

  calculateOptimizationPriority(renderData) {
    const { rendersPerSecond, totalRenders } = renderData;

    // Impact score based on frequency and total renders
    const impactScore = rendersPerSecond * Math.log(totalRenders + 1);

    if (impactScore > 50) return 'CRITICAL';
    if (impactScore > 20) return 'HIGH';
    if (impactScore > 10) return 'MEDIUM';
    return 'LOW';
  }

  generateOptimizationPlan(analysisData) {
    const plan = {
      criticalComponents: [],
      highPriorityComponents: [],
      mediumPriorityComponents: [],
      totalOptimizationPotential: 0,
    };

    for (const analysis of analysisData) {
      const component = {
        name: analysis.componentName,
        currentRenderRate: analysis.renderFrequency,
        recommendations: analysis.recommendations,
        estimatedImprovement: this.estimateImprovement(analysis),
      };

      plan.totalOptimizationPotential += component.estimatedImprovement;

      switch (analysis.optimizationPriority) {
        case 'CRITICAL': {
          plan.criticalComponents.push(component);
          break;
        }
        case 'HIGH': {
          plan.highPriorityComponents.push(component);
          break;
        }
        case 'MEDIUM': {
          plan.mediumPriorityComponents.push(component);
          break;
        }
      }
    }

    return plan;
  }

  estimateImprovement(analysis) {
    // Estimate potential render reduction percentage
    const { renderFrequency, renderReasons } = analysis;

    let improvementPotential = 0;

    // Parent-render cascades can be reduced by 80-90% with React.memo
    if (renderReasons['parent-render']) {
      improvementPotential += (renderReasons['parent-render'] / analysis.totalRenders) * 0.85;
    }

    // Dependency changes can be reduced by 50-70% with proper memoization
    if (renderReasons['dependency-change']) {
      improvementPotential += (renderReasons['dependency-change'] / analysis.totalRenders) * 0.6;
    }

    return Math.min(improvementPotential * renderFrequency, renderFrequency * 0.9);
  }

  generateDetailedReport(renderStats) {
    // eslint-disable-next-line no-console
    console.group('🔬 DETAILED RENDER ANALYSIS');

    const analyses = renderStats.map((stat) =>
      this.analyzeComponent(stat.component, stat, this.detectComponentType(stat.component)),
    );

    const optimizationPlan = this.generateOptimizationPlan(analyses);

    // eslint-disable-next-line no-console
    console.group('🚨 CRITICAL OPTIMIZATIONS NEEDED:');
    for (const comp of optimizationPlan.criticalComponents) {
      // eslint-disable-next-line no-console
      console.log(
        `${comp.name}: ${comp.currentRenderRate}/s → ~${(comp.currentRenderRate - comp.estimatedImprovement).toFixed(1)}/s`,
      );
      for (const rec of comp.recommendations) {
        if (rec.type === 'CRITICAL') {
          // eslint-disable-next-line no-console
          console.log(`  🔥 ${rec.message}`);
          // eslint-disable-next-line no-console
          console.log(`  💡 Solution: ${rec.solution}`);
        }
      }
    }
    // eslint-disable-next-line no-console
    console.groupEnd();

    // eslint-disable-next-line no-console
    console.group('⚠️ HIGH PRIORITY OPTIMIZATIONS:');
    for (const comp of optimizationPlan.highPriorityComponents) {
      // eslint-disable-next-line no-console
      console.log(
        `${comp.name}: ${comp.currentRenderRate}/s → ~${(comp.currentRenderRate - comp.estimatedImprovement).toFixed(1)}/s`,
      );
      for (const rec of comp.recommendations) {
        if (rec.type === 'HIGH') {
          // eslint-disable-next-line no-console
          console.log(`  ⚡ ${rec.message}`);
          // eslint-disable-next-line no-console
          console.log(`  💡 Solution: ${rec.solution}`);
        }
      }
    }
    // eslint-disable-next-line no-console
    console.groupEnd();

    // eslint-disable-next-line no-console
    console.log(
      `📈 Total optimization potential: ${optimizationPlan.totalOptimizationPotential.toFixed(1)} renders/sec reduction`,
    );
    // eslint-disable-next-line no-console
    console.groupEnd();

    return optimizationPlan;
  }

  detectComponentType(componentName) {
    const lowerName = componentName.toLowerCase();

    if (lowerName.includes('node') && !lowerName.includes('palette')) {
      return 'node';
    }
    if (lowerName.includes('edge')) {
      return 'edge';
    }
    if (lowerName.includes('flow') || lowerName.includes('canvas') || lowerName.includes('main')) {
      return 'flow-component';
    }

    return 'general';
  }
}

// Hook para tracking automático con análisis
export const useRenderAnalysis = (componentName, dependencies = [], _componentType = 'general') => {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(Date.now());
  const renderReasons = React.useRef(new Map());

  React.useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Determine render reason
    let reason = renderCount.current === 1 ? 'initial' : 'parent-render';

    if (dependencies.length > 0 && renderCount.current > 1) {
      reason = 'dependency-change';
    }

    // Track reason
    const currentCount = renderReasons.current.get(reason) ?? 0;
    renderReasons.current.set(reason, currentCount + 1);

    // Log with analysis context
    if (renderCount.current <= 10 || renderCount.current % 10 === 0) {
      const renderRate = renderCount.current > 1 ? (1000 / timeSinceLastRender).toFixed(1) : 0;
      // eslint-disable-next-line no-console
      console.log(
        `🔄 ${componentName} render #${renderCount.current} (${reason}) - Rate: ${renderRate}/s`,
      );
    }
  });

  // Return analysis data
  return {
    renderCount: renderCount.current,
    renderReasons: Object.fromEntries(renderReasons.current),
  };
};

const renderAnalysis = new RenderAnalysis();
export default renderAnalysis;
