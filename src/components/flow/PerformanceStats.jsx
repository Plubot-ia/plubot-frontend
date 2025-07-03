import { Gauge, Cpu, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

import useFlowStore from '@/stores/use-flow-store';

/**
 * Componente que muestra estadísticas de rendimiento del editor de flujo.
 * Incluye información sobre nodos, aristas, memoria y tiempo de guardado.
 */
const PerformanceStats = () => {
  const [expanded, setExpanded] = useState(false);
  const [saveTime, setSaveTime] = useState();
  const [memoryUsage, setMemoryUsage] = useState();

  // Obtener datos del store
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const lastSaved = useFlowStore((state) => state.lastSaved);
  const isSaving = useFlowStore((state) => state.isSaving);
  const saveFlow = useFlowStore((state) => state.saveFlow);

  // Calcular estadísticas de rendimiento
  useEffect(() => {
    // Simular medición de uso de memoria
    // En un entorno real, esto podría venir de una API de rendimiento
    if (nodes.length > 0 || edges.length > 0) {
      const estimatedMemory = (nodes.length * 2 + edges.length) * 10;
      setMemoryUsage(estimatedMemory);
    } else {
      setMemoryUsage(0);
    }
  }, [nodes, edges]);

  // Medir tiempo de guardado
  const handleSave = async () => {
    const startTime = performance.now();
    await saveFlow();
    const endTime = performance.now();
    setSaveTime(endTime - startTime);
  };

  // Formatear el tiempo desde el último guardado
  const formatLastSaved = () => {
    if (!lastSaved) return 'Nunca';

    const lastSavedDate = new Date(lastSaved);
    const now = new Date();
    const diffMs = now - lastSavedDate;

    // Convertir a segundos
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) {
      return `hace ${diffSec} segundos`;
    } else if (diffSec < 3600) {
      const minutes = Math.floor(diffSec / 60);
      return `hace ${minutes} minutos`;
    } else {
      return lastSavedDate.toLocaleTimeString();
    }
  };

  // Formatear el tiempo de guardado
  const formatSaveTime = () => {
    if (saveTime === undefined) return 'N/A';

    return saveTime < 100
      ? `${saveTime.toFixed(1)} ms`
      : `${(saveTime / 1000).toFixed(2)} s`;
  };

  // Formatear el uso de memoria
  const formatMemoryUsage = () => {
    if (memoryUsage === undefined) return 'N/A';

    return memoryUsage < 1024
      ? `${memoryUsage} KB`
      : `${(memoryUsage / 1024).toFixed(1)} MB`;
  };

  // Calcular la eficiencia de las actualizaciones incrementales
  const calculateEfficiency = () => {
    if (!saveTime || nodes.length === 0) return 0;

    // Fórmula simple: menor tiempo = mayor eficiencia
    // Normalizado para que 100ms o menos sea 100% eficiente
    const baseEfficiency = 100 - Math.min(90, saveTime / 10);

    // Ajustar por complejidad (más nodos/aristas = más difícil ser eficiente)
    const complexity = Math.log(nodes.length + edges.length) / Math.log(10);

    return Math.max(0, Math.min(100, baseEfficiency + complexity * 5));
  };

  return (
    <div
      className='performance-stats-container'
      style={{
        position: 'absolute',
        top: '80px',
        right: '16px',
        zIndex: 1000,
        borderRadius: '8px',
        overflow: 'hidden',
        width: expanded ? '280px' : 'auto',
        transition: 'width 0.3s ease',
        backgroundColor: '#1a1a2e',
        border: '1px solid rgba(0, 195, 255, 0.3)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        className='performance-stats-header'
        role='button'
        tabIndex={0}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: expanded ? 'space-between' : 'center',
          padding: '8px 12px',
          backgroundColor: '#0f0f1b',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid rgba(0, 195, 255, 0.2)' : 'none',
        }}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            setExpanded(!expanded);
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Gauge
            size={18}
            color='#00c3ff'
            style={{ marginRight: expanded ? '8px' : '0' }}
          />
          {expanded && (
            <span
              style={{ fontSize: '14px', fontWeight: 500, color: '#e0e0e0' }}
            >
              Estadísticas de rendimiento
            </span>
          )}
        </div>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            padding: '4px',
          }}
        >
          {expanded ? (
            <ChevronUp size={16} color='#e0e0e0' />
          ) : (
            <ChevronDown size={16} color='#e0e0e0' />
          )}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '16px', backgroundColor: '#1a1a2e' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#a0a0a0' }}>Nodos:</span>
            <span
              style={{ fontSize: '13px', fontWeight: 500, color: '#e0e0e0' }}
            >
              {nodes.length}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#a0a0a0' }}>Aristas:</span>
            <span
              style={{ fontSize: '13px', fontWeight: 500, color: '#e0e0e0' }}
            >
              {edges.length}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#a0a0a0' }}>
              Memoria estimada:
            </span>
            <span
              style={{ fontSize: '13px', fontWeight: 500, color: '#e0e0e0' }}
            >
              {formatMemoryUsage()}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#a0a0a0' }}>
              Último guardado:
            </span>
            <span
              style={{ fontSize: '13px', fontWeight: 500, color: '#e0e0e0' }}
            >
              {formatLastSaved()}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#a0a0a0' }}>
              Tiempo de guardado:
            </span>
            <span
              style={{ fontSize: '13px', fontWeight: 500, color: '#e0e0e0' }}
            >
              {formatSaveTime()}
            </span>
          </div>

          {saveTime && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontSize: '13px', color: '#a0a0a0' }}>
                  Eficiencia:
                </span>
                <div title='Eficiencia de las actualizaciones incrementales. Mayor porcentaje indica mejor rendimiento.'>
                  <Info size={14} color='#a0a0a0' />
                </div>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#2a2a40',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${calculateEfficiency()}%`,
                    height: '100%',
                    backgroundColor: (() => {
                      const efficiency = calculateEfficiency();
                      if (efficiency > 80) return '#4caf50';
                      if (efficiency > 50) return '#ff9800';
                      return '#f44336';
                    })(),
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '4px',
                }}
              >
                <span style={{ fontSize: '11px', color: '#a0a0a0' }}>
                  {calculateEfficiency().toFixed(0)}% optimizado
                </span>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '16px',
            }}
          >
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(0, 195, 255, 0.5)',
                borderRadius: '4px',
                color: '#00c3ff',
                fontSize: '12px',
                fontWeight: 500,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                transition: 'all 0.2s ease',
              }}
              onClick={handleSave}
              disabled={isSaving}
            >
              <Cpu size={14} style={{ marginRight: '6px' }} />
              {isSaving ? 'Guardando...' : 'Probar rendimiento'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

PerformanceStats.propTypes = {};

export default PerformanceStats;
