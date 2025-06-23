import React, { useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';
import ByteGuide from "../../components/pluniverse/ByteGuide.jsx";

const initialNodes = [
  { id: '1', type: 'input', data: { label: 'Inicio de conversación' }, position: { x: 250, y: 5 } },
  { id: '2', data: { label: 'Enviar mensaje: Hola, ¿en qué puedo ayudarte hoy?' }, position: { x: 250, y: 100 } },
  { id: '3', data: { label: 'Rama de decisión' }, position: { x: 250, y: 200 } },
  { id: '4', data: { label: 'Opción A' }, position: { x: 100, y: 300 } },
  { id: '5', data: { label: 'Opción B' }, position: { x: 400, y: 300 } },
  { id: '6', data: { label: 'Enviar a WhatsApp' }, position: { x: 250, y: 400 } },
  { id: '7', type: 'output', data: { label: 'Finalizar flujo' }, position: { x: 250, y: 500 } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e3-5', source: '3', target: '5' },
  { id: 'e4-6', source: '4', target: '6' },
  { id: 'e5-6', source: '5', target: '6' },
  { id: 'e6-7', source: '6', target: '7' },
];

const PlubotStudio = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  return (
    <div className="plubot-studio" style={{ height: '100vh' }}>
      <div className="studio-header" style={{ padding: '1rem', background: '#f0f0f0' }}>
        <h1>Plubot Studio - Zentro el Estratega</h1>
        <button style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>Vista previa</button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => setNodes((nds) => applyNodeChanges(changes, nds))}
        onEdgesChange={(changes) => setEdges((eds) => applyEdgeChanges(changes, eds))}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <ByteGuide message="Buen movimiento. Este flujo activará tu Plubot cada vez que un nuevo cliente diga ‘hola’." />
    </div>
  );
};

export default PlubotStudio;