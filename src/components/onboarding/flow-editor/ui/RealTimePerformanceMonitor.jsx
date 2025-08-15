/**
 * RealTimePerformanceMonitor.jsx - Monitor de rendimiento en tiempo real
 * Muestra estadísticas de renders y análisis de optimización en vivo
 */

import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';

import renderAnalysis from '@/utils/renderAnalysis';
import renderTracker from '@/utils/renderTracker';

import './RealTimePerformanceMonitor.css';

// Helper functions moved to outer scope for unicorn/consistent-function-scoping compliance
const getEfficiencyColor = (efficiency) => {
  switch (efficiency) {
    case 'EXCELLENT': {
      return '#22c55e';
    }
    case 'GOOD': {
      return '#3b82f6';
    }
    case 'NEEDS_ATTENTION': {
      return '#f59e0b';
    }
    case 'POOR': {
      return '#ef4444';
    }
    default: {
      return '#6b7280';
    }
  }
};

const formatRenderRate = (rate) => {
  if (rate >= 1000) return `${(rate / 1000).toFixed(1)}k`;
  if (rate >= 100) return Math.round(rate).toString();
  return rate.toFixed(1);
};

const getEfficiencyIcon = (efficiency) => {
  switch (efficiency) {
    case 'EXCELLENT': {
      return <CheckCircle size={16} />;
    }
    case 'GOOD': {
      return <TrendingUp size={16} />;
    }
    case 'NEEDS_ATTENTION': {
      return <AlertTriangle size={16} />;
    }
    case 'POOR': {
      return <AlertTriangle size={16} />;
    }
    default: {
      return <BarChart3 size={16} />;
    }
  }
};

// Helper component para estadísticas de componentes
const ComponentStatsSection = ({ stats }) => (
  <div className='performance-section'>
    <h3>Componentes Tracked ({stats.length})</h3>
    <div className='performance-stats-list'>
      {stats.slice(0, 10).map((stat) => (
        <div key={stat.component} className='performance-stat-item'>
          <div className='stat-component'>
            <div
              className='efficiency-indicator'
              style={{ color: getEfficiencyColor(stat.efficiency) }}
            >
              {getEfficiencyIcon(stat.efficiency)}
            </div>
            <span className='component-name'>{stat.component}</span>
          </div>

          <div className='stat-metrics'>
            <span className='render-rate'>{formatRenderRate(stat.rendersPerSecond)}/s</span>
            <span className='total-renders'>({stat.totalRenders} total)</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

ComponentStatsSection.propTypes = {
  stats: PropTypes.arrayOf(PropTypes.object).isRequired,
};

// Helper component para optimizaciones críticas
const CriticalOptimizationsSection = ({ optimizationPlan }) => {
  if (!optimizationPlan || optimizationPlan.criticalComponents.length === 0) {
    return;
  }

  return (
    <div className='performance-section critical'>
      <h3>🚨 Crítico - Requiere Atención Inmediata</h3>
      <div className='optimization-list'>
        {optimizationPlan.criticalComponents.slice(0, 3).map((rec) => (
          <div key={rec.solution} className='optimization-item critical'>
            <div className='optimization-header'>
              <span className='component-name'>{rec.component}</span>
              <span className='render-rate critical'>
                {getEfficiencyIcon(rec.efficiency)}
                {formatRenderRate(rec.currentRenderRate)}/s
              </span>
            </div>
            <div className='optimization-details'>
              <p className='problem-description'>{rec.problem}</p>
              <p className='solution-description'>
                <strong>Solución:</strong> {rec.solution}
              </p>
              <div className='impact-estimate'>
                <span className='impact-label'>Reducción estimada:</span>
                <span className='impact-value'>
                  {rec.estimatedImprovement.toFixed(1)} renders/s
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

CriticalOptimizationsSection.propTypes = {
  optimizationPlan: PropTypes.shape({
    criticalComponents: PropTypes.arrayOf(PropTypes.object),
  }),
};

// Helper component para optimizaciones de alta prioridad
const HighPriorityOptimizationsSection = ({ optimizationPlan }) => {
  if (!optimizationPlan || optimizationPlan.highPriorityComponents.length === 0) {
    return;
  }

  return (
    <div className='performance-section high-priority'>
      <h3>⚠️ Alta Prioridad</h3>
      <div className='optimization-list'>
        {optimizationPlan.highPriorityComponents.slice(0, 2).map((comp) => (
          <div key={comp.name} className='optimization-item high-priority'>
            <div className='optimization-header'>
              <span className='component-name'>{comp.name}</span>
              <span className='improvement-estimate'>
                {comp.currentRenderRate.toFixed(1)} → ~
                {(comp.currentRenderRate - comp.estimatedImprovement).toFixed(1)}/s
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

HighPriorityOptimizationsSection.propTypes = {
  optimizationPlan: PropTypes.shape({
    highPriorityComponents: PropTypes.arrayOf(PropTypes.object),
  }),
};

// Helper component para resumen de optimización
const OptimizationSummarySection = ({ optimizationPlan }) => {
  if (!optimizationPlan) {
    return;
  }

  return (
    <div className='performance-section summary'>
      <h3>📈 Potencial de Optimización</h3>
      <div className='optimization-summary'>
        <div className='summary-metric'>
          <span className='metric-label'>Reducción Estimada:</span>
          <span className='metric-value'>
            {optimizationPlan.totalOptimizationPotential.toFixed(1)} renders/s
          </span>
        </div>
        <div className='summary-metric'>
          <span className='metric-label'>Componentes Críticos:</span>
          <span className='metric-value critical'>
            {optimizationPlan.criticalComponents.length}
          </span>
        </div>
        <div className='summary-metric'>
          <span className='metric-label'>Alta Prioridad:</span>
          <span className='metric-value high-priority'>
            {optimizationPlan.highPriorityComponents.length}
          </span>
        </div>
      </div>
    </div>
  );
};

OptimizationSummarySection.propTypes = {
  optimizationPlan: PropTypes.shape({
    totalOptimizationPotential: PropTypes.number,
    criticalComponents: PropTypes.arrayOf(PropTypes.object),
    highPriorityComponents: PropTypes.arrayOf(PropTypes.object),
  }),
};

// Helper component para componentes bien optimizados
const ExcellentComponentsSection = ({ stats }) => {
  const excellentComponents = stats.filter((s) => s.efficiency === 'EXCELLENT');

  if (excellentComponents.length === 0) {
    return;
  }

  return (
    <div className='performance-section excellent'>
      <h3>✅ Bien Optimizados</h3>
      <div className='excellent-components'>
        {excellentComponents.slice(0, 5).map((stat) => (
          <span key={stat.component} className='excellent-component'>
            {stat.component} ({formatRenderRate(stat.rendersPerSecond)}/s)
          </span>
        ))}
      </div>
    </div>
  );
};

ExcellentComponentsSection.propTypes = {
  stats: PropTypes.arrayOf(PropTypes.object),
};

const RealTimePerformanceMonitor = ({
  autoStart = false,
  updateInterval = 1000,
  showOptimizationSuggestions = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [stats, setStats] = useState([]);
  const [optimizationPlan, setOptimizationPlan] = useState();
  const [isTracking, setIsTracking] = useState(autoStart);
  const intervalRef = useRef(null);

  // Iniciar/detener tracking automático
  useEffect(() => {
    if (isTracking && autoStart) {
      renderTracker.startAutoReporting(5000); // Reportes cada 5 segundos

      intervalRef.current = setInterval(() => {
        const currentStats = renderTracker.getAllStats();
        setStats(currentStats);

        if (showOptimizationSuggestions && currentStats.length > 0) {
          const plan = renderAnalysis.generateOptimizationPlan(
            currentStats.map((stat) => renderAnalysis.analyzeComponent(stat.component, stat)),
          );
          setOptimizationPlan(plan);
        }
      }, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      renderTracker.stopAutoReporting();
    };
  }, [isTracking, autoStart, updateInterval, showOptimizationSuggestions]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking) {
      renderTracker.reset();
      setStats([]);
      setOptimizationPlan(undefined);
    }
  };

  if (!isVisible) {
    return (
      <div className='performance-monitor-toggle'>
        <button
          onClick={() => setIsVisible(true)}
          className='performance-toggle-btn'
          title='Abrir Monitor de Rendimiento'
        >
          <BarChart3 size={20} />
          <span className='performance-badge'>{stats.length}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`performance-monitor ${isMinimized ? 'minimized' : ''}`}>
      <div className='performance-monitor-header'>
        <div className='performance-monitor-title'>
          <BarChart3 size={18} />
          <span>Monitor de Rendimiento</span>
          <div className={`tracking-indicator ${isTracking ? 'active' : 'inactive'}`}>
            {isTracking ? '🟢' : '🔴'}
          </div>
        </div>

        <div className='performance-monitor-controls'>
          <button
            onClick={toggleTracking}
            className={`tracking-btn ${isTracking ? 'stop' : 'start'}`}
            title={isTracking ? 'Detener Tracking' : 'Iniciar Tracking'}
          >
            {isTracking ? 'Detener' : 'Iniciar'}
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className='minimize-btn'
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>

          <button onClick={() => setIsVisible(false)} className='close-btn' title='Cerrar Monitor'>
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className='performance-monitor-content'>
          {/* Estadísticas de Componentes */}
          <ComponentStatsSection stats={stats} />

          {/* Optimizaciones Críticas */}
          <CriticalOptimizationsSection optimizationPlan={optimizationPlan} />

          {/* Optimizaciones de Alta Prioridad */}
          <HighPriorityOptimizationsSection optimizationPlan={optimizationPlan} />

          {/* Resumen de Optimización */}
          <OptimizationSummarySection optimizationPlan={optimizationPlan} />

          {/* Componentes Bien Optimizados */}
          <ExcellentComponentsSection stats={stats} />
        </div>
      )}
    </div>
  );
};

RealTimePerformanceMonitor.propTypes = {
  autoStart: PropTypes.bool,
  updateInterval: PropTypes.number,
  showOptimizationSuggestions: PropTypes.bool,
};

export default RealTimePerformanceMonitor;
