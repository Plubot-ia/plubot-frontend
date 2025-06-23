import React, { useState, useCallback, Profiler, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import FlowMain from '../onboarding/flow-editor/components/FlowMain';

// Estilos para la herramienta de benchmarking
const benchmarkStyles = {
  container: { height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' },
  controls: {
    padding: '10px',
    backgroundColor: '#2d3748',
    color: 'white',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    alignItems: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 10,
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#4a5568',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  info: { fontWeight: 'bold', marginRight: '15px' },
  flowContainer: { flex: 1, backgroundColor: '#1a202c' },
};

/**
 * Genera una grilla de nodos para pruebas de estrés.
 * @param {number} count - El número total de nodos a generar.
 * @returns {{nodes: Array, edges: Array}}
 */
const generateGridNodes = (count) => {
  const nodes = [];
  const nodeTypes = ['message', 'decision', 'action', 'ai'];
  const gridWidth = Math.ceil(Math.sqrt(count));
  const spacing = 400;

  for (let i = 0; i < count; i++) {
    const x = (i % gridWidth) * spacing;
    const y = Math.floor(i / gridWidth) * spacing;
    const type = nodeTypes[i % nodeTypes.length];

    nodes.push({
      id: `node-${i}`,
      type,
      position: { x, y },
      data: { label: `Nodo ${i + 1}` },
    });
  }

  return { nodes, edges: [] };
};

const FlowBenchmarkTool = () => {
  const [flowData, setFlowData] = useState({ nodes: [], edges: [] });
  const [isFlowVisible, setIsFlowVisible] = useState(true);
  const benchmarkResults = useRef([]);

  const handleGenerate = useCallback((count) => {
    // 1. Forzar desmontaje del componente para asegurar un benchmark de montaje limpio
    setIsFlowVisible(false);

    // 2. Usar un timeout para permitir que React procese el desmontaje
    setTimeout(() => {
      // 3. Limpiar resultados y generar nuevos datos
      benchmarkResults.current = [];
      const newFlow = generateGridNodes(count);
      setFlowData(newFlow);

      // 4. Volver a montar el componente
      setIsFlowVisible(true);
    }, 100); // 100ms es un margen seguro para el desmontaje
  }, []);

  const handleDownloadResults = () => {
    const allResults = benchmarkResults.current;
    const mountResults = allResults.filter(r => r.phase === 'mount' && r.nodeCount > 0);

    if (mountResults.length === 0) {
      alert("No se han registrado benchmarks de montaje válidos. Por favor, genera algunos nodos para forzar el re-montaje del editor.");
      return;
    }

    const dataStr = JSON.stringify(mountResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'flow-benchmark-results.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  const onRenderCallback = (
    id, phase, actualDuration, baseDuration, startTime, commitTime
  ) => {
    const nodeCount = parseInt(id.split('-')[1], 10) || 0;

    const renderData = {
      profilerId: id,
      nodeCount: nodeCount,
      phase,
      renderDuration_ms: parseFloat(actualDuration.toFixed(2)),
      baseDuration_ms: parseFloat(baseDuration.toFixed(2)),
      timestamp: new Date().toISOString(),
    };

    benchmarkResults.current.push(renderData);
  };

  return (
    <div style={benchmarkStyles.container}>
      <div style={benchmarkStyles.controls}>
        <span style={benchmarkStyles.info}>Herramienta de Benchmark</span>
        <button style={benchmarkStyles.button} onClick={() => handleGenerate(200)}>Generar 200 Nodos</button>
        <button style={benchmarkStyles.button} onClick={() => handleGenerate(500)}>Generar 500 Nodos</button>
        <button style={benchmarkStyles.button} onClick={() => handleGenerate(1000)}>Generar 1000 Nodos</button>
        <button style={benchmarkStyles.button} onClick={handleDownloadResults}>Descargar Resultados</button>
        <span style={benchmarkStyles.info}>Nodos Actuales: {flowData.nodes.length}</span>
        <span style={benchmarkStyles.info}>(La recolección de métricas se realiza en segundo plano)</span>
      </div>
      <div style={benchmarkStyles.flowContainer}>
        {isFlowVisible && (
          <Profiler id={`FlowMainBenchmark-${flowData.nodes.length}`} onRender={onRenderCallback}>
            <ReactFlowProvider>
              <FlowMain
                nodes={flowData.nodes}
                edges={flowData.edges}
              />
            </ReactFlowProvider>
          </Profiler>
        )}
      </div>
    </div>
  );
};

export default FlowBenchmarkTool;
