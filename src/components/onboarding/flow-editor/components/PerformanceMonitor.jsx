/**
 * Componente para monitorear el rendimiento del editor de flujos.
 * Muestra estad\u00edsticas \u00fatiles como FPS, n\u00famero de nodos, memoria utilizada, etc.
 */
import PropTypes from 'prop-types';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import useFlowStore from '@/stores/use-flow-store';

// Helper para renderizar botón minimizado
const _renderMinimizedButton = (onClick) => (
  <button
    onClick={onClick}
    className='fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-50 opacity-70 hover:opacity-100'
    title='Mostrar monitor de rendimiento'
  >
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className='h-5 w-5'
      viewBox='0 0 20 20'
      fill='currentColor'
    >
      <path
        fillRule='evenodd'
        d='M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm1 0v12h12V3H4z'
        clipRule='evenodd'
      />
      <path d='M5 8h2v6H5zM9 5h2v9H9zM13 7h2v7h-2z' />
    </svg>
  </button>
);

// Helper para renderizar panel expandido con estadísticas
const _renderExpandedPanel = (stats, getStatusColor, onClose) => (
  <div className='fixed bottom-4 right-4 bg-gray-800 bg-opacity-80 text-white p-4 rounded-lg shadow-lg z-50 min-w-[240px]'>
    <div className='flex justify-between items-center mb-2'>
      <h3 className='font-semibold'>Monitor de Rendimiento</h3>
      <button onClick={onClose} className='text-gray-400 hover:text-white'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-5 w-5'
          viewBox='0 0 20 20'
          fill='currentColor'
        >
          <path
            fillRule='evenodd'
            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
            clipRule='evenodd'
          />
        </svg>
      </button>
    </div>

    <div className='space-y-1 text-sm'>
      <div className='flex justify-between'>
        <span>FPS:</span>
        <span className={getStatusColor}>{stats.fps}</span>
      </div>
      <div className='flex justify-between'>
        <span>Tiempo de render:</span>
        <span>{stats.renderTime} ms</span>
      </div>
      <div className='flex justify-between'>
        <span>Nodos totales:</span>
        <span>{stats.totalNodes}</span>
      </div>
      <div className='flex justify-between'>
        <span>Nodos visibles:</span>
        <span>
          {stats.visibleNodes} (
          {Math.round((stats.visibleNodes / Math.max(1, stats.totalNodes)) * 100)}
          %)
        </span>
      </div>
      <div className='flex justify-between'>
        <span>Aristas:</span>
        <span>{stats.totalEdges}</span>
      </div>
      {stats.memory > 0 && (
        <div className='flex justify-between'>
          <span>Memoria JS:</span>
          <span>{stats.memory} MB</span>
        </div>
      )}
    </div>

    <div className='mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400'>
      Optimización {stats.visibleNodes < stats.totalNodes ? 'activa' : 'inactiva'}
    </div>
  </div>
);

// Funciones utilitarias movidas al scope externo
const measureMemoryUsage = () => {
  if (globalThis.performance && globalThis.performance.memory) {
    return Math.round(globalThis.performance.memory.usedJSHeapSize / (1024 * 1024));
  }
  return 0;
};

const format = (numberToFormat) => Math.round(numberToFormat * 10) / 10;

// Helper para cálculo de estadísticas de performance
const _calculatePerformanceStats = ({
  frameTimeReference,
  lastUpdateReference,
  nodeCount,
  edgeCount,
  getStats,
}) => {
  const now = performance.now();
  const elapsed = now - lastUpdateReference.current;
  lastUpdateReference.current = now;

  // Calcular FPS
  frameTimeReference.current.push(elapsed);
  if (frameTimeReference.current.length > 30) {
    frameTimeReference.current.shift();
  }

  const avgFrameTime =
    frameTimeReference.current.reduce((sum, time) => sum + time, 0) /
    Math.max(1, frameTimeReference.current.length);
  const currentFps = 1000 / Math.max(1, avgFrameTime);

  // Obtener estadísticas de virtualización si están disponibles
  let virtualStats = { totalNodes: nodeCount, visibleNodes: nodeCount };
  if (typeof getStats === 'function') {
    virtualStats = getStats() || virtualStats;
  }

  return {
    fps: format(currentFps),
    totalNodes: nodeCount,
    visibleNodes: virtualStats.visibleNodes,
    totalEdges: edgeCount,
    memory: measureMemoryUsage(),
    renderTime: format(avgFrameTime),
  };
};

const PerformanceMonitor = ({ getStats }) => {
  // Estados para monitoreo
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({
    fps: 0,
    totalNodes: 0,
    visibleNodes: 0,
    memory: 0,
    renderTime: 0,
  });

  // Referencias para medici\u00f3n
  const frameTimeReference = useRef([]);
  const lastUpdateReference = useRef(Date.now());
  const animationFrameReference = useRef(null);
  // OPTIMIZADO: Usar contadores en lugar de arrays completos para evitar re-renders
  const nodeCount = useFlowStore((state) => state.nodeCount);
  const edgeCount = useFlowStore((state) => state.edgeCount);

  // Medir y actualizar rendimiento - OPTIMIZADO: Solo actualizar cada 500ms
  const updatePerformance = useCallback(() => {
    const newStats = _calculatePerformanceStats({
      frameTimeReference,
      lastUpdateReference,
      nodeCount,
      edgeCount,
      getStats,
    });

    setStats(newStats);

    // OPTIMIZACIÓN: Actualizar solo cada 500ms en lugar de 60fps
    // Esto reduce los renders de 60/s a 2/s
    setTimeout(() => {
      if (isOpen) {
        animationFrameReference.current = requestAnimationFrame(updatePerformance);
      }
    }, 500);
  }, [nodeCount, edgeCount, getStats, isOpen]);

  // Iniciar/detener monitor
  useEffect(() => {
    if (isOpen) {
      updatePerformance();
    } else if (animationFrameReference.current) {
      cancelAnimationFrame(animationFrameReference.current);
    }

    return () => {
      if (animationFrameReference.current) {
        cancelAnimationFrame(animationFrameReference.current);
      }
    };
  }, [isOpen, updatePerformance]);

  // Determinar color según rendimiento
  const { fps } = stats;
  const getStatusColor = useMemo(() => {
    if (fps >= 50) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  }, [fps]);

  // No renderizar nada si est\u00e1 cerrado
  if (!isOpen) {
    return _renderMinimizedButton(() => setIsOpen(true));
  }

  return _renderExpandedPanel(stats, getStatusColor, () => setIsOpen(false));
};

PerformanceMonitor.propTypes = {
  getStats: PropTypes.func,
};

export default PerformanceMonitor;
