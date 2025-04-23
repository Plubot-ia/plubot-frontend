
// Asegurarse de que ReactFlow está disponible globalmente
const ReactFlowProvider = ReactFlow.ReactFlowProvider;
const Background = ReactFlow.Background;
const Controls = ReactFlow.Controls;
const Handle = ReactFlow.Handle;
const Panel = ReactFlow.Panel;

// Definir componentes de nodos personalizados
const NodeTypes = {
  inputNode: ({ data }) => (
    <div className="custom-node input-node">
      <Handle type="source" position="bottom" />
      <div className="node-content">
        <h4>{data.label}</h4>
        <p>{data.description}</p>
      </div>
    </div>
  ),
  outputNode: ({ data }) => (
    <div className="custom-node output-node">
      <Handle type="target" position="top" />
      <div className="node-content">
        <h4>{data.label}</h4>
        <p>{data.description}</p>
      </div>
    </div>
  ),
  processNode: ({ data }) => (
    <div className="custom-node process-node">
      <Handle type="target" position="top" />
      <div className="node-content">
        <h4>{data.label}</h4>
        <p>{data.description}</p>
      </div>
      <Handle type="source" position="bottom" />
    </div>
  ),
};

// Componente principal de la aplicación
function App() {
  const [nodes, setNodes] = React.useState([]);
  const [edges, setEdges] = React.useState([]);
  const [step, setStep] = React.useState(1);
  
  // Configuración inicial de nodos para el paso 3
  const initialNodes = [
    {
      id: '1',
      type: 'inputNode',
      data: { label: 'Entrada', description: 'Punto de inicio' },
      position: { x: 250, y: 50 },
    },
    {
      id: '2',
      type: 'processNode',
      data: { label: 'Proceso', description: 'Procesamiento principal' },
      position: { x: 250, y: 150 },
    },
    {
      id: '3',
      type: 'outputNode',
      data: { label: 'Salida', description: 'Respuesta final' },
      position: { x: 250, y: 250 },
    },
  ];

  // Configuración inicial de conexiones para el paso 3
  const initialEdges = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
  ];

  // Actualizar los pasos en la barra de progreso
  React.useEffect(() => {
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((stepEl, index) => {
      if (index + 1 === step) {
        stepEl.classList.add('active');
      } else {
        stepEl.classList.remove('active');
      }
    });

    // Si estamos en el paso 3, inicializar los nodos para React Flow
    if (step === 3 && nodes.length === 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [step]);

  // Configurar eventos del modal de ayuda
  React.useEffect(() => {
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeHelpBtn = document.getElementById('close-help-btn');

    helpBtn.addEventListener('click', () => {
      helpModal.classList.remove('hidden');
    });

    closeHelpBtn.addEventListener('click', () => {
      helpModal.classList.add('hidden');
    });

    return () => {
      helpBtn.removeEventListener('click', () => {});
      closeHelpBtn.removeEventListener('click', () => {});
    };
  }, []);

  // Manejar conexiones de nodos
  const onConnect = React.useCallback((params) => {
    setEdges((eds) => ReactFlow.addEdge(params, eds));
  }, []);

  // Renderizar el paso correspondiente
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <h2>Información Básica</h2>
            <form>
              <div className="form-group">
                <label htmlFor="bot-name">Nombre del Chatbot:</label>
                <input type="text" id="bot-name" placeholder="Ej: AsistenteVirtual" />
              </div>
              <div className="form-group">
                <label htmlFor="bot-purpose">Propósito:</label>
                <textarea id="bot-purpose" placeholder="Describe para qué servirá tu chatbot..."></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="bot-tone">Tono de Comunicación:</label>
                <select id="bot-tone">
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Amigable</option>
                  <option value="professional">Profesional</option>
                </select>
              </div>
            </form>
          </div>
        );
      
      case 2:
        return (
          <div className="step-content">
            <h2>Elige una Plantilla</h2>
            <div className="template-container">
              <div className="template-card">
                <h3>Atención al Cliente</h3>
                <p>Ideal para responder preguntas frecuentes y solucionar problemas básicos.</p>
                <button className="quantum-btn">Seleccionar</button>
              </div>
              <div className="template-card">
                <h3>Ventas</h3>
                <p>Optimizado para presentar productos y convertir leads en ventas.</p>
                <button className="quantum-btn">Seleccionar</button>
              </div>
              <div className="template-card">
                <h3>Educación</h3>
                <p>Diseñado para facilitar aprendizaje y responder dudas académicas.</p>
                <button className="quantum-btn">Seleccionar</button>
              </div>
              <div className="template-card">
                <h3>Personalizado</h3>
                <p>Comienza desde cero y define todos los flujos de conversación.</p>
                <button className="quantum-btn">Seleccionar</button>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="step-content flow-editor">
            <h2>Personalización de Flujos</h2>
            <div style={{ width: '100%', height: '500px' }}>
              <ReactFlowProvider>
                <ReactFlow.ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={(changes) => setNodes(ReactFlow.applyNodeChanges(changes, nodes))}
                  onEdgesChange={(changes) => setEdges(ReactFlow.applyEdgeChanges(changes, edges))}
                  onConnect={onConnect}
                  nodeTypes={NodeTypes}
                  fitView
                >
                  <Background />
                  <Controls />
                  <Panel position="top-right">
                    <div className="flow-tools">
                      <button className="flow-btn" onClick={() => alert('¡Añadir nodo!')}>+ Nodo</button>
                      <button className="flow-btn">Guardar</button>
                    </div>
                  </Panel>
                </ReactFlow.ReactFlow>
              </ReactFlowProvider>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="step-content">
            <h2>Revisión y Finalización</h2>
            <div className="review-container">
              <div className="review-section">
                <h3>Información Básica</h3>
                <p><strong>Nombre:</strong> [Nombre del Bot]</p>
                <p><strong>Propósito:</strong> [Propósito del Bot]</p>
                <p><strong>Tono:</strong> [Tono seleccionado]</p>
              </div>
              <div className="review-section">
                <h3>Conexión</h3>
                <button className="quantum-btn">Conectar WhatsApp</button>
                <div className="upload-section">
                  <h4>Archivos Adicionales (opcional)</h4>
                  <input type="file" id="knowledge-files" multiple />
                  <p class="hint">Añade PDFs o documentos para entrenar a tu chatbot con información específica.</p>
                </div>
              </div>
              <div className="review-section">
                <button className="quantum-btn primary">Crear Chatbot</button>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Paso no encontrado</div>;
    }
  };

  return (
    <div className="app-container">
      {renderStep()}
      <div className="navigation-buttons">
        {step > 1 && (
          <button className="quantum-btn" onClick={() => setStep(step - 1)}>
            Anterior
          </button>
        )}
        {step < 4 && (
          <button className="quantum-btn primary" onClick={() => setStep(step + 1)}>
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}

// Renderizar la aplicación
ReactDOM.render(<App />, document.getElementById('root'));