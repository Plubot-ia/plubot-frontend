import React from 'react';
import './TemplateSelector.css';

const TemplateSelector = ({ onSelectTemplate, onClose, className }) => {
  const templates = [
    {
      id: 'customer-service',
      name: 'Atención al Cliente',
      description: 'Flujo básico para atender consultas y transferir a un agente',
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Inicio' },
          width: 80,
          height: 40,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'message-1',
          type: 'message',
          position: { x: 300, y: 100 },
          data: { label: 'Bienvenida', message: '¡Hola! Bienvenido a nuestro soporte. ¿En qué puedo ayudarte?' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'decision-1',
          type: 'decision',
          position: { x: 500, y: 100 },
          data: { label: 'Consulta', question: '¿Tu consulta es técnica o general?', outputs: ['Técnica', 'General'] },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'option-1',
          type: 'option',
          position: { x: 700, y: 50 },
          data: { label: 'Técnica', condition: 'Igual a: Técnica', parentDecisionId: 'decision-1' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'option-2',
          type: 'option',
          position: { x: 700, y: 150 },
          data: { label: 'General', condition: 'Igual a: General', parentDecisionId: 'decision-1' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 900, y: 100 },
          data: { label: 'Fin', message: 'Transferido a un agente.' },
          width: 80,
          height: 40,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'message-1', type: 'default', animated: true },
        { id: 'e2', source: 'message-1', target: 'decision-1', type: 'default', animated: true },
        { id: 'e3', source: 'decision-1', sourceHandle: 'output-0', target: 'option-1', type: 'default', animated: true },
        { id: 'e4', source: 'decision-1', sourceHandle: 'output-1', target: 'option-2', type: 'default', animated: true },
        { id: 'e5', source: 'option-1', target: 'end-1', type: 'default', animated: true },
        { id: 'e6', source: 'option-2', target: 'end-1', type: 'default', animated: true },
      ],
    },
    // Otras plantillas pueden añadirse aquí
  ];

  const handleSelectTemplate = (template) => {
    console.log('Template selected:', template.name);
    onSelectTemplate(template);
  };

  return (
    <div className={`ts-template-selector ${className || ''}`}>
      <div className="ts-template-selector-content">
        <button className="ts-close-button" onClick={() => {
          console.log('TemplateSelector onClose triggered');
          onClose();
        }}>
          ✕
        </button>
        <h2>Selecciona una plantilla</h2>
        <div className="ts-template-list">
          {templates.map((template) => (
            <div
              key={template.id}
              className="ts-template-item"
              onClick={() => handleSelectTemplate(template)}
            >
              <h3>{template.name}</h3>
              <p>{template.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;