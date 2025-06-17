/**
 * Componente para monitorear el rendimiento del editor de flujos.
 * Muestra estad\u00edsticas \u00fatiles como FPS, n\u00famero de nodos, memoria utilizada, etc.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import useFlowStore from '@/stores/useFlowStore';

const PerformanceMonitor = ({ flowInstance, getStats }) => {
  // Estados para monitoreo
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({
    fps: 0,
    totalNodes: 0,
    visibleNodes: 0,
    memory: 0,
    renderTime: 0
  });
  
  // Referencias para medici\u00f3n
  const frameTimeRef = useRef([]);
  const lastUpdateRef = useRef(Date.now());
  const animationFrameRef = useRef(null);
  // Obtener los nodos y aristas del store
  const nodes = useFlowStore(state => state.nodes);
  const edges = useFlowStore(state => state.edges);
  
  // Medici\u00f3n del uso aproximado de memoria
  const measureMemoryUsage = () => {
    if (window.performance && window.performance.memory) {
      return Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
    }
    return 0;
  };
  
  // Formato para n\u00fameros
  const format = (num) => Math.round(num * 10) / 10;
  
  // Medir y actualizar rendimiento
  const updatePerformance = () => {
    const now = performance.now();
    const elapsed = now - lastUpdateRef.current;
    lastUpdateRef.current = now;
    
    // Calcular FPS
    frameTimeRef.current.push(elapsed);
    if (frameTimeRef.current.length > 30) {
      frameTimeRef.current.shift();
    }
    
    const avgFrameTime = frameTimeRef.current.reduce((sum, time) => sum + time, 0) / 
                         Math.max(1, frameTimeRef.current.length);
    const currentFps = 1000 / Math.max(1, avgFrameTime);
    
    // Obtener estad\u00edsticas de virtualizaci\u00f3n si est\u00e1n disponibles
    let virtualStats = { totalNodes: nodes.length, visibleNodes: nodes.length };
    if (typeof getStats === 'function') {
      virtualStats = getStats() || virtualStats;
    }
    
    // Actualizar estad\u00edsticas
    setStats({
      fps: format(currentFps),
      totalNodes: nodes.length,
      visibleNodes: virtualStats.visibleNodes,
      totalEdges: edges.length,
      memory: measureMemoryUsage(),
      renderTime: format(avgFrameTime)
    });
    
    // Programar siguiente actualizaci\u00f3n
    animationFrameRef.current = requestAnimationFrame(updatePerformance);
  };
  
  // Iniciar/detener monitor
  useEffect(() => {
    if (isOpen) {
      updatePerformance();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, nodes.length, edges.length]);
  
  // Determinar color seg\u00fan rendimiento
  const getStatusColor = useMemo(() => {
    const { fps } = stats;
    if (fps >= 50) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  }, [stats.fps]);
  
  // No renderizar nada si est\u00e1 cerrado
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-50 opacity-70 hover:opacity-100"
        title="Mostrar monitor de rendimiento"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm1 0v12h12V3H4z" clipRule="evenodd" />
          <path d="M5 8h2v6H5zM9 5h2v9H9zM13 7h2v7h-2z" />
        </svg>
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 bg-opacity-80 text-white p-4 rounded-lg shadow-lg z-50 min-w-[240px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Monitor de Rendimiento</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>FPS:</span> 
          <span className={getStatusColor}>{stats.fps}</span>
        </div>
        <div className="flex justify-between">
          <span>Tiempo de render:</span> 
          <span>{stats.renderTime} ms</span>
        </div>
        <div className="flex justify-between">
          <span>Nodos totales:</span> 
          <span>{stats.totalNodes}</span>
        </div>
        <div className="flex justify-between">
          <span>Nodos visibles:</span> 
          <span>{stats.visibleNodes} ({Math.round(stats.visibleNodes/Math.max(1,stats.totalNodes)*100)}%)</span>
        </div>
        <div className="flex justify-between">
          <span>Aristas:</span> 
          <span>{stats.totalEdges}</span>
        </div>
        {stats.memory > 0 && (
          <div className="flex justify-between">
            <span>Memoria JS:</span> 
            <span>{stats.memory} MB</span>
          </div>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
        Optimizaci\u00f3n {stats.visibleNodes < stats.totalNodes ? 'activa' : 'inactiva'}
      </div>
    </div>
  );
};

export default PerformanceMonitor;
