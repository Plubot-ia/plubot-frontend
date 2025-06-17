import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useWindowSize from '../../../hooks/useWindowSize';
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

// Helper function for prompt interpolation
const interpolatePrompt = (template, variables, lastUserMessage) => {
  if (!template) return '';
  let interpolated = template;
  if (variables && typeof variables === 'object') {
    for (const key in variables) {
      if (Object.prototype.hasOwnProperty.call(variables, key)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        interpolated = interpolated.replace(regex, variables[key] || '');
      }
    }
  }
  // Optional: remove unreplaced placeholders, or leave them
  // interpolated = interpolated.replace(/\{\{.*?\}\}/g, '');

  // Interpolate the last user message if provided
  if (lastUserMessage && typeof lastUserMessage === 'string') {
    const userMessageRegex = new RegExp(`\\{\\{\s*mensaje_usuario_anterior\s*\\}\\}`, 'g');
    interpolated = interpolated.replace(userMessageRegex, lastUserMessage);
  }

  return interpolated;
};

// Function to execute AI Node logic
// Function to execute Emotion Detection Node logic
const executeEmotionDetectionNodeAction = async (nodeData, currentVariables, inputText, t) => {
  const jwtToken = getAuthToken();
  if (!jwtToken) {
    return { success: false, error: t('simulation.errorAuthGeneric', 'Error de autenticación: Token no encontrado.') };
  }

  const interpolatedText = interpolatePrompt(inputText, currentVariables, '');

  if (!interpolatedText) {
    return { success: false, error: 'Error en Nodo de Emoción: El texto de entrada está vacío.' };
  }

  const apiUrlFromEnv = import.meta.env.VITE_API_URL || '';
  const endpoint = `${apiUrlFromEnv}/api/emotion-detect`; // Endpoint específico

  try {
    console.log('[EmotionDetection] URL del endpoint:', endpoint);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ text: interpolatedText }),
    });

    console.log('[EmotionDetection] Respuesta de la API:', response.status, response.statusText, response.url);
    if (!response.ok) {
      return { success: false, error: response.statusText || 'Error en la API de detección de emoción.' };
    }

    const responseData = await response.json();
    console.log('[EmotionDetection] Datos de la respuesta:', responseData);
    // La API debe devolver { emotion: 'happy' }
    const detectedEmotion = responseData.emotion || 'unknown';
    return { success: true, data: { detectedEmotion } };

  } catch (error) {
    console.error('[EmotionDetection] Error ejecutando nodo de detección de emoción:', error);
    return { success: false, error: 'Error de red o servidor al detectar la emoción: ' + error.message };
  }
};

// Function to execute AI Node logic
const executeAiNodeAction = async (nodeData, currentVariables, lastUserMessage, t) => {
  const jwtToken = getAuthToken();
  if (!jwtToken) {
    return { success: false, error: t('simulation.errorAuthGeneric', 'Error de autenticación: Token no encontrado.') };
  }

  const {
    promptTemplate,
    temperature,
    maxTokens,
    systemMessage,
    responseVariable
  } = nodeData;

  if (!responseVariable) {
    return { success: false, error: t('simulation.errorAiNodeNoResponseVar', 'Error de configuración del Nodo IA: La "Variable de Respuesta" no está definida en los datos del nodo.') };
  }

  const interpolatedPrompt = interpolatePrompt(promptTemplate, currentVariables, lastUserMessage);

  if (!interpolatedPrompt && !systemMessage) {
    return { success: false, error: t('simulation.errorAiNodeNoPrompt', 'Error del Nodo IA: El prompt (plantilla) y el mensaje de sistema están vacíos, incluso después de intentar interpolar variables.') };
  }

  const apiUrlFromEnv = import.meta.env.VITE_API_URL || '';
  const endpoint = `${apiUrlFromEnv}/api/ai-node`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        prompt: interpolatedPrompt,
        temperature,
        maxTokens,
        systemMessage,
      }),
    });

    const responseData = await response.json();

    if (response.ok) {
      return { success: true, data: responseData.response || t('simulation.aiEmptyResponse', '(Respuesta vacía del IA)') };
    } else {
      return { success: false, error: responseData.message || responseData.error || `${t('simulation.errorServerGeneric', 'Error del servidor')}: ${response.status}` };
    }
  } catch (error) {
    console.error('Error al ejecutar acción de Nodo IA:', error);
    return { success: false, error: `${t('simulation.errorNetworkGeneric', 'Error de red o conexión')}: ${error.message}` };
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
  isUltraMode = false,
}) => {
  const { t } = useTranslation();
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];

  const [simulationHistory, setSimulationHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [scrollToBottom, setScrollToBottom] = useState(true);


  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [flowStatus, setFlowStatus] = useState('idle'); // idle, processing, waiting_input, executing_action, ended, error
  const [userResponses, setUserResponses] = useState({}); // Para nodos de decisión
  const [userMessageForNode, setUserMessageForNode] = useState(null); // Para nodos de mensaje

  console.log('[Simulation] Inicializando componente de simulación');

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
          setFlowStatus('error');
        }
        break;

      case 'emotionDetection':
        setFlowStatus('executing_action');
        addMessageToHistory({
          id: `system-executing-emotion-${node.id}`,
          type: 'system',
          content: t('simulation.executingEmotionDetection', 'Ejecutando Nodo de Detección de Emoción...'),
          isActionStatus: true,
          timestamp: new Date().toISOString(),
        });

        // Determinar el texto de entrada para el nodo de emoción
        let inputText = '';
        const sourceEdges = safeEdges.filter(edge => edge.target === node.id);
        if (sourceEdges.length > 0) {
          const sourceEdge = sourceEdges[0];
          const sourceNode = safeNodes.find(n => n.id === sourceEdge.source);
          console.log('[EmotionDetection] Nodo anterior encontrado:', sourceNode);
          if (sourceNode) {
            const outputHandle = sourceEdge.sourceHandle || 'default';
            console.log('[EmotionDetection] Handle de salida del nodo anterior:', outputHandle);
            if (sourceNode.type === 'message') {
              if (currentMessageForNode) {
                inputText = currentMessageForNode;
              } else {
                console.log('[EmotionDetection] No se encontró texto con las claves estándar, buscando último mensaje...');
                const lastMessage = simulationHistory.length > 0 ? simulationHistory[simulationHistory.length - 1].content : '';
                inputText = lastMessage;
              }
            } else {
              console.log('[EmotionDetection] Buscando texto en los datos del nodo anterior:', sourceNode.data);
              inputText = sourceNode.data.text || sourceNode.data.message || sourceNode.data.content || '';
              if (!inputText) {
                console.log('[EmotionDetection] No se encontró texto en los datos del nodo anterior, intentando con currentResponses');
                inputText = currentResponses[sourceNode.id] || '';
              }
            }
            console.log('[EmotionDetection] Texto extraído de los datos del nodo anterior:', inputText);
          }
        } else {
          console.log('[EmotionDetection] Intentando extraer texto de currentResponses:', currentResponses);
          inputText = Object.values(currentResponses).find(val => typeof val === 'string' && val.trim() !== '') || '';
        }
        console.log('[EmotionDetection] Texto extraído final:', inputText);

        const emotionResult = await executeEmotionDetectionNodeAction(node.data, currentResponses, inputText, t);

        if (emotionResult.success) {
          const { detectedEmotion } = emotionResult.data;
          
          // No usar useFlowStore, simplemente continuar con el flujo
          console.log('[EmotionDetection] Emoción detectada:', detectedEmotion);

          // Encontrar la rama correspondiente a la emoción detectada
          const nextEdge = safeEdges.find(edge => edge.source === node.id && edge.sourceHandle === `emotion-${detectedEmotion}`);
          
          if (nextEdge) {
            await processNode(nextEdge.target, currentResponses, currentMessageForNode);
          } else {
            // Si no hay una rama para la emoción, el flujo podría terminar aquí
            setFlowStatus('ended');
            addMessageToHistory({
              id: 'flow-end-no-emotion-branch',
              type: 'system',
              content: t('simulation.flowEndedNoEmotionBranch', 'Flujo finalizado: No hay rama para la emoción detectada.'),
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          setFlowStatus('error');
          addMessageToHistory({
            id: `error-emotion-${node.id}`,
            type: 'error',
            content: t('simulation.errorEmotionDetection', 'Error al detectar la emoción: ') + emotionResult.error,
            timestamp: new Date().toISOString(),
          });
          if (analyticsTracker) {
            try { analyticsTracker('simulation_node_error', { nodeId: node.id, nodeType: node.type, error: emotionResult.error }); } catch(e) {}
          }
        }
        return;
        break;

      case 'ai':
        addMessageToHistory({
          id: `action-status-${node.id}`,
          type: 'system',
          content: t('simulation.executingAiNode', 'Ejecutando Nodo IA...'),
          timestamp: new Date().toISOString(),
          isActionStatus: true,
        });
        setFlowStatus('executing_action');
        console.log('[Simulation] Processing AI Node ID:', node.id, 'Data:', JSON.parse(JSON.stringify(node.data || {})), 'Variables:', JSON.parse(JSON.stringify(currentResponses || {})));

        const aiResult = await executeAiNodeAction(node.data, currentResponses, currentMessageForNode, t);
        
        if (aiResult.success) {
          addMessageToHistory({
            id: `ai-response-${node.id}`,
            type: 'bot',
            content: aiResult.data,
            timestamp: new Date().toISOString(),
          });

          const updatedResponses = { 
            ...currentResponses, 
            [node.data.responseVariable]: aiResult.data 
          };
          
          setFlowStatus('processing');
          const nextEdge = safeEdges.find(edge => edge.source === node.id);
          if (nextEdge) {
            await processNode(nextEdge.target, updatedResponses, currentMessageForNode);
          } else {
            setFlowStatus('ended');
            addMessageToHistory({ id: 'flow-end-after-ai', type: 'system', content: t('simulation.flowEndedAfterAi', 'Flujo finalizado después del Nodo IA.'), timestamp: new Date().toISOString() });
          }
        } else {
          addMessageToHistory({
            id: `ai-error-${node.id}`,
            type: 'error',
            content: aiResult.error,
            timestamp: new Date().toISOString(),
            isActionStatus: true,
          });
          setFlowStatus('error');
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
    console.log('[Simulation] Iniciando simulación. Estado actual:', flowStatus);
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

  const { height: viewportHeight } = useWindowSize();

  useEffect(() => {
    if (scrollRef.current && scrollToBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [simulationHistory, scrollToBottom, flowStatus]);

  useEffect(() => {
    console.log('[Simulation] useEffect para nodes o edges detectado. Estado de simulación:', flowStatus);
    // Evitar reinicio si la simulación ya está en curso y no hay cambios significativos
    if (flowStatus !== 'idle') {
      console.log('[Simulation] Simulación en curso, verificando si hay cambios significativos en nodes o edges');
      // Aquí puedes agregar lógica para comparar los nodos o aristas anteriores con los nuevos
      // Por ahora, simplemente no reiniciamos automáticamente
      console.log('[Simulation] No se reiniciará la simulación automáticamente');
      return;
    }
    console.log('[Simulation] Reinicio detectado. Estado cambiado a idle');
    setFlowStatus('idle');
    setSimulationHistory([]);
    setUserResponses({});
    setUserMessageForNode(null);
    setCurrentNodeId(null);
    // Iniciar simulación nuevamente después de un reinicio
    setTimeout(() => {
      console.log('[Simulation] Iniciando simulación después de reinicio');
      startSimulation();
    }, 0);
  }, [nodes, edges, startSimulation]);

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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Duración de la animación en ms
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
    <div className={`ts-simulation-interface ${isClosing ? 'ts-closing' : ''}`} style={mainStyle}>
      <div className="ts-header">
        <h2>{t('simulation.title', 'Simulación')}</h2>
        <button onClick={handleClose} className="ts-close-btn" aria-label={t('simulation.close', 'Cerrar')}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="ts-chat-container" ref={scrollRef}>
        {simulationHistory.length > 0 ? (
          simulationHistory.map((msg) => (
            <div key={msg.id} className={`ts-message ts-${msg.type}${msg.isActionStatus ? ' ts-action-status' : ''}`}>
              {msg.type === 'bot' && !msg.isActionStatus && <div className="ts-bot-avatar"></div>}
              <div className="ts-message-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
                {msg.timestamp && <div className="ts-timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</div>}
              </div>
            </div>
          ))
        ) : (
          <div className="ts-message ts-system">
            <div className="ts-message-content">{t('simulation.startPrompt', 'Comienza la conversación...')}</div>
          </div>
        )}
        {flowStatus === 'waiting_input' && (
          <div className="ts-message ts-system ts-action-status">
            <div className="ts-message-content">
              {t('simulation.waitingForInput', 'Esperando tu respuesta...')}
            </div>
          </div>
        )}
        {flowStatus === 'ended' && (
          <div className="ts-message ts-system ts-action-status">
            <div className="ts-message-content">
              {t('simulation.flowEnded', 'El flujo ha finalizado.')}
            </div>
          </div>
        )}
        {flowStatus === 'error' && (
          <div className="ts-message ts-error ts-action-status">
            <div className="ts-message-content">
              <strong>{t('simulation.error', 'Error')}:</strong> {t('simulation.errorGeneric', 'Ocurrió un error.')}
            </div>
          </div>
        )}
      </div>

      {flowStatus === 'waiting_input' && (
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
          <button
            type="submit"
            disabled={isExecuting || !userInput.trim()}
            aria-label={t('simulation.send', 'Enviar')}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      )}
      
      {flowStatus === 'waiting_input' && currentNodeId && safeNodes.find(n => n.id === currentNodeId)?.type === 'decision' && (
        <div className="ts-decision-options">
          {safeNodes
            .filter(
              (node) =>
                node.type === 'option' &&
                node.data.parentDecisionNodeId === currentNodeId
            )
            .map((optionNode) => (
              <button
                key={optionNode.id}
                onClick={() => handleOptionClick(optionNode.data.label)}
                className="ts-decision-option-btn"
                disabled={flowStatus !== 'waiting_input'}
              >
                {optionNode.data.label}
              </button>
            ))}
        </div>
      )}
      
      {(flowStatus === 'ended' || flowStatus === 'error') && (
        <div className="ts-restart-container">
          <button onClick={startSimulation} className="ts-restart-btn">
            {t('simulation.restart', 'Reiniciar Simulación')}
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(SimulationInterface);