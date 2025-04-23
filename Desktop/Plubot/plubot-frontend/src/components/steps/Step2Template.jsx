import { useState } from 'react';
import { toast } from 'react-toastify';
import { ReactFlowProvider, ReactFlow, Background, Controls, useEdgesState } from 'reactflow';
import { nodeTypes } from '../CustomNode';

const Step2Template = ({ onNext, onBack, templates, formData, setFormData }) => {
    const [previewNodes, setPreviewNodes] = useState([]);
    const [previewEdges, setPreviewEdges, onPreviewEdgesChange] = useEdgesState([]);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewTemplateId, setPreviewTemplateId] = useState(null);
    const [selectedTone, setSelectedTone] = useState('');
    const [selectedPurpose, setSelectedPurpose] = useState('');

    // Extraer valores únicos
    const tones = [...new Set(templates.map((t) => t.tone))];
    const purposes = [...new Set(templates.map((t) => t.purpose))];

    const filteredTemplates = templates.filter(
        (template) =>
            (selectedTone ? template.tone === selectedTone : true) &&
            (selectedPurpose ? template.purpose === selectedPurpose : true)
    );

    const updateFlowFromNode = (id, updatedData) => {
        setFormData((prev) => ({
            ...prev,
            nodes: prev.nodes.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, ...updatedData } } : node
            ),
        }));
    };

    const applyTemplate = (templateId) => {
        const template = templates.find((t) => t.id === templateId);
        if (template) {
            setFormData({
                ...formData,
                tone: template.tone,
                purpose: template.purpose,
                nodes: template.flows.map((flow, i) => ({
                    id: `${i}`,
                    type: 'custom',
                    data: {
                        userMessage: flow.user_message,
                        botResponse: flow.bot_response,
                        condition: '',
                        action: { type: 'none', value: '' },
                        onChange: updateFlowFromNode,
                    },
                    position: { x: 250, y: i * 100 + 50 },
                })),
                edges: [],
                selectedTemplate: templateId,
            });

            toast.success("¡Plantilla aplicada correctamente!", {
                position: "top-right",
                autoClose: 3000,
            });
            onNext();
        } else {
            toast.error("No se pudo aplicar la plantilla. Intenta nuevamente.", {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const previewTemplate = (templateId) => {
        const template = templates.find((t) => t.id === templateId);
        if (template) {
            const newNodes = template.flows.map((flow, i) => ({
                id: `${i}`,
                type: 'custom',
                data: {
                    userMessage: flow.user_message,
                    botResponse: flow.bot_response,
                    condition: '',
                    action: { type: 'none', value: '' },
                    onChange: () => {},
                },
                position: { x: 250, y: i * 100 + 50 },
            }));
            setPreviewNodes(newNodes);
            setPreviewEdges([]);
            setIsPreviewing(true);
            setPreviewTemplateId(templateId);

            toast.info("Previsualizando la plantilla...", {
                position: "top-right",
                autoClose: 3000,
            });
        } else {
            toast.error("No se pudo cargar la plantilla para previsualizar.", {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const confirmTemplate = () => {
        applyTemplate(previewTemplateId);
        setIsPreviewing(false);
    };

    const cancelPreview = () => {
        setIsPreviewing(false);
        setPreviewNodes([]);
        setPreviewEdges([]);
        setPreviewTemplateId(null);
        toast.info("Previsualización cancelada.", {
            position: "top-right",
            autoClose: 3000,
        });
    };

    const clearFilters = () => {
        setSelectedTone('');
        setSelectedPurpose('');
    };

    const Chip = ({ label, selected, onClick }) => (
        <button
            onClick={onClick}
            className={`px-3 py-1 rounded-full text-sm border ${
                selected
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
            } transition`}
        >
            {label}
        </button>
    );

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6 text-white">Paso 2: Plantilla (Opcional)</h2>

            {!isPreviewing && (
                <div className="mb-6">
                    <div className="mb-3">
                        <p className="text-gray-300 mb-2">Filtrar por tono:</p>
                        <div className="flex flex-wrap gap-2">
                            {tones.map((tone) => (
                                <Chip
                                    key={tone}
                                    label={tone}
                                    selected={tone === selectedTone}
                                    onClick={() => setSelectedTone(tone === selectedTone ? '' : tone)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="mb-3">
                        <p className="text-gray-300 mb-2">Filtrar por propósito:</p>
                        <div className="flex flex-wrap gap-2">
                            {purposes.map((purpose) => (
                                <Chip
                                    key={purpose}
                                    label={purpose}
                                    selected={purpose === selectedPurpose}
                                    onClick={() => setSelectedPurpose(purpose === selectedPurpose ? '' : purpose)}
                                />
                            ))}
                        </div>
                    </div>
                    {(selectedTone || selectedPurpose) && (
                        <button className="text-sm text-red-400 mt-2" onClick={clearFilters}>
                            Limpiar filtros
                        </button>
                    )}
                </div>
            )}

            {isPreviewing ? (
                <div>
                    <div className="react-flow__container" style={{ height: '400px', marginBottom: '20px' }}>
                        <ReactFlowProvider>
                            <ReactFlow
                                nodes={previewNodes}
                                edges={previewEdges}
                                onNodesChange={() => {}}
                                onEdgesChange={onPreviewEdgesChange}
                                onConnect={() => {}}
                                nodeTypes={nodeTypes}
                                fitView
                            >
                                <Background />
                                <Controls />
                            </ReactFlow>
                        </ReactFlowProvider>
                    </div>
                    <div className="flex space-x-4">
                        <button className="quantum-btn magenta flex-1" onClick={cancelPreview}>
                            Cancelar
                        </button>
                        <button className="quantum-btn flex-1" onClick={confirmTemplate}>
                            Confirmar
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {filteredTemplates.length > 0 ? (
                        filteredTemplates.map((template) => (
                            <div
                                key={template.id}
                                className="template-card mb-4 p-4 bg-gray-800 rounded"
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData('templateId', template.id)}
                            >
                                <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                                <p className="text-gray-300">{template.description}</p>
                                <ul className="text-gray-400 mt-2">
                                    {template.flows.map((flow, i) => (
                                        <li key={i}>
                                            {flow.user_message} → {flow.bot_response}
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex space-x-2 mt-2">
                                    <button className="quantum-btn" onClick={() => previewTemplate(template.id)}>
                                        Previsualizar
                                    </button>
                                    <button className="quantum-btn" onClick={() => applyTemplate(template.id)}>
                                        Usar
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">No hay plantillas que coincidan con los filtros seleccionados.</p>
                    )}
                    <div className="flex space-x-4 mt-6">
                        <button className="quantum-btn magenta flex-1" onClick={onBack}>
                            Atrás
                        </button>
                        <button className="quantum-btn flex-1" onClick={onNext}>
                            Omitir
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Step2Template;
