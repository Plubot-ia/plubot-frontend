import PropTypes from 'prop-types';
import React, { useState, useCallback, Profiler, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';

import FlowMain from '../onboarding/flow-editor/components/FlowMain';

// Estilos para la herramienta de benchmarking
const benchmarkStyles = {
  container: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
  },
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

  for (let index = 0; index < count; index++) {
    const x = (index % gridWidth) * spacing;
    const y = Math.floor(index / gridWidth) * spacing;
    const type = nodeTypes[index % nodeTypes.length];

    nodes.push({
      id: `node-${index}`,
      type,
      position: { x, y },
      data: { label: `Nodo ${index + 1}` },
    });
  }

  return { nodes, edges: [] };
};

const BenchmarkControls = ({ handleGenerate, handleDownloadResults, nodeCount }) => (
  <div style={benchmarkStyles.controls}>
    <span style={benchmarkStyles.info}>Herramienta de Benchmark</span>
    <button style={benchmarkStyles.button} onClick={() => handleGenerate(200)}>
      Generar 200 Nodos
    </button>
    <button style={benchmarkStyles.button} onClick={() => handleGenerate(500)}>
      Generar 500 Nodos
    </button>
    <button style={benchmarkStyles.button} onClick={() => handleGenerate(1000)}>
      Generar 1000 Nodos
    </button>
    <button style={benchmarkStyles.button} onClick={handleDownloadResults}>
      Descargar Resultados
    </button>
    <span style={benchmarkStyles.info}>Nodos Actuales: {nodeCount}</span>
    <span style={benchmarkStyles.info}>
      (La recolección de métricas se realiza en segundo plano)
    </span>
  </div>
);

const FlowBenchmarkTool = () => {
  const [flowData, setFlowData] = useState({ nodes: [], edges: [] });
  const [isFlowVisible, setIsFlowVisible] = useState(true);
  const benchmarkResults = useRef([]);

  const runGeneration = useCallback((count) => {
    benchmarkResults.current = [];
    const newFlow = generateGridNodes(count);
    setFlowData(newFlow);
    setIsFlowVisible(true);
  }, []);

  const handleGenerate = useCallback(
    (count) => {
      setIsFlowVisible(false);
      setTimeout(() => runGeneration(count), 100);
    },
    [runGeneration],
  );

  const handleDownloadResults = () => {
    const allResults = benchmarkResults.current;
    const mountResults = allResults.filter((r) => r.phase === 'mount' && r.nodeCount > 0);

    if (mountResults.length === 0) {
      return;
    }

    const dataString = JSON.stringify(mountResults, undefined, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataString)}`;
    const exportFileDefaultName = 'flow-benchmark-results.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.append(linkElement);
    linkElement.click();
    linkElement.remove();
  };

  const onRenderCallback = (
    id,
    phase,
    ...timingParams // actualDuration, baseDuration, startTime, commitTime
  ) => {
    const [actualDuration, baseDuration] = timingParams;
    const nodeCount = Number.parseInt(id.split('-')[1], 10) ?? 0;

    const renderData = {
      profilerId: id,
      nodeCount,
      phase,
      renderDuration_ms: Number.parseFloat(actualDuration.toFixed(2)),
      baseDuration_ms: Number.parseFloat(baseDuration.toFixed(2)),
      timestamp: new Date().toISOString(),
    };

    benchmarkResults.current.push(renderData);
  };

  return (
    <div style={benchmarkStyles.container}>
      <BenchmarkControls
        handleGenerate={handleGenerate}
        handleDownloadResults={handleDownloadResults}
        nodeCount={flowData.nodes.length}
      />
      <div style={benchmarkStyles.flowContainer}>
        {isFlowVisible && (
          <Profiler id={`FlowMainBenchmark-${flowData.nodes.length}`} onRender={onRenderCallback}>
            <ReactFlowProvider>
              <FlowMain nodes={flowData.nodes} edges={flowData.edges} />
            </ReactFlowProvider>
          </Profiler>
        )}
      </div>
    </div>
  );
};

// PropTypes validation for BenchmarkControls
BenchmarkControls.propTypes = {
  handleGenerate: PropTypes.func.isRequired,
  handleDownloadResults: PropTypes.func.isRequired,
  nodeCount: PropTypes.number.isRequired,
};

export default FlowBenchmarkTool;
