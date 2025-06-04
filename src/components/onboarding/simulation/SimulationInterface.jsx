import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import './SimulationInterface.css';

// Helper para obtener el token JWT (DEBES IMPLEMENTAR ESTO SEGÚN TU APP)
const getAuthToken = () => {
  // Ejemplo: leer de localStorage, Auth Context, etc.
  // Asegúrate de que este token sea el JWT válido para tu backend.
  const token = localStorage.getItem('access_token'); // O el nombre que uses para tu token JWT
  if (!token) {
    console.error("SimulationInterface: No se encontró el token JWT. Las acciones de nodo fallarán.");
  }
  return token;
};

// Nueva función para llamar a la API de acción de Discord
const executeDiscordAction = async (nodeData) => {
  const jwtToken = getAuthToken();
  if (!jwtToken) {
    return { success: false, message: 'Error de autenticación: No se encontró el token JWT.' };
  }

  // Extraer los datos necesarios del nodo. Asegúrate que estos nombres coincidan
  // con cómo los guardas en node.data en tu DiscordNode.tsx
  const { discordToken, channelId, messageContent } = nodeData;

  if (!discordToken || !channelId || !messageContent) {
    let missing = [];
    if (!discordToken) missing.push(t('simulation.missingBotToken', 'Token del Bot'));
    if (!channelId) missing.push('ID del Canal');
    if (!messageContent) missing.push('Mensaje a Enviar');
    return { success: false, message: `Configuración del nodo Discord incompleta. Faltan: ${missing.join(', ')}` };
  }

  try {
    const response = await fetch('/api/actions/discord/send_message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        token: discordToken,      // Token del Bot de Discord
        channel_id: channelId,    // ID del Canal de Discord
        message: messageContent,   // Mensaje a enviar
      }),
    });

    const responseData = await response.json();

    if (response.ok) {
      return { success: true, message: responseData.message || 'Acción de Discord ejecutada con éxito.' };
    } else {
      return { success: false, message: responseData.message || responseData.error || `Error del servidor: ${response.status}` };
    }
  } catch (error) {
    console.error('Error al ejecutar acción de Discord:', error);
    return { success: false, message: `Error de red o conexión: ${error.message}` };
  }
};

const MessageItem = React.memo(({ message }) => {
  const { type, content, timestamp, isActionStatus } = message;
  const itemClass = `ts-message ts-${type} ${isActionStatus ? 'ts-action-status' : ''}`;
  return (
    <div className={itemClass}>
      {type === 'bot' && !isActionStatus && <div className="ts-bot-avatar"></div>}
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
  const { t } = useTranslation();
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];

  const [simulationHistory, setSimulationHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [scrollToBottom, setScrollToBottom] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [flowStatus, setFlowStatus] = useState('idle'); // idle, processing, waiting_input, executing_action, ended, error
  const [userResponses, setUserResponses] = useState({}); // Para nodos de decisión
  const [userMessageForNode, setUserMessageForNode] = useState(null); // Para nodos de mensaje

  const startNode = safeNodes.find(n => n.type === 'start' || n.type === 'startNode' || (typeof n.type === 'string' && n.type.toLowerCase().includes('start')));
  const initialStartNodeId = startNode?.id;

  const addMessageToHistory = useCallback((message) => {
    setSimulationHistory(prev => [...prev, message]);
  }, []);

  const processNode = useCallback(async (nodeId, currentResponses, currentMessageForNode) => {
    if (!nodeId) {
      setFlowStatus('ended');
      addMessageToHistory({ id: 'flow-end-no-node', type: 'system', content: t('simulation.flowEndedNoNode', 'Flujo finalizado: no hay más nodos.'), timestamp: new Date().toISOString() });
      return;
    }

    const node = safeNodes.find(n => n.id === nodeId);
    if (!node) {
      setFlowStatus('error');
      addMessageToHistory({ id: `error-node-not-found-${nodeId}`, type: 'system', content: t('simulation.errorNodeNotFound', `Error: Nodo ${nodeId} no encontrado.`), timestamp: new Date().toISOString() });
      return;
    }

    setCurrentNodeId(node.id);
    setFlowStatus('processing');

    // Para analítica
    if (analyticsTracker) {
      try { analyticsTracker('simulation_node_processing', { nodeId: node.id, nodeType: node.type }); } catch(e) {}
    }

    switch (node.type) {
      case 'start':
      case 'startNode':
        const firstEdge = safeEdges.find(edge => edge.source === node.id);
        if (firstEdge) {
          await processNode(firstEdge.target, currentResponses, currentMessageForNode);
        } else {
          setFlowStatus('ended');
          addMessageToHistory({ id: 'flow-end-no-edge', type: 'system', content: t('simulation.flowEndedNoEdge', 'Flujo finalizado: nodo de inicio sin salida.'), timestamp: new Date().toISOString() });
        }
        break;

      case 'message':
        addMessageToHistory({
          id: node.id,
          type: node.data.sender || 'bot',
          content: node.data.message || t('simulation.undefinedMessage', 'Mensaje no definido'), // Modificado para leer de node.data.message
          timestamp: new Date().toISOString(),
        });
        setFlowStatus('waiting_input'); // Espera entrada del usuario
        break;

      case 'decision':
        addMessageToHistory({
          id: node.id,
          type: 'bot',
          content: node.data.question || t('simulation.undefinedQuestion', '¿Qué opción deseas tomar?'),
          timestamp: new Date().toISOString(),
        });
        setFlowStatus('waiting_input'); // Espera selección de opción
        break;

      case 'discord': // NUEVO CASO PARA NODO DISCORD
        addMessageToHistory({
          id: `action-status-${node.id}`,
          type: 'system',
          content: t('simulation.executingDiscord', 'Ejecutando acción de Discord...'),
          timestamp: new Date().toISOString(),
          isActionStatus: true,
        });
        setFlowStatus('executing_action');
        console.log('[Simulation] Processing Discord Node ID:', node.id, 'Data:', JSON.parse(JSON.stringify(node.data || {})));
        
        // Asegúrate que node.data contiene: discordToken, channelId, messageContent
        const actionData = {
            discordToken: node.data.discordToken, 
            channelId: node.data.channelId, 
            messageContent: node.data.messageContent || "Mensaje desde Plubot",
        };

        const result = await executeDiscordAction(actionData);
        
        addMessageToHistory({
          id: `action-result-${node.id}`,
          type: result.success ? 'system' : 'error',
          content: result.message,
          timestamp: new Date().toISOString(),
          isActionStatus: true,
        });

        if (result.success) {
          setFlowStatus('processing'); // Continuar al siguiente nodo
          const nextEdge = safeEdges.find(edge => edge.source === node.id);
          if (nextEdge) {
            await processNode(nextEdge.target, currentResponses, currentMessageForNode);
          } else {
            setFlowStatus('ended');
            addMessageToHistory({ id: 'flow-end-after-action', type: 'system', content: t('simulation.flowEndedAfterAction', 'Flujo finalizado después de la acción.'), timestamp: new Date().toISOString() });
          }
        } else {
          setFlowStatus('error'); // Detener en caso de error de la acción
           addMessageToHistory({ id: `action-error-detail-${node.id}`, type: 'error', content: t('simulation.actionErrorDetail', 'La simulación no puede continuar debido a un error en la acción.'), timestamp: new Date().toISOString() });
        }
        break;

      case 'end':
        if (node.data.label) {
          addMessageToHistory({
            id: node.id,
            type: 'system',
            content: node.data.label,
            timestamp: new Date().toISOString(),
          });
        }
        setFlowStatus('ended');
        break;

      default: // Nodos desconocidos o que no requieren interacción
        console.warn(t('simulation.unknownNodeType', `Nodo de tipo desconocido o no interactivo: ${node.type}. Buscando siguiente nodo.`));
        const defaultNextEdge = safeEdges.find(edge => edge.source === node.id);
        if (defaultNextEdge) {
          await processNode(defaultNextEdge.target, currentResponses, currentMessageForNode);
        } else {
          setFlowStatus('ended');
          addMessageToHistory({ id: 'flow-end-unknown-type', type: 'system', content: t('simulation.flowEndedUnknownType', 'Flujo finalizado: nodo sin salida o tipo no manejado.'), timestamp: new Date().toISOString() });
        }
        break;
    }
  }, [safeNodes, safeEdges, addMessageToHistory, t, analyticsTracker]);

  const startSimulation = useCallback(() => {
    setSimulationHistory([]);
    setUserResponses({});
    setUserMessageForNode(null);
    setCurrentNodeId(initialStartNodeId);
    setFlowStatus('idle');
    if (analyticsTracker) {
      try { analyticsTracker('simulation_started', { nodeCount: safeNodes.length }); } catch(e) {}
    }
    if (initialStartNodeId) {
      processNode(initialStartNodeId, {}, null);
    }
  }, [initialStartNodeId, processNode, safeNodes.length, analyticsTracker]);

  useEffect(() => {
    if (initialStartNodeId && safeNodes.length > 0) {
      startSimulation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStartNodeId, safeNodes, safeEdges]); // No incluir startSimulation para evitar bucles

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (scrollRef.current && scrollToBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [simulationHistory, scrollToBottom, flowStatus]);

  const handleUserInputSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || flowStatus !== 'waiting_input') return;

    const userMsgContent = userInput;
    setUserInput('');
    addMessageToHistory({
      id: `user-${currentNodeId}-${Date.now()}`,
      type: 'user',
      content: userMsgContent,
      timestamp: new Date().toISOString(),
    });
    setUserMessageForNode(userMsgContent);

    if (analyticsTracker) {
      try { analyticsTracker('simulation_user_message_sent', { nodeId: currentNodeId, messageLength: userMsgContent.length }); } catch(e) {}
    }

    const currentNodeObject = safeNodes.find(n => n.id === currentNodeId);
    if (currentNodeObject && currentNodeObject.type === 'message') {
        const nextEdge = safeEdges.find(edge => edge.source === currentNodeId);
        if (nextEdge) {
            await processNode(nextEdge.target, userResponses, userMsgContent);
        } else {
            setFlowStatus('ended');
            addMessageToHistory({ id: 'flow-end-after-user-message', type: 'system', content: t('simulation.flowEndedAfterUserMessage', 'Flujo finalizado después de tu mensaje.'), timestamp: new Date().toISOString() });
        }
    }
  };

  const handleOptionClick = async (optionLabel) => {
    if (flowStatus !== 'waiting_input') return;

    addMessageToHistory({
      id: `user-option-${currentNodeId}-${Date.now()}`,
      type: 'user',
      content: optionLabel,
      timestamp: new Date().toISOString(),
    });
    
    const newResponses = { ...userResponses, [currentNodeId]: optionLabel };
    setUserResponses(newResponses);

    if (analyticsTracker) {
      try { analyticsTracker('simulation_decision_option_selected', { nodeId: currentNodeId, option: optionLabel }); } catch(e) {}
    }

    const decisionNode = safeNodes.find(n => n.id === currentNodeId);
    const optionNode = safeNodes.find(
      node =>
        node.type === 'option' &&
        node.data.parentDecisionNodeId === decisionNode.id &&
        node.data.label.toLowerCase() === optionLabel.toLowerCase()
    );

    if (optionNode) {
      const nextEdge = safeEdges.find(edge => edge.source === optionNode.id); // El flujo continúa desde el nodo 'option'
      if (nextEdge) {
        await processNode(nextEdge.target, newResponses, userMessageForNode);
      } else {
        setFlowStatus('ended');
        addMessageToHistory({ id: 'flow-end-after-option', type: 'system', content: t('simulation.flowEndedAfterOption', 'Flujo finalizado después de tu selección.'), timestamp: new Date().toISOString() });
      }
    } else {
        setFlowStatus('error');
        addMessageToHistory({ id: `error-option-not-found-${currentNodeId}`, type: 'system', content: t('simulation.errorOptionNotFound', 'Error: Opción no encontrada o flujo mal configurado.'), timestamp: new Date().toISOString() });
    }
  };
  
  const currentProcessingNode = useMemo(() => {
    return safeNodes.find(n => n.id === currentNodeId);
  }, [safeNodes, currentNodeId]);

  const isWaitingForUserInput = useMemo(() => {
    return flowStatus === 'waiting_input';
  }, [flowStatus]);

  const currentDecisionOptions = useMemo(() => {
    if (isWaitingForUserInput && currentProcessingNode?.type === 'decision') {
      return safeNodes
        .filter(node => node.type === 'option' && node.data.parentDecisionNodeId === currentProcessingNode.id)
        .map(optionNode => optionNode.data.label);
    }
    return [];
  }, [isWaitingForUserInput, currentProcessingNode, safeNodes]);

  useEffect(() => {
    if (inputRef.current && flowStatus === 'waiting_input' && !currentDecisionOptions.length) {
      inputRef.current.focus();
    }
  }, [flowStatus, currentDecisionOptions]);

  const mainStyle = { height: `${viewportHeight}px` };
  const isExecuting = flowStatus === 'executing_action';
  const isEnded = flowStatus === 'ended';
  const isError = flowStatus === 'error';


  return (
    <div className="ts-simulation-interface" style={mainStyle}>
      <div className="ts-header">
        <h3>{t('simulation.title', 'Simulación de Conversación')}</h3>
        <div className="ts-header-controls">
          <button
            className="ts-btn-reset"
            onClick={() => {
              if (window.confirm(t('simulation.confirmReset', '¿Reiniciar simulación?'))) {
                startSimulation();
              }
            }}
            aria-label={t('simulation.reset', 'Reiniciar')}
          >
            <i className="fas fa-undo"></i>
          </button>
          <button className="ts-btn-close" onClick={onClose} aria-label={t('simulation.close', 'Cerrar')}> ✕ </button>
        </div>
      </div>

      <div className="ts-conversation-wrapper">
        <div className="ts-conversation-container" ref={scrollRef} onScroll={() => {
          if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            setScrollToBottom(scrollHeight - scrollTop - clientHeight < 20);
          }
        }}>
          {simulationHistory.length > 0 ? (
            simulationHistory.map((message, index) => (
              <MessageItem key={`msg-${index}-${message.id}`} message={message} />
            ))
          ) : (
            <div className="ts-message ts-system">
              <div className="ts-message-content">{t('simulation.startPrompt', 'Comienza la conversación...')}</div>
            </div>
          )}
          {isExecuting && (
            <div className="ts-message ts-system ts-action-status ts-typing">
              <div className="ts-message-content ts-typing-content">
                <div className="ts-typing-indicator"><span></span><span></span><span></span></div>
                 {t('simulation.executingAction', 'Procesando acción...')}
              </div>
            </div>
          )}
          <div className="ts-scroll-anchor"></div>
        </div>
      </div>

      {isWaitingForUserInput && currentDecisionOptions.length > 0 ? (
        <div className="ts-decision-options">
          {currentDecisionOptions.map((option, index) => (
            <button
              key={`option-${index}`}
              onClick={() => handleOptionClick(option)}
              className="ts-decision-option-btn"
              disabled={isExecuting}
            >
              {option}
            </button>
          ))}
        </div>
      ) : isWaitingForUserInput && currentProcessingNode?.type === 'message' ? (
        <form onSubmit={handleUserInputSubmit} className="ts-user-input-container">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserInputSubmit(e); }}}
            placeholder={t('simulation.inputPlaceholder', 'Escribe tu respuesta...')}
            disabled={isExecuting}
            aria-label={t('simulation.inputLabel', 'Tu respuesta')}
          />
          <button type="submit" disabled={isExecuting || !userInput.trim()} aria-label={t('simulation.send', 'Enviar')}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      ) : null}
      
      {(isEnded || isError) && (
         <div className="ts-message ts-system">
            <div className="ts-message-content">
                {isEnded && t('simulation.conversationEnded', 'La conversación ha finalizado.')}
                {isError && t('simulation.conversationError', 'La conversación ha finalizado debido a un error.')}
            </div>
        </div>
      )}

      <div className="ts-simulation-info">
        <div className="ts-current-node">
          <span>{t('simulation.currentNode', 'Nodo actual')}: </span>
          {currentProcessingNode ? (
            <strong>{currentProcessingNode.data?.label || currentProcessingNode.data?.question || currentProcessingNode.id}</strong>
          ) : (
            <em>{flowStatus === 'ended' ? t('simulation.flowEndedState', 'Finalizado') : t('simulation.noNode', 'Ninguno')}</em>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SimulationInterface);