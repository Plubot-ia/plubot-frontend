import { X, Zap, Star, Award, Cpu, XCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import './TemplateSelector.css';

// Importar fuentes para el estilo cyberpunk
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/700.css';

const TemplateSelector = ({ onSelectTemplate, onClose, className }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [animateItems, setAnimateItems] = useState(false);

  useEffect(() => {
    // Activar la animación de entrada de los elementos después de un breve retraso
    const timer = setTimeout(() => setAnimateItems(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'basic', name: 'Básicos' },
    { id: 'advanced', name: 'Avanzados' },
    { id: 'ai', name: 'IA' },
  ];

  const templates = [
    {
      id: 'customer-service',
      name: 'Atención al Cliente',
      description: 'Flujo básico para atender consultas y transferir a un agente',
      category: 'basic',
      icon: <Star size={20} />,
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
    // Nueva plantilla avanzada de IA
    {
      id: 'ai-assistant',
      name: 'Asistente IA Avanzado',
      description: 'Flujo avanzado con procesamiento de lenguaje natural y toma de decisiones basada en IA',
      category: 'ai',
      icon: <Cpu size={20} />,
      nodes: [
        {
          id: 'start-node',
          type: 'start',
          position: { x: 100, y: 250 },
          data: { label: 'Inicio' },
          width: 80,
          height: 40,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'welcome-message',
          type: 'message',
          position: { x: 250, y: 250 },
          data: { label: 'Bienvenida', message: '¡Hola! Soy tu asistente virtual con IA. ¿En qué puedo ayudarte hoy?' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'nlp-processing',
          type: 'ai',
          position: { x: 450, y: 250 },
          data: { label: 'Procesamiento NLP', aiModel: 'GPT-4', prompt: 'Analizar la intención del usuario y clasificarla' },
          width: 180,
          height: 100,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'intent-decision',
          type: 'decision',
          position: { x: 700, y: 250 },
          data: { label: 'Clasificación de Intención', question: '¿Cuál es la intención del usuario?', outputs: ['Consulta', 'Soporte', 'Compra', 'Otro'] },
          width: 180,
          height: 100,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'query-option',
          type: 'option',
          position: { x: 950, y: 150 },
          data: { label: 'Consulta', condition: 'Igual a: Consulta', parentDecisionId: 'intent-decision' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'support-option',
          type: 'option',
          position: { x: 950, y: 250 },
          data: { label: 'Soporte', condition: 'Igual a: Soporte', parentDecisionId: 'intent-decision' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'purchase-option',
          type: 'option',
          position: { x: 950, y: 350 },
          data: { label: 'Compra', condition: 'Igual a: Compra', parentDecisionId: 'intent-decision' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'ai-response',
          type: 'ai',
          position: { x: 1150, y: 250 },
          data: { label: 'Generar Respuesta', aiModel: 'GPT-4', prompt: 'Generar una respuesta personalizada basada en la intención del usuario' },
          width: 180,
          height: 100,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'final-message',
          type: 'message',
          position: { x: 1350, y: 250 },
          data: { label: 'Respuesta Final', message: 'Aquí está tu respuesta personalizada generada por IA.' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'end-node',
          type: 'end',
          position: { x: 1550, y: 250 },
          data: { label: 'Fin', message: 'Conversación finalizada.' },
          width: 80,
          height: 40,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
      ],
      edges: [
        { id: 'e1-ai', source: 'start-node', target: 'welcome-message', type: 'default', animated: true },
        { id: 'e2-ai', source: 'welcome-message', target: 'nlp-processing', type: 'default', animated: true },
        { id: 'e3-ai', source: 'nlp-processing', target: 'intent-decision', type: 'default', animated: true },
        { id: 'e4-ai', source: 'intent-decision', sourceHandle: 'output-0', target: 'query-option', type: 'default', animated: true },
        { id: 'e5-ai', source: 'intent-decision', sourceHandle: 'output-1', target: 'support-option', type: 'default', animated: true },
        { id: 'e6-ai', source: 'intent-decision', sourceHandle: 'output-2', target: 'purchase-option', type: 'default', animated: true },
        { id: 'e7-ai', source: 'query-option', target: 'ai-response', type: 'default', animated: true },
        { id: 'e8-ai', source: 'support-option', target: 'ai-response', type: 'default', animated: true },
        { id: 'e9-ai', source: 'purchase-option', target: 'ai-response', type: 'default', animated: true },
        { id: 'e10-ai', source: 'ai-response', target: 'final-message', type: 'default', animated: true },
        { id: 'e11-ai', source: 'final-message', target: 'end-node', type: 'default', animated: true },
      ],
    },
    // Otra plantilla avanzada
    {
      id: 'multi-channel',
      name: 'Flujo Multicanal',
      description: 'Flujo avanzado para gestionar interacciones a través de múltiples canales de comunicación',
      category: 'advanced',
      icon: <Zap size={20} />,
      nodes: [
        {
          id: 'start-mc',
          type: 'start',
          position: { x: 100, y: 200 },
          data: { label: 'Inicio' },
          width: 80,
          height: 40,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'channel-detection',
          type: 'decision',
          position: { x: 300, y: 200 },
          data: { label: 'Detección de Canal', question: '¿Qué canal está usando el cliente?', outputs: ['Web', 'Móvil', 'WhatsApp', 'Email'] },
          width: 180,
          height: 100,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'web-option',
          type: 'option',
          position: { x: 600, y: 100 },
          data: { label: 'Web', condition: 'Igual a: Web', parentDecisionId: 'channel-detection' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'mobile-option',
          type: 'option',
          position: { x: 600, y: 200 },
          data: { label: 'Móvil', condition: 'Igual a: Móvil', parentDecisionId: 'channel-detection' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'whatsapp-option',
          type: 'option',
          position: { x: 600, y: 300 },
          data: { label: 'WhatsApp', condition: 'Igual a: WhatsApp', parentDecisionId: 'channel-detection' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'email-option',
          type: 'option',
          position: { x: 600, y: 400 },
          data: { label: 'Email', condition: 'Igual a: Email', parentDecisionId: 'channel-detection' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'web-response',
          type: 'message',
          position: { x: 850, y: 100 },
          data: { label: 'Respuesta Web', message: 'Bienvenido a nuestro chat web. ¿En qué podemos ayudarte hoy?' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'mobile-response',
          type: 'message',
          position: { x: 850, y: 200 },
          data: { label: 'Respuesta Móvil', message: 'Bienvenido a nuestra app móvil. ¿Cómo podemos asistirte?' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'whatsapp-response',
          type: 'message',
          position: { x: 850, y: 300 },
          data: { label: 'Respuesta WhatsApp', message: 'Hola, gracias por contactarnos por WhatsApp. ¿En qué podemos ayudarte?' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'email-response',
          type: 'message',
          position: { x: 850, y: 400 },
          data: { label: 'Respuesta Email', message: 'Gracias por tu email. Hemos recibido tu consulta y responderemos a la brevedad.' },
          width: 150,
          height: 80,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
        {
          id: 'end-mc',
          type: 'end',
          position: { x: 1100, y: 250 },
          data: { label: 'Fin', message: 'Interacción completada.' },
          width: 80,
          height: 40,
          draggable: true,
          selectable: true,
          zIndex: 1000,
        },
      ],
      edges: [
        { id: 'e1-mc', source: 'start-mc', target: 'channel-detection', type: 'default', animated: true },
        { id: 'e2-mc', source: 'channel-detection', sourceHandle: 'output-0', target: 'web-option', type: 'default', animated: true },
        { id: 'e3-mc', source: 'channel-detection', sourceHandle: 'output-1', target: 'mobile-option', type: 'default', animated: true },
        { id: 'e4-mc', source: 'channel-detection', sourceHandle: 'output-2', target: 'whatsapp-option', type: 'default', animated: true },
        { id: 'e5-mc', source: 'channel-detection', sourceHandle: 'output-3', target: 'email-option', type: 'default', animated: true },
        { id: 'e6-mc', source: 'web-option', target: 'web-response', type: 'default', animated: true },
        { id: 'e7-mc', source: 'mobile-option', target: 'mobile-response', type: 'default', animated: true },
        { id: 'e8-mc', source: 'whatsapp-option', target: 'whatsapp-response', type: 'default', animated: true },
        { id: 'e9-mc', source: 'email-option', target: 'email-response', type: 'default', animated: true },
        { id: 'e10-mc', source: 'web-response', target: 'end-mc', type: 'default', animated: true },
        { id: 'e11-mc', source: 'mobile-response', target: 'end-mc', type: 'default', animated: true },
        { id: 'e12-mc', source: 'whatsapp-response', target: 'end-mc', type: 'default', animated: true },
        { id: 'e13-mc', source: 'email-response', target: 'end-mc', type: 'default', animated: true },
      ],
    },
  ];

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template);
    onClose();
  };

  // Filtrar plantillas según la categoría seleccionada
  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(template => template.category === selectedCategory);

  return (
    <div className={`template-selector ${className || ''}`}>
      <div className="ts-modal">
        <button
          className="ts-btn-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>
        <div className="ts-header">
          <h2>Selecciona una plantilla</h2>
        </div>

        <div className="ts-categories">
          {categories.map(category => (
            <button
              key={category.id}
              className={`ts-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="ts-content">
          <div className={`ts-template-list ${animateItems ? 'animate' : ''}`}>
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="ts-template-item"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="template-icon">
                  {template.icon || <Award size={20} />}
                </div>
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <div className="template-preview">
                  {/* Aquí podría ir una vista previa del flujo */}
                  <span className="preview-text">Vista previa</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;