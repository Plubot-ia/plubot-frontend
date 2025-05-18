import React from 'react';
import './RouteAnalysisPanel.css';

const RouteAnalysisPanel = ({ analysis, onClose }) => (
  <div className="ts-route-analysis-panel">
    <div className="ts-panel-header">
      <h3>Análisis de Rutas</h3>
      <button onClick={onClose}>✕</button>
    </div>
    <div className="ts-analysis-results">
      <p><strong>Rutas totales:</strong> {analysis.totalRoutes}</p>
      <p><strong>Rutas completas:</strong> {analysis.completeRoutes}</p>
      <p><strong>Rutas incompletas:</strong> {analysis.incompleteRoutes}</p>
      {analysis.orphanedNodes.length > 0 && (
        <p><strong>Nodos huérfanos:</strong> {analysis.orphanedNodes.join(', ')}</p>
      )}
      {analysis.deadEndNodes.length > 0 && (
        <p><strong>Nodos sin salida:</strong> {analysis.deadEndNodes.join(', ')}</p>
      )}
      <p><strong>Ruta más larga:</strong> {analysis.longestRoute.path.join(' → ')} ({analysis.longestRoute.length} nodos)</p>
    </div>
  </div>
);

export default RouteAnalysisPanel;