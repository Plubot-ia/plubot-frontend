// src/components/steps/Step3Customization.jsx
import { Suspense, lazy } from 'react';
import { useNodesState, useEdgesState, addEdge } from 'reactflow';
import { ReactFlowProvider } from 'reactflow';
import { nodeTypes } from '../CustomNode';
import PreviewChat from '../PreviewChat';

// Lazy load de ReactFlow y componentes relacionados
const ReactFlow = lazy(() => import('reactflow').then((module) => ({ default: module.ReactFlow })));
const Background = lazy(() => import('reactflow').then((module) => ({ default: module.Background })));
const Controls = lazy(() => import('reactflow').then((module) => ({ default: module.Controls })));

const Step3Customization = ({ onNext, onBack, formData, setFormData }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(formData.nodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(formData.edges || []);

    const updateFlowFromNode = (id, updatedData) => {
        setNodes((nds) =>
            nds.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...updatedData } } : node))
        );
    };

    const onConnect = (params) => {
        setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#00e0ff' } }, eds));
    };

    const addNewNode = () => {
        const newId = `node-${nodes.length}`;
        const newNode = {
            id: newId,
            type: 'custom',
            data: {
                userMessage: '',
                botResponse: '',
                condition: '',
                action: { type: 'none', value: '' },
                onChange: updateFlowFromNode,
            },
            position: { x: 250, y: nodes.length * 100 + 50 },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    const handleNext = () => {
        setFormData({ ...formData, nodes, edges });
        onNext();
    };

    const handleDrop = (e) => {
        const templateId = e.dataTransfer.getData('templateId');
        if (templateId) {
            const template = formData.templates.find((t) => t.id === templateId);
            if (template) {
                const newNodes = template.flows.map((flow, i) => ({
                    id: `node-${nodes.length + i}`,
                    type: 'custom',
                    data: {
                        userMessage: flow.user_message,
                        botResponse: flow.bot_response,
                        condition: '',
                        action: { type: 'none', value: '' },
                        onChange: updateFlowFromNode,
                    },
                    position: { x: 250, y: (nodes.length + i) * 100 + 50 },
                }));
                setNodes((nds) => [...nds, ...newNodes]);
                setEdges([]);
                setFormData({ ...formData, selectedTemplate: templateId });
            }
        }
        e.preventDefault();
    };

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6 text-white">Paso 3: Personalización</h2>

            <Suspense fallback={<div className="text-white">Cargando editor...</div>}>
                <div
                    className="react-flow__container"
                    style={{ height: '400px', marginBottom: '20px' }}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <ReactFlowProvider>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            nodeTypes={nodeTypes}
                            fitView
                        >
                            <Background />
                            <Controls />
                            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 100 }}>
                                <button className="quantum-btn" onClick={addNewNode}>
                                    Añadir Nodo
                                </button>
                            </div>
                        </ReactFlow>
                    </ReactFlowProvider>
                </div>
            </Suspense>

            <PreviewChat
                nodes={nodes}
                edges={edges}
                tone={formData.tone}
                purpose={formData.purpose}
                businessInfo={formData.businessInfo}
            />
            <div className="flex space-x-4 mt-4">
                <button className="quantum-btn magenta flex-1" onClick={onBack}>
                    Atrás
                </button>
                <button className="quantum-btn flex-1" onClick={handleNext}>
                    Siguiente
                </button>
            </div>
        </div>
    );
};

export default Step3Customization;
