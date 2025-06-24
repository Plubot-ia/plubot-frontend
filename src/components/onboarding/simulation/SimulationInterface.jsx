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
        const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
    const response = await fetch(`${baseUrl}/actions/discord/send_message`, {
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ text: interpolatedText }),
    });


    if (!response.ok) {
      return { success: false, error: response.statusText || 'Error en la API de detección de emoción.' };
    }

    const responseData = await response.json();

    // La API debe devolver { emotion: 'happy' }
    const detectedEmotion = responseData.emotion || 'unknown';
    return { success: true, data: { detectedEmotion } };

  } catch (error) {
    return { success: false, error: 'Error de red o servidor al detectar la emoción: ' + error.message };
  }
};

// Function to execute AI Node logic
const executeAiNodeAction = async (nodeData, currentVariables, lastUserMessage, t) => {

  const jwtToken = getAuthToken();
  if (!jwtToken) {
    return { success: false, error: t('simulation.errorAuthGeneric', 'Error de autenticación: Token no encontrado.') };
  }

  // CORRECTED: Handle both aiNode (prompt) and aiNodePro (promptTemplate)
  const promptTemplate = nodeData.promptTemplate || nodeData.prompt || '';
  const systemMessage = nodeData.systemMessage || '';

  const interpolatedPrompt = interpolatePrompt(promptTemplate, currentVariables, lastUserMessage);

  if (!interpolatedPrompt && !systemMessage) {
    return { success: false, error: t('simulation.errorAiNodeNoPrompt', 'Error del Nodo IA: El prompt (plantilla) y el mensaje de sistema están vacíos, incluso después de intentar interpolar variables.') };
  }

  // CORRECTED: Use the correct API endpoint discovered during the audit.
  const apiEndpoint = `${import.meta.env.VITE_API_URL}/ai-node`;

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        // The backend expects a 'prompt' field.
        prompt: interpolatedPrompt,
        temperature: nodeData.temperature,
        maxTokens: nodeData.maxTokens,
        systemMessage: systemMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || `Error del servidor: ${response.status}` };
    }

    const result = await response.json();
    return { success: true, data: result.response };
  } catch (error) {
    return { success: false, error: `Error de red o de conexión: ${error.message}` };
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
  const simulationStarted = useRef(false);



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
          content: node.data.message || t('simulation.undefinedMessage', 'Mensaje no definido'),
          timestamp: new Date().toISOString(),
        });
        // Un nodo de mensaje siempre espera la entrada del usuario.
        setFlowStatus('waiting_input');
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

      // Option nodes are transient, just pass through to the next node.
      case 'option':
        const nextEdgeFromOption = safeEdges.find(edge => edge.source === node.id);
        if (nextEdgeFromOption) {
          await processNode(nextEdgeFromOption.target, currentResponses, currentMessageForNode);
        } else {
          setFlowStatus('ended');
          addMessageToHistory({ id: 'flow-end-no-option-target', type: 'system', content: t('simulation.flowEndedAfterOption', 'Flujo finalizado después de la opción.'), timestamp: new Date().toISOString() });
        }
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

          if (sourceNode) {
            const outputHandle = sourceEdge.sourceHandle || 'default';

            if (sourceNode.type === 'message') {
              if (currentMessageForNode) {
                inputText = currentMessageForNode;
              } else {

                const lastMessage = simulationHistory.length > 0 ? simulationHistory[simulationHistory.length - 1].content : '';
                inputText = lastMessage;
              }
            } else {

              inputText = sourceNode.data.text || sourceNode.data.message || sourceNode.data.content || '';
              if (!inputText) {

                inputText = currentResponses[sourceNode.id] || '';
              }
            }

          }
        } else {

          inputText = Object.values(currentResponses).find(val => typeof val === 'string' && val.trim() !== '') || '';
        }


        const emotionResult = await executeEmotionDetectionNodeAction(node.data, currentResponses, inputText, t);

        if (emotionResult.success) {
          const { detectedEmotion } = emotionResult.data;
          
          // No usar useFlowStore, simplemente continuar con el flujo


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
        }
        return;
        break;

      case 'aiNode':
      case 'aiNodePro': // Handle aiNodePro identically to aiNode
        // CORRECTED: Validate prompt for both aiNode (prompt) and aiNodePro (promptTemplate)
        const hasPrompt = (node.data.prompt && node.data.prompt.trim() !== '') || (node.data.promptTemplate && node.data.promptTemplate.trim() !== '');
        if (!hasPrompt) {
          addMessageToHistory({
            id: `error-ai-prompt-${node.id}`,
            type: 'error',
            content: t('simulation.errorAiNodeNoPrompt', 'Error de configuración del Nodo IA: El prompt está vacío.'),
            timestamp: new Date().toISOString(),
          });
          setFlowStatus('error');
          break;
        }

        setFlowStatus('executing_action');
        addMessageToHistory({
          id: `system-executing-ai-${node.id}`,
          type: 'system',
          content: t('simulation.executingAi', 'Ejecutando Nodo IA...'),
          isActionStatus: true,
          timestamp: new Date().toISOString(),
        });

        const lastUserMessage = currentMessageForNode || userMessageForNode || Object.values(userResponses).pop() || '';

        
        const nodeDataForAction = {
          ...node.data,
          responseVariable: node.data.responseVariable || 'ai_response',
        };
        const aiResult = await executeAiNodeAction(nodeDataForAction, userResponses, lastUserMessage, t);

        if (aiResult.success) {
          const aiResponse = aiResult.data;
          const responseVarName = nodeDataForAction.responseVariable; // Use the potentially fixed variable
          const newResponsesWithAI = { 
            ...currentResponses, 
            [responseVarName]: aiResponse 
          };
          
          addMessageToHistory({
            id: `ai-response-${node.id}`,
            type: 'bot',
            content: aiResponse,
            timestamp: new Date().toISOString(),
          });

          const nextEdge = safeEdges.find(edge => edge.source === node.id);
          if (nextEdge) {
            await processNode(nextEdge.target, newResponsesWithAI, userMessageForNode);
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
        addMessageToHistory({
          id: `system-non-interactive-${node.id}`,
          type: 'system',
          content: t('simulation.nonInteractiveNode', `Nodo no interactivo: ${node.type}. Buscando siguiente nodo.`),
          timestamp: new Date().toISOString(),
        });
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

  // Controla el inicio de la simulación para que se ejecute solo una vez.
  // El botón de reinicio llama a `startSimulation` directamente para reinicios manuales.
  useEffect(() => {
    if (initialStartNodeId && !simulationStarted.current) {

      simulationStarted.current = true;
      startSimulation();
    }
  }, [initialStartNodeId, startSimulation]);

  const { height: viewportHeight } = useWindowSize();

  // Efecto para auto-scroll hacia abajo
  useEffect(() => {
    if (scrollRef.current && scrollToBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [simulationHistory, scrollToBottom, flowStatus]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Duración de la animación en ms
  };

  const currentProcessingNode = useMemo(() => {
    return safeNodes.find(n => n.id === currentNodeId);
  }, [safeNodes, currentNodeId]);

  const isWaitingForUserInput = useMemo(() => {
    return flowStatus === 'waiting_input';
  }, [flowStatus]);

  // FINAL REFACTOR: Options are the actual nodes connected to the DecisionNode's outputs.
  const currentDecisionOptions = useMemo(() => {

    if (isWaitingForUserInput && currentProcessingNode?.type === 'decision') {
      const connectedEdges = safeEdges.filter(edge => edge.source === currentProcessingNode.id);
      const options = connectedEdges.map(edge => {
        const targetNode = safeNodes.find(node => node.id === edge.target);
        if (targetNode && targetNode.type === 'option') {
          // Lógica robusta: Asumir que el orden de las aristas coincide con el orden de las condiciones.
          const conditions = currentProcessingNode.data?.conditions || [];
          const edgeIndex = connectedEdges.findIndex(e => e.id === edge.id);
          const condition = conditions[edgeIndex];

          return {
            label: condition?.text || `Opción ${edgeIndex + 1}`,
            targetNodeId: targetNode.id,
          };
        }
        return null;
      }).filter(Boolean);


    return options;
    }
    return [];
  }, [isWaitingForUserInput, currentProcessingNode, safeEdges, safeNodes]);

  const handleOptionClick = useCallback(async (option) => {

    if (flowStatus !== 'waiting_input') return;

    setFlowStatus('processing');
    addMessageToHistory({
      id: `user-option-${currentNodeId}-${Date.now()}`,
      type: 'user',
      content: option.label,
      timestamp: new Date().toISOString(),
    });

    const newResponses = { ...userResponses, [currentNodeId]: option.label };
    setUserResponses(newResponses);

    if (analyticsTracker) {
      try { analyticsTracker('simulation_decision_option_selected', { nodeId: currentNodeId, option: option.label }); } catch (e) {}
    }

    await new Promise(resolve => setTimeout(resolve, 50)); // Pausa para refresco de UI

    // La lógica correcta: procesar el OptionNode. Su ID está en targetNodeId.
    // La función processNode se encargará de la transición desde el OptionNode al siguiente.
    await processNode(option.targetNodeId, newResponses, null);
  }, [flowStatus, currentNodeId, userResponses, addMessageToHistory, setUserResponses, analyticsTracker, processNode]);

  const handleUserInputSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || flowStatus !== 'waiting_input') return;

    const userMsgContent = userInput.trim();
    setUserInput('');

    addMessageToHistory({
      id: `user-${currentNodeId}-${Date.now()}`,
      type: 'user',
      content: userMsgContent,
      timestamp: new Date().toISOString(),
    });

    if (analyticsTracker) {
      try { analyticsTracker('simulation_user_message_sent', { nodeId: currentNodeId, messageLength: userMsgContent.length }); } catch (e) {}
    }

    if (currentProcessingNode?.type === 'decision') {
      const selectedOption = currentDecisionOptions.find(opt => opt.label.toLowerCase() === userMsgContent.toLowerCase());
      if (selectedOption) {
        await handleOptionClick(selectedOption);
      } else {
        addMessageToHistory({
          id: `user-error-${currentNodeId}-${Date.now()}`,
          type: 'system',
          content: t('simulation.invalidOption', 'Opción no válida. Por favor, elige una de las opciones disponibles o escribe una de ellas.'),
          timestamp: new Date().toISOString(),
        });
      }
    } else if (currentProcessingNode?.type === 'message') {
      setUserMessageForNode(userMsgContent);
      const nextEdge = safeEdges.find(edge => edge.source === currentNodeId);
      if (nextEdge) {
        await processNode(nextEdge.target, userResponses, userMsgContent);
      } else {
        setFlowStatus('ended');
        addMessageToHistory({ id: 'flow-end-after-user-message', type: 'system', content: t('simulation.flowEndedAfterUserMessage', 'Flujo finalizado después de tu mensaje.'), timestamp: new Date().toISOString() });
      }
    }
  };

  useEffect(() => {
    // Focus input only if it's a message node waiting for input
    if (inputRef.current && isWaitingForUserInput && currentProcessingNode?.type === 'message') {
      inputRef.current.focus();
    }
  }, [isWaitingForUserInput, currentProcessingNode]);

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

      {isWaitingForUserInput && (
        <div className="ts-input-area">
          {currentDecisionOptions.length > 0 && (
            <div className="ts-decision-options">
              {currentDecisionOptions.map((option) => (
                <button
                  key={option.targetNodeId} // La clave debe ser el ID del nodo de opción, que es único.
                  onClick={() => handleOptionClick(option)}
                  className="ts-decision-option-btn"
                  disabled={!isWaitingForUserInput}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleUserInputSubmit} className="ts-user-input-container">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserInputSubmit(e); }}}
              placeholder={
                currentDecisionOptions.length > 0
                  ? t('simulation.decisionPlaceholder', 'Elige una opción o escribe tu respuesta...')
                  : t('simulation.inputPlaceholder', 'Escribe tu respuesta...')
              }
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