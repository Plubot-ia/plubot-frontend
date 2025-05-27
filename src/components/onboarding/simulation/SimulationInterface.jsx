import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import './SimulationInterface.css';

// Función para recorrer el flujo (sin cambios)
const traverseFlow = (nodes = [], edges = [], startNodeId, userResponses = {}, userMessages = []) => {
  // Verificar que los parámetros sean válidos
  if (!Array.isArray(nodes) || !Array.isArray(edges) || !startNodeId) {
    console.warn('[SimulationInterface] traverseFlow: Parámetros inválidos', { 
      nodesIsArray: Array.isArray(nodes), 
      edgesIsArray: Array.isArray(edges), 
      startNodeId 
    });
    return [];
  }

  const messages = [];
  let currentNodeId = startNodeId;
  const visitedNodes = new Set();
  let userMessageIndex = 0;

  while (currentNodeId && !visitedNodes.has(currentNodeId)) {
    visitedNodes.add(currentNodeId);
    const currentNode = nodes.find((node) => node.id === currentNodeId);
    if (!currentNode) break;

    if (currentNode.type === 'message') {
      messages.push({
        id: currentNode.id,
        type: currentNode.data.sender || 'bot',
        content: currentNode.data.message || 'Mensaje no definido',
        timestamp: new Date().toISOString(),
      });

      if (userMessages[userMessageIndex]) {
        messages.push({
          id: `user-${currentNode.id}-${userMessageIndex}`,
          type: 'user',
          content: userMessages[userMessageIndex],
          timestamp: new Date().toISOString(),
        });
        userMessageIndex++;
      } else {
        break;
      }
    } else if (currentNode.type === 'decision') {
      messages.push({
        id: currentNode.id,
        type: 'bot',
        content: currentNode.data.question || '¿Qué opción deseas tomar?',
        timestamp: new Date().toISOString(),
      });

      const userResponse = userResponses[currentNode.id];
      if (!userResponse) break;

      const optionNode = nodes.find(
        (node) =>
          node.type === 'option' &&
          node.data.parentDecisionId === currentNode.id &&
          node.data.label.toLowerCase() === userResponse.toLowerCase()
      );
      if (!optionNode) break;

      messages.push({
        id: `user-${currentNode.id}`,
        type: 'user',
        content: userResponse,
        timestamp: new Date().toISOString(),
      });

      currentNodeId = optionNode.id;
      continue;
    } else if (currentNode.type === 'end' && currentNode.data.label) {
      messages.push({
        id: currentNode.id,
        type: 'system',
        content: currentNode.data.label,
        timestamp: new Date().toISOString(),
      });
      break;
    }

    // Verificar que edges sea un array válido antes de usar find
    const nextEdge = Array.isArray(edges) 
      ? edges.find((edge) => edge && edge.source === currentNodeId)
      : null;
    
    if (!nextEdge) break;
    currentNodeId = nextEdge.target;
  }

  return messages;
};

