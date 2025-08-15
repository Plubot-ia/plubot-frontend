/**
 * EnhancedPerformanceMonitor.jsx - Monitor de rendimiento mejorado con categorización jerárquica
 * Sistema avanzado de monitoreo con organización por categorías y métricas detalladas
 */

import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronRight,
  Activity,
  Zap,
  Package,
  Cpu,
  Database,
  Globe,
  Layers,
  Settings,
} from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import enhancedRenderTracker from '@/utils/enhancedRenderTracker';

import './EnhancedPerformanceMonitor.css';

// Iconos para cada categoría
// Helper seguro para obtener iconos de categoría
const getCategoryIcon = (categoryKey, defaultIcon) => {
  switch (categoryKey) {
    case 'FLOW_NODES': {
      return <Layers size={14} />;
    }
    case 'AI_NODES': {
      return <Cpu size={14} />;
    }
    case 'INTEGRATION_NODES': {
      return <Globe size={14} />;
    }
    case 'MEDIA_NODES': {
      return <Package size={14} />;
    }
    case 'UI_COMPONENTS': {
      return <Settings size={14} />;
    }
    case 'EDGES': {
      return <Zap size={14} />;
    }
    case 'HANDLES': {
      return <Activity size={14} />;
    }
    case 'SUBCOMPONENTS': {
      return <Package size={14} />;
    }
    case 'STORES': {
      return <Database size={14} />;
    }
    case 'UTILITIES': {
      return <Settings size={14} />;
    }
    default: {
      return defaultIcon;
    }
  }
};

// Helper para obtener color según eficiencia
const getEfficiencyColor = (efficiency) => {
  const colors = {
    EXCELLENT: '#10b981',
    GOOD: '#3b82f6',
    NEEDS_ATTENTION: '#f59e0b',
    POOR: '#ef4444',
  };
  // eslint-disable-next-line security/detect-object-injection
  return Object.prototype.hasOwnProperty.call(colors, efficiency) ? colors[efficiency] : '#6b7280';
};

// Helper para obtener icono según eficiencia
const getEfficiencyIcon = (efficiency) => {
  switch (efficiency) {
    case 'EXCELLENT': {
      return <CheckCircle size={14} />;
    }
    case 'GOOD': {
      return <TrendingUp size={14} />;
    }
    case 'NEEDS_ATTENTION': {
      return <AlertTriangle size={14} />;
    }
    case 'POOR': {
      return <AlertTriangle size={14} className='text-red-500' />;
    }
    default: {
      return <BarChart3 size={14} />;
    }
  }
};

// Componente para mostrar una categoría colapsable
const CategorySection = ({ categoryKey, category, isExpanded, onToggle }) => {
  const hasComponents = category.components && category.components.length > 0;
  const categoryColor = getEfficiencyColor(category.efficiency);

  return (
    <div className='category-section'>
      <div
        className='category-header'
        onClick={() => onToggle(categoryKey)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle(categoryKey);
          }
        }}
        role='button'
        tabIndex={hasComponents ? 0 : -1}
        style={{ cursor: hasComponents ? 'pointer' : 'default' }}
      >
        <div className='category-title'>
          <span className='category-toggle'>
            {hasComponents && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </span>
          {}
          <span className='category-icon'>{getCategoryIcon(categoryKey, category.icon)}</span>
          <span className='category-name'>{category.name}</span>
          <span className='category-count'>({category.components.length})</span>
        </div>

        {hasComponents && (
          <div className='category-stats'>
            <span className='category-efficiency' style={{ color: categoryColor }}>
              {getEfficiencyIcon(category.efficiency)}
            </span>
            <span className='category-rate'>{category.avgRenderRate}/s</span>
            <span className='category-total'>({category.totalRenders} total)</span>
          </div>
        )}
      </div>

      {isExpanded && hasComponents && (
        <div className='category-components'>
          {category.components.map((component) => (
            <ComponentRow key={component.component} component={component} />
          ))}
        </div>
      )}
    </div>
  );
};

CategorySection.propTypes = {
  categoryKey: PropTypes.string.isRequired,
  category: PropTypes.object.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

// Componente para mostrar una fila de componente
// Helper para obtener color según el score de performance
const getScoreColor = (score) => {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

const ComponentRow = ({ component }) => {
  const efficiencyColor = getEfficiencyColor(component.efficiency);
  const scoreColor = getScoreColor(component.performanceScore);

  return (
    <div className='component-row'>
      <div className='component-info'>
        <span className='component-name'>{component.component}</span>
        <div className='component-score' style={{ color: scoreColor }}>
          <span className='score-value'>{component.performanceScore}</span>
          <span className='score-label'>pts</span>
        </div>
      </div>

      <div className='component-metrics'>
        <span className='component-efficiency' style={{ color: efficiencyColor }}>
          {getEfficiencyIcon(component.efficiency)}
        </span>
        <span className='component-rate'>{component.rendersPerSecond}/s</span>
        <span className='component-total'>({component.totalRenders})</span>
      </div>
    </div>
  );
};

ComponentRow.propTypes = {
  component: PropTypes.object.isRequired,
};

// Componente para mostrar el resumen general
const SummarySection = ({ report }) => {
  if (!report || !report.summary) return;

  const healthColor = getEfficiencyColor(report.summary.overallHealth);

  return (
    <div className='summary-section'>
      <div className='summary-header'>
        <h3>📊 Resumen General</h3>
        <div className='health-indicator' style={{ color: healthColor }}>
          {getEfficiencyIcon(report.summary.overallHealth)}
          <span>{report.summary.overallHealth}</span>
        </div>
      </div>

      <div className='summary-stats'>
        <div className='summary-stat'>
          <span className='stat-label'>Tiempo:</span>
          <span className='stat-value'>{report.summary.trackingTime}s</span>
        </div>
        <div className='summary-stat'>
          <span className='stat-label'>Componentes:</span>
          <span className='stat-value'>{report.summary.totalComponents}</span>
        </div>
        <div className='summary-stat'>
          <span className='stat-label'>Categorías:</span>
          <span className='stat-value'>{report.summary.totalCategories}</span>
        </div>
      </div>
    </div>
  );
};

SummarySection.propTypes = {
  report: PropTypes.object,
};

// Componente para mostrar recomendaciones
const RecommendationsSection = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) return;

  return (
    <div className='recommendations-section'>
      <h3>💡 Recomendaciones</h3>
      <div className='recommendations-list'>
        {recommendations.slice(0, 3).map((rec) => (
          <div
            key={`${rec.type}-${rec.message.replaceAll(/\s+/g, '-').slice(0, 30)}`}
            className={`recommendation-item ${rec.type.toLowerCase()}`}
          >
            <div className='recommendation-header'>
              {rec.type === 'CRITICAL' ? <AlertTriangle size={14} /> : <TrendingUp size={14} />}
              <span className='recommendation-message'>{rec.message}</span>
            </div>
            {rec.action && (
              <div className='recommendation-action'>
                <span className='action-label'>Acción:</span>
                <span className='action-text'>{rec.action}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

RecommendationsSection.propTypes = {
  recommendations: PropTypes.array,
};

// Función auxiliar para iniciar tracking
const startTracking = (updateInterval, setReport) => {
  // REMOVIDO: enhancedRenderTracker.startAutoReporting causaba feedback loop de renders
  // Solo generamos el reporte sin activar el auto-reporting
  const updateData = () => {
    const newReport = enhancedRenderTracker.generateDetailedReport();
    setReport(newReport);
  };

  updateData(); // Actualización inicial
  return setInterval(updateData, updateInterval);
};

// Función auxiliar para detener tracking
const stopTracking = (intervalRef) => {
  if (intervalRef) {
    clearInterval(intervalRef);
  }
  // REMOVIDO: enhancedRenderTracker.stopAutoReporting() - ya no usamos auto-reporting
};

// Hook personalizado para manejar el tracking
const useTrackingState = (autoStart, updateInterval) => {
  const [isTracking, setIsTracking] = useState(autoStart);
  const [report, setReport] = useState();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isTracking) {
      intervalRef.current = startTracking(updateInterval, setReport);
    }
    return () => {
      stopTracking(intervalRef.current);
    };
  }, [isTracking, updateInterval]);

  const toggleTracking = useCallback(() => {
    setIsTracking((previous) => !previous);
    if (!isTracking) {
      enhancedRenderTracker.reset();
      setReport();
    }
  }, [isTracking]);

  return { isTracking, report, toggleTracking };
};

// Hook para manejar categorías expandidas
const useCategoryExpansion = (defaultExpandedCategories) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set(defaultExpandedCategories));

  const toggleCategory = useCallback((categoryKey) => {
    setExpandedCategories((previous) => {
      const newSet = new Set(previous);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  }, []);

  const getAllCategoryKeys = useCallback((categories) => {
    const allCategories = [];
    for (const key in categories) {
      if (Object.prototype.hasOwnProperty.call(categories, key)) {
        allCategories.push(key);
      }
    }
    return allCategories;
  }, []);

  const toggleAllCategories = useCallback(
    (report) => {
      if (expandedCategories.size > 0) {
        setExpandedCategories(new Set());
      } else {
        const categories = report?.categories ?? {};
        const allKeys = getAllCategoryKeys(categories);
        setExpandedCategories(new Set(allKeys));
      }
    },
    [expandedCategories, getAllCategoryKeys],
  );

  return { expandedCategories, toggleCategory, toggleAllCategories };
};

// Hook para filtrado de búsqueda
const useSearchFilter = (report, searchTerm) => {
  const filterComponents = useCallback((components, searchLower) => {
    return components.filter((comp) => comp.component.toLowerCase().includes(searchLower));
  }, []);

  const categoryMatches = useCallback((category, matchingComponents, searchLower) => {
    return matchingComponents.length > 0 || category.name.toLowerCase().includes(searchLower);
  }, []);

  const filteredCategories = useMemo(() => {
    if (!report || !report.categories) return {};
    if (!searchTerm) return report.categories;

    const filtered = {};
    const searchLower = searchTerm.toLowerCase();

    for (const [key, category] of Object.entries(report.categories)) {
      const matchingComponents = filterComponents(category.components, searchLower);

      if (categoryMatches(category, matchingComponents, searchLower)) {
        Object.assign(filtered, {
          [key]: {
            ...category,
            components: matchingComponents.length > 0 ? matchingComponents : category.components,
          },
        });
      }
    }

    return filtered;
  }, [report, searchTerm, filterComponents, categoryMatches]);

  return filteredCategories;
};

// Componente para el botón minimizado
const MinimizedButton = ({ report, onOpen }) => (
  <div className='enhanced-monitor-toggle'>
    <button
      onClick={onOpen}
      className='enhanced-toggle-btn'
      title='Abrir Monitor de Rendimiento Avanzado'
    >
      <BarChart3 size={20} />
      {report && <span className='monitor-badge'>{report.summary?.totalComponents ?? 0}</span>}
    </button>
  </div>
);

MinimizedButton.propTypes = {
  report: PropTypes.object,
  onOpen: PropTypes.func.isRequired,
};

// Componente para el header del monitor
const MonitorHeader = ({
  isTracking,
  isMinimized,
  expandedCategories,
  report,
  toggleTracking,
  toggleAllCategories,
  setIsMinimized,
  setIsVisible,
}) => (
  <div className='monitor-header'>
    <div className='monitor-title'>
      <BarChart3 size={18} />
      <span>Monitor de Rendimiento Avanzado</span>
      <div className={`tracking-indicator ${isTracking ? 'active' : 'inactive'}`}>
        {isTracking ? '🟢' : '🔴'}
      </div>
    </div>

    <div className='monitor-controls'>
      <button
        onClick={toggleTracking}
        className={`control-btn ${isTracking ? 'stop' : 'start'}`}
        title={isTracking ? 'Detener' : 'Iniciar'}
      >
        {isTracking ? 'Detener' : 'Iniciar'}
      </button>

      {!isMinimized && (
        <button
          onClick={() => toggleAllCategories(report)}
          className='control-btn'
          title='Expandir/Colapsar Todo'
        >
          {expandedCategories.size > 0 ? 'Colapsar' : 'Expandir'}
        </button>
      )}

      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className='control-btn'
        title={isMinimized ? 'Expandir' : 'Minimizar'}
      >
        {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
      </button>

      <button onClick={() => setIsVisible(false)} className='control-btn close' title='Cerrar'>
        <X size={14} />
      </button>
    </div>
  </div>
);

MonitorHeader.propTypes = {
  isTracking: PropTypes.bool.isRequired,
  isMinimized: PropTypes.bool.isRequired,
  expandedCategories: PropTypes.instanceOf(Set).isRequired,
  report: PropTypes.object,
  toggleTracking: PropTypes.func.isRequired,
  toggleAllCategories: PropTypes.func.isRequired,
  setIsMinimized: PropTypes.func.isRequired,
  setIsVisible: PropTypes.func.isRequired,
};

// Componente para el contenido del monitor
const MonitorContent = ({
  report,
  searchTerm,
  setSearchTerm,
  filteredCategories,
  expandedCategories,
  toggleCategory,
  showRecommendations,
}) => (
  <div className='monitor-content'>
    <div className='search-bar'>
      <input
        type='text'
        placeholder='Buscar componente...'
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        className='search-input'
      />
    </div>

    <SummarySection report={report} />

    <div className='categories-container'>
      {Object.entries(filteredCategories).map(([key, category]) => (
        <CategorySection
          key={key}
          categoryKey={key}
          category={category}
          isExpanded={expandedCategories.has(key)}
          onToggle={toggleCategory}
        />
      ))}
    </div>

    {showRecommendations && report && (
      <RecommendationsSection recommendations={report.recommendations} />
    )}
  </div>
);

MonitorContent.propTypes = {
  report: PropTypes.object,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  filteredCategories: PropTypes.object.isRequired,
  expandedCategories: PropTypes.instanceOf(Set).isRequired,
  toggleCategory: PropTypes.func.isRequired,
  showRecommendations: PropTypes.bool.isRequired,
};

// Componente principal del monitor mejorado
const EnhancedPerformanceMonitor = ({
  autoStart = false,
  updateInterval = 1000,
  showRecommendations = true,
  defaultExpandedCategories = ['FLOW_NODES', 'AI_NODES'],
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { isTracking, report, toggleTracking } = useTrackingState(autoStart, updateInterval);
  const { expandedCategories, toggleCategory, toggleAllCategories } =
    useCategoryExpansion(defaultExpandedCategories);
  const filteredCategories = useSearchFilter(report, searchTerm);

  if (!isVisible) {
    return <MinimizedButton report={report} onOpen={() => setIsVisible(true)} />;
  }

  return (
    <div className={`enhanced-performance-monitor ${isMinimized ? 'minimized' : ''}`}>
      <MonitorHeader
        isTracking={isTracking}
        isMinimized={isMinimized}
        expandedCategories={expandedCategories}
        report={report}
        toggleTracking={toggleTracking}
        toggleAllCategories={toggleAllCategories}
        setIsMinimized={setIsMinimized}
        setIsVisible={setIsVisible}
      />

      {!isMinimized && (
        <MonitorContent
          report={report}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredCategories={filteredCategories}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          showRecommendations={showRecommendations}
        />
      )}
    </div>
  );
};

EnhancedPerformanceMonitor.propTypes = {
  autoStart: PropTypes.bool,
  updateInterval: PropTypes.number,
  showRecommendations: PropTypes.bool,
  defaultExpandedCategories: PropTypes.arrayOf(PropTypes.string),
};

export default EnhancedPerformanceMonitor;