// Componente de mensaje (sin cambios)
const MessageItem = React.memo(({ message }) => {
  const { type, content, timestamp } = message;

  return (
    <div className={`ts-message ts-${type}`}>
      {type === 'bot' && <div className="ts-bot-avatar"></div>}
      <div className="ts-message-content">
        <ReactMarkdown>{content}</ReactMarkdown>
        {timestamp && (
          <div className="ts-message-timestamp">
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
});

const SimulationInterface = ({
  nodes = [],
  edges = [],
  onClose = () => {},
  analyticsTracker = null,
}) => {
  // Verificar que los parámetros sean válidos
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];
  const { t } = useTranslation();
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [userResponses, setUserResponses] = useState({});
  const [userMessages, setUserMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [scrollToBottom, setScrollToBottom] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // Referencia al nodo de inicio - buscamos cualquier tipo de nodo que parezca un inicio
  const startNode = safeNodes.find(
    (node) => node && 
    (node.type === 'startNode' || 
     node.type === 'start' || 
     (typeof node.type === 'string' && node.type.toLowerCase().includes('start')))
  );
  
  // ID del nodo de inicio - necesario para toda la simulación
  const startNodeId = startNode?.id;

  // Inicializar la simulación cuando cambian los nodos o aristas
  useEffect(() => {
    // Validar que tenemos los datos necesarios
    if (!Array.isArray(safeNodes) || safeNodes.length === 0) {
      console.warn('[SimulationInterface] No hay nodos para simular');
      return;
    }
    
    if (!startNodeId) {
      console.warn('[SimulationInterface] No se encontró nodo de inicio');
      return;
    }

    // Inicializar con los mensajes del flujo
    const initialMessages = traverseFlow(safeNodes, safeEdges, startNodeId);
    setSimulationHistory(initialMessages);
    
    // Registrar analítica si está disponible
    if (analyticsTracker) {
      try {
        analyticsTracker('simulation_started', { nodeCount: safeNodes.length });
      } catch (e) {}
    }
  }, [safeNodes, safeEdges, startNodeId, analyticsTracker]);

  // Actualizar historial según el flujo cuando cambian las respuestas del usuario
  useEffect(() => {
    // Solo actualizar si hay nodos, un nodo de inicio y se han proporcionado respuestas
    if (startNodeId && (Object.keys(userResponses).length > 0 || userMessages.length > 0)) {
      console.log('[SimulationInterface] Actualizando mensajes con respuestas de usuario', {
        userResponses,
        userMessages,
        startNodeId
      });
      const newMessages = traverseFlow(safeNodes, safeEdges, startNodeId, userResponses, userMessages);
      setSimulationHistory(newMessages);
    }
  }, [safeNodes, safeEdges, startNodeId, userResponses, userMessages]);

  // Manejar cambios de altura del viewport (para teclado virtual)
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manejar scroll automático
  useEffect(() => {
    if (scrollRef.current && scrollToBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [simulationHistory, scrollToBottom, isTyping]);

  // Controlar el enfoque del input
  useEffect(() => {
    if (inputRef.current && simulationHistory.length > 0) {
      const lastMessage = simulationHistory[simulationHistory.length - 1];
      const lastNodeId = lastMessage.id;
      const lastNode = nodes.find((n) => n.id === lastNodeId);
      if (lastNode?.type === 'message') {
        inputRef.current.focus();
      }
    }
  }, [simulationHistory, nodes]);

  // Obtener el nodo actual
  const currentNodeId = simulationHistory.length > 0 ? simulationHistory[simulationHistory.length - 1].id : startNodeId;
  const currentNode = nodes.find((n) => n.id === currentNodeId);
  const isDecisionNode = currentNode?.type === 'decision';
  const isMessageNode = currentNode?.type === 'message';
  const isEndNode = currentNode?.type === 'end';
  const options = isDecisionNode ? currentNode.data.outputs || [] : [];

  const handleUserInput = useCallback(
    (e) => {
      e.preventDefault();
      
      if (!userInput.trim() || isTyping) {
        return;
      }

      setUserInput('');
      setIsTyping(true);
      setScrollToBottom(true);
      setUserMessages((prev) => [...prev, userInput]);

      setTimeout(() => setIsTyping(false), 800);

      if (analyticsTracker) {
        analyticsTracker('user_message_sent', {
          nodeId: currentNodeId,
          messageLength: userInput.length,
        });
      }
    },
    [userInput, currentNodeId, isTyping, analyticsTracker]
  );

  const handleOptionClick = useCallback(
    (option) => {
      setIsTyping(true);
      setScrollToBottom(true);
      setUserResponses((prev) => ({ ...prev, [currentNodeId]: option }));

      setTimeout(() => setIsTyping(false), 800);

      if (analyticsTracker) {
        analyticsTracker('option_selected', {
          nodeId: currentNodeId,
          option,
        });
      }
    },
    [currentNodeId, analyticsTracker]
  );

  return (
    <div
      className="ts-simulation-interface"
      style={{
        // Ajustar dinámicamente la altura según el teclado
        maxHeight: `calc(${viewportHeight}px - 2rem)`,
      }}
    >
      <div className="ts-simulation-header">
        <h3>{t('simulation.title', 'Simulación de Conversación')}</h3>
        <div className="ts-header-controls">
          <button
            className="ts-btn-reset"
            onClick={() => {
              if (window.confirm(t('simulation.confirmReset', '¿Reiniciar simulación?'))) {
                setSimulationHistory([]);
                setUserResponses({});
                setUserMessages([]);
                setScrollToBottom(true);
              }
            }}
            aria-label={t('simulation.reset', 'Reiniciar')}
          >
            <i className="fas fa-undo"></i>
          </button>
          <button
            className="ts-btn-close"
            onClick={onClose}
            aria-label={t('simulation.close', 'Cerrar')}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="ts-conversation-wrapper">
        <div
          className="ts-conversation-container"
          ref={scrollRef}
          onScroll={() => {
            if (scrollRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
              const isAtBottom = scrollHeight - scrollTop - clientHeight < 20;
              setScrollToBottom(isAtBottom);
            }
          }}
        >
          {simulationHistory.length > 0 ? (
            simulationHistory.map((message, index) => (
              <MessageItem key={`msg-${index}`} message={message} />
            ))
          ) : (
            <div className="ts-message ts-system">
              <div className="ts-message-content">
                {t('simulation.startPrompt', 'Comienza la conversación...')}
              </div>
            </div>
          )}
          {isTyping && (
            <div className="ts-message ts-bot ts-typing">
              <div className="ts-bot-avatar"></div>
              <div className="ts-message-content ts-typing-content">
                <div className="ts-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div className="ts-scroll-anchor"></div>
        </div>
      </div>

      {isDecisionNode && options.length > 0 ? (
        <div className="ts-decision-options">
          {options.map((option, index) => (
            <button
              key={`option-${index}`}
              onClick={() => handleOptionClick(option)}
              className="ts-decision-option-btn"
              disabled={userResponses[currentNodeId]}
            >
              {option}
            </button>
          ))}
        </div>
      ) : !isEndNode ? (
        <form onSubmit={handleUserInput} className="ts-user-input-container">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserInput(e);
              }
            }}
            placeholder={t('simulation.inputPlaceholder', 'Escribe tu respuesta...')}
            disabled={isTyping}
            aria-label={t('simulation.inputLabel', 'Tu respuesta')}
          />
          <button
            type="submit"
            disabled={isTyping || !userInput.trim()}
            aria-label={t('simulation.send', 'Enviar')}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      ) : null}

      <div className="ts-simulation-info">
        <div className="ts-current-node">
          <span>{t('simulation.currentNode', 'Nodo actual')}: </span>
          {currentNodeId ? (
            <strong>{currentNode?.data?.label || currentNode?.data?.question || currentNodeId}</strong>
          ) : (
            <em>{t('simulation.noNode', 'Ninguno seleccionado')}</em>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SimulationInterface);