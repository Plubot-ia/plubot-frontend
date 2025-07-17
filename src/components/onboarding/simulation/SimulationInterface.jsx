import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

import useWindowSize from '../../../hooks/useWindowSize';
import { escapeRegex } from '../../../utils/regex-utilities';
import './SimulationInterface.css';

// Helper para obtener el token JWT (DEBES IMPLEMENTAR ESTO SEGÚN TU APP)
const getAuthToken = () => {
  // Ejemplo: leer de localStorage, Auth Context, etc.
  // Asegúrate de que este token sea el JWT válido para tu backend.
  const token = localStorage.getItem('access_token'); // O el nombre que uses para tu token JWT
  if (!token) {
    // El token no fue encontrado, la función devolverá null y el llamador se encargará.
  }
  return token;
};

// Nueva función para llamar a la API de acción de Discord
const executeDiscordAction = async (nodeData, t) => {
  const jwtToken = getAuthToken();
  if (!jwtToken) {
    return {
      success: false,
      message: 'Error de autenticación: No se encontró el token JWT.',
    };
  }

  // Extraer los datos necesarios del nodo. Asegúrate que estos nombres coincidan
  // con cómo los guardas en node.data en tu DiscordNode.tsx
  const { discordToken, channelId, messageContent } = nodeData;

  if (!discordToken || !channelId || !messageContent) {
    const missing = [];
    if (!discordToken)
      missing.push(t('simulation.missingBotToken', 'Token del Bot'));
    if (!channelId) missing.push('ID del Canal');
    if (!messageContent) missing.push('Mensaje a Enviar');
    return {
      success: false,
      message: `Configuración del nodo Discord incompleta. Faltan: ${missing.join(', ')}`,
    };
  }

  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
    const response = await fetch(`${baseUrl}/actions/discord/send_message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        token: discordToken, // Token del Bot de Discord
        channel_id: channelId, // ID del Canal de Discord
        message: messageContent, // Mensaje a enviar
      }),
    });

    const responseData = await response.json();

    return response.ok
      ? {
          success: true,
          message:
            responseData.message || 'Acción de Discord ejecutada con éxito.',
        }
      : {
          success: false,
          message:
            responseData.message ||
            responseData.error ||
            `Error del servidor: ${response.status}`,
        };
  } catch (error) {
    return {
      success: false,
      message: `Error de red o conexión: ${error.message}`,
    };
  }
};

// Helper function for prompt interpolation
const interpolatePrompt = (template, variables, lastUserMessage) => {
  if (!template) return '';
  let interpolated = template;
  if (variables && typeof variables === 'object') {
    for (const key in variables) {
      if (Object.prototype.hasOwnProperty.call(variables, key)) {
        const regex = new RegExp(
          `\\{\\{\\s*${escapeRegex(key)}\\s*\\}\\}`,
          'g',
        );
        interpolated = interpolated.replace(regex, variables[key] || '');
      }
    }
  }
  // Optional: remove unreplaced placeholders, or leave them
  // interpolated = interpolated.replace(/\{\{.*?\}\}/g, '');

  // Interpolate the last user message if provided
  if (lastUserMessage && typeof lastUserMessage === 'string') {
    const userMessageRegex = /\{\{\s*mensaje_usuario_anterior\s*\}\}/g;
    interpolated = interpolated.replaceAll(userMessageRegex, lastUserMessage);
  }

  return interpolated;
};

// Function to execute AI Node logic
// Function to execute Emotion Detection Node logic
const executeEmotionDetectionNodeAction = async (
  nodeData,
  currentVariables,
  inputText,
  t,
) => {
  const jwtToken = getAuthToken();
  if (!jwtToken) {
    return {
      success: false,
      error: t(
        'simulation.errorAuthGeneric',
        'Error de autenticación: Token no encontrado.',
      ),
    };
  }

  const interpolatedText = interpolatePrompt(inputText, currentVariables, '');

  if (!interpolatedText) {
    return {
      success: false,
      error: 'Error en Nodo de Emoción: El texto de entrada está vacío.',
    };
  }

  const apiUrlFromEnvironment = import.meta.env.VITE_API_URL || '';
  const endpoint = `${apiUrlFromEnvironment}/api/emotion-detect`; // Endpoint específico

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ text: interpolatedText }),
    });

    if (!response.ok) {
      return {
        success: false,
        error:
          response.statusText || 'Error en la API de detección de emoción.',
      };
    }

    const responseData = await response.json();

    // La API debe devolver { emotion: 'happy' }
    const detectedEmotion = responseData.emotion || 'unknown';
    return { success: true, data: { detectedEmotion } };
  } catch (error) {
    return {
      success: false,
      error: `Error de red o servidor al detectar la emoción: ${error.message}`,
    };
  }
};

// Function to execute AI Node logic
const executeAiNodeAction = async (
  nodeData,
  currentVariables,
  lastUserMessage,
  t,
) => {
  const jwtToken = getAuthToken();
  if (!jwtToken) {
    return {
      success: false,
      error: t(
        'simulation.errorAuthGeneric',
        'Error de autenticación: Token no encontrado.',
      ),
    };
  }

  // CORRECTED: Handle both aiNode (prompt) and aiNodePro (promptTemplate)
  const promptTemplate = nodeData.promptTemplate || nodeData.prompt || '';
  const systemMessage = nodeData.systemMessage || '';

  const interpolatedPrompt = interpolatePrompt(
    promptTemplate,
    currentVariables,
    lastUserMessage,
  );

  if (!interpolatedPrompt && !systemMessage) {
    return {
      success: false,
      error: t(
        'simulation.errorAiNodeNoPrompt',
        'Error del Nodo IA: El prompt (plantilla) y el mensaje de sistema están vacíos, incluso después de intentar interpolar variables.',
      ),
    };
  }

  // CORRECTED: Use the correct API endpoint discovered during the audit.
  const apiEndpoint = `${import.meta.env.VITE_API_URL}/ai-node`;

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        // The backend expects a 'prompt' field.
        prompt: interpolatedPrompt,
        temperature: nodeData.temperature,
        maxTokens: nodeData.maxTokens,
        systemMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `Error del servidor: ${response.status}`,
      };
    }

    const result = await response.json();
    return { success: true, data: result.response };
  } catch (error) {
    return {
      success: false,
      error: `Error de red o de conexión: ${error.message}`,
    };
  }
};

const MessageItem = React.memo(({ message }) => {
  const { type, content, timestamp, isActionStatus } = message;
  const itemClass = `ts-message ts-${type} ${isActionStatus ? 'ts-action-status' : ''}`;
  return (
    <div className={itemClass}>
      {type === 'bot' && !isActionStatus && <div className='ts-bot-avatar' />}
      <div className='ts-message-content'>
        <ReactMarkdown>{content}</ReactMarkdown>
        {timestamp && (
          <div className='ts-message-timestamp'>
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
  const scrollReference = useRef(null);
  const textareaReference = useRef(null);

  const [scrollToBottom] = useState(true);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [flowStatus, setFlowStatus] = useState('idle');
  const [userResponses, setUserResponses] = useState({});
  const [userMessageForNode, setUserMessageForNode] = useState(null);
  const [currentDecisionOptions, setCurrentDecisionOptions] = useState([]);
  const simulationStarted = useRef(false);

  // --- DECLARACIONES EN ORDEN CORRECTO ---

  // 1. Datos derivados y constantes
  const nodesJson = useMemo(() => JSON.stringify(nodes), [nodes]);
  const edgesJson = useMemo(() => JSON.stringify(edges), [edges]);

  // 2. Funciones memoizadas (useCallback)
  const addMessageToHistory = useCallback((message) => {
    setSimulationHistory((previous) => [...previous, message]);
  }, []);

  // La función 'processNode' se declara aquí, antes de los useEffect que la usan.
  // Se usa un truco con useRef para evitar problemas de dependencias circulares con los useEffect.
  const processNodeReference = useRef();

  // Efecto para reiniciar la simulación si la estructura del flujo cambia
  useEffect(() => {
    // Reinicia el historial, el nodo actual y el estado del flujo.
    // La bandera 'simulationStarted' se resetea para permitir un nuevo inicio.
    setSimulationHistory([]);
    setCurrentNodeId(null);
    setFlowStatus('idle');
    simulationStarted.current = false;
  }, [nodesJson, edgesJson]); // Se ejecuta solo si la estructura de nodos o aristas cambia.

  // Efecto para iniciar la simulación de forma controlada
  useEffect(() => {
    // Condiciones para iniciar la simulación:
    // 1. El flujo debe estar en estado 'idle' (inactivo).
    // 2. La simulación no debe haber sido iniciada previamente (controlado por simulationStarted.current).
    // 3. Deben existir nodos en el flujo (safeNodes.length > 0).
    if (
      flowStatus === 'idle' &&
      !simulationStarted.current &&
      safeNodes.length > 0
    ) {
      const startNode = safeNodes.find(
        (node) => node.type === 'start' || node.type === 'startNode',
      );

      if (startNode) {
        // Marcar la simulación como iniciada para prevenir múltiples ejecuciones.
        simulationStarted.current = true;

        // Añadir un mensaje de sistema para indicar el inicio.
        addMessageToHistory({
          id: 'system-start',
          type: 'system',
          content: t('simulation.starting', 'Iniciando simulación...'),
          timestamp: new Date().toISOString(),
        });

        // Usar un pequeño retardo para asegurar que la UI esté completamente renderizada
        // antes de procesar el primer nodo. Esto mejora la robustez.
        const startTimeout = setTimeout(() => {
          if (processNodeReference.current) {
            processNodeReference.current(startNode.id);
          }
        }, 150);

        // Limpiar el timeout si el componente se desmonta.
        return () => clearTimeout(startTimeout);
      } else {
        // Si no se encuentra un nodo de inicio, se notifica al usuario y se marca el flujo como erróneo.
        console.error(
          "Error de Simulación: No se encontró un nodo de 'inicio'. El flujo no puede comenzar.",
        );
        addMessageToHistory({
          id: 'error-no-start-node',
          type: 'system',
          content: t(
            'simulation.errorNoStartNode',
            'Error: No se encontró un nodo de inicio. La simulación no puede comenzar.',
          ),
          timestamp: new Date().toISOString(),
        });
        setFlowStatus('error');
      }
    }
  }, [flowStatus, safeNodes, t, addMessageToHistory]); // Dependencias clave para el inicio del flujo.

  // 4. Asignación de la función principal a la referencia.
  // Esto completa el patrón para manejar funciones recursivas o interdependientes con useEffect.
  processNodeReference.current = useCallback(
    async (nodeId, currentResponses, currentMessageForNode) => {
      if (!nodeId) {
        setFlowStatus('ended');
        addMessageToHistory({
          id: 'flow-end-no-node',
          type: 'system',
          content: t(
            'simulation.flowEndedNoNode',
            'Flujo finalizado: no hay más nodos.',
          ),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const node = safeNodes.find((n) => n.id === nodeId);
      if (!node) {
        setFlowStatus('error');
        addMessageToHistory({
          id: `error-node-not-found-${nodeId}`,
          type: 'system',
          content: t(
            'simulation.errorNodeNotFound',
            `Error: Nodo ${nodeId} no encontrado.`,
          ),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      setCurrentNodeId(node.id);
      setFlowStatus('processing');

      if (analyticsTracker) {
        try {
          analyticsTracker('simulation_node_processing', {
            nodeId: node.id,
            nodeType: node.type,
          });
        } catch {}
      }

      switch (node.type) {
        case 'start':
        case 'startNode': {
          const firstEdge = safeEdges.find((edge) => edge.source === node.id);
          if (firstEdge) {
            await processNodeReference.current(
              firstEdge.target,
              currentResponses,
              currentMessageForNode,
            );
          } else {
            setFlowStatus('ended');
            addMessageToHistory({
              id: 'flow-end-no-edge',
              type: 'system',
              content: t(
                'simulation.flowEndedNoEdge',
                'Flujo finalizado: nodo de inicio sin salida.',
              ),
              timestamp: new Date().toISOString(),
            });
          }
          break;
        }

        case 'message': {
          // Combine variable sources: node's own variables array and accumulated responses
          const combinedVariables = { ...currentResponses };
          if (Array.isArray(node.data.variables)) {
            for (const variable of node.data.variables) {
              if (variable && variable.name) {
                combinedVariables[variable.name] = variable.value ?? '';
              }
            }
          }

          const interpolatedContent = interpolatePrompt(
            node.data.message ||
              t('simulation.undefinedMessage', 'Mensaje no definido'),
            combinedVariables,
            '',
          );

          addMessageToHistory({
            id: node.id,
            type: node.data.sender || 'bot',
            content: interpolatedContent,
            timestamp: new Date().toISOString(),
          });
          setFlowStatus('waiting_input');
          break;
        }

        case 'decision': {
          addMessageToHistory({
            id: node.id,
            type: 'bot',
            content:
              node.data.question ||
              t('simulation.undefinedQuestion', '¿Qué opción deseas tomar?'),
            timestamp: new Date().toISOString(),
          });
          const optionEdges = safeEdges.filter(
            (edge) => edge.source === node.id,
          );
          const options = optionEdges.map((edge) => {
            const optionNode = safeNodes.find(
              (n) => n.id === edge.target && n.type === 'option',
            );
            return {
              targetNodeId: edge.target,
              label:
                optionNode?.data?.text ||
                edge.label ||
                `Opción ${optionNode?.id}`,
            };
          });
          setCurrentDecisionOptions(options);
          setFlowStatus('waiting_input');
          break;
        }

        case 'option': {
          const nextEdgeFromOption = safeEdges.find(
            (edge) => edge.source === node.id,
          );
          if (nextEdgeFromOption) {
            await processNodeReference.current(
              nextEdgeFromOption.target,
              currentResponses,
              currentMessageForNode,
            );
          } else {
            setFlowStatus('ended');
            addMessageToHistory({
              id: 'flow-end-no-option-target',
              type: 'system',
              content: t(
                'simulation.flowEndedAfterOption',
                'Flujo finalizado después de la opción.',
              ),
              timestamp: new Date().toISOString(),
            });
          }
          break;
        }

        case 'discord': {
          addMessageToHistory({
            id: `action-status-${node.id}`,
            type: 'system',
            content: t(
              'simulation.executingDiscord',
              'Ejecutando acción de Discord...',
            ),
            timestamp: new Date().toISOString(),
            isActionStatus: true,
          });
          setFlowStatus('executing_action');
          const result = await executeDiscordAction(node.data, t);
          addMessageToHistory({
            id: `action-result-${node.id}`,
            type: result.success ? 'system' : 'error',
            content: result.message,
            timestamp: new Date().toISOString(),
            isActionStatus: true,
          });
          if (result.success) {
            setFlowStatus('processing');
            const nextEdge = safeEdges.find((edge) => edge.source === node.id);
            if (nextEdge) {
              await processNodeReference.current(
                nextEdge.target,
                currentResponses,
                currentMessageForNode,
              );
            } else {
              setFlowStatus('ended');
              addMessageToHistory({
                id: 'flow-end-after-action',
                type: 'system',
                content: t(
                  'simulation.flowEndedAfterAction',
                  'Flujo finalizado después de la acción.',
                ),
                timestamp: new Date().toISOString(),
              });
            }
          } else {
            setFlowStatus('error');
          }
          break;
        }

        case 'emotionDetection': {
          setFlowStatus('executing_action');
          addMessageToHistory({
            id: `system-executing-emotion-${node.id}`,
            type: 'system',
            content: t(
              'simulation.executingEmotionDetection',
              'Ejecutando Nodo de Detección de Emoción...',
            ),
            isActionStatus: true,
            timestamp: new Date().toISOString(),
          });
          let inputText = '';
          const sourceEdges = safeEdges.filter(
            (edge) => edge.target === node.id,
          );
          if (sourceEdges.length > 0) {
            const sourceEdge = sourceEdges[0];
            const sourceNode = safeNodes.find(
              (n) => n.id === sourceEdge.source,
            );
            if (sourceNode) {
              if (sourceNode.type === 'message') {
                inputText =
                  currentMessageForNode ||
                  (simulationHistory.length > 0
                    ? simulationHistory.at(-1).content
                    : '');
              } else {
                inputText = sourceNode.data.question || 'Decision';
                sourceNode.data.message ||
                  sourceNode.data.content ||
                  currentResponses[sourceNode.id] ||
                  '';
              }
            }
          } else {
            inputText =
              Object.values(currentResponses).find(
                (value) => typeof value === 'string' && value.trim() !== '',
              ) || '';
          }
          const emotionResult = await executeEmotionDetectionNodeAction(
            node.data,
            currentResponses,
            inputText,
            t,
          );
          if (emotionResult.success) {
            const { detectedEmotion } = emotionResult.data;
            const nextEdge = safeEdges.find(
              (edge) =>
                edge.source === node.id &&
                edge.sourceHandle === `emotion-${detectedEmotion}`,
            );
            if (nextEdge) {
              await processNodeReference.current(
                nextEdge.target,
                currentResponses,
                currentMessageForNode,
              );
            } else {
              setFlowStatus('ended');
              addMessageToHistory({
                id: 'flow-end-no-emotion-branch',
                type: 'system',
                content: t(
                  'simulation.flowEndedNoEmotionBranch',
                  'Flujo finalizado: No hay rama para la emoción detectada.',
                ),
                timestamp: new Date().toISOString(),
              });
            }
          } else {
            setFlowStatus('error');
            addMessageToHistory({
              id: `error-emotion-${node.id}`,
              type: 'error',
              content:
                t(
                  'simulation.errorEmotionDetection',
                  'Error al detectar la emoción: ',
                ) + emotionResult.error,
              timestamp: new Date().toISOString(),
            });
          }
          break;
        }
        case 'aiNode':
        case 'aiNodePro': {
          const hasPrompt =
            (node.data.prompt && node.data.prompt.trim() !== '') ||
            (node.data.promptTemplate &&
              node.data.promptTemplate.trim() !== '');
          if (!hasPrompt) {
            addMessageToHistory({
              id: `error-ai-prompt-${node.id}`,
              type: 'error',
              content: t(
                'simulation.errorAiNodeNoPrompt',
                'Error de configuración del Nodo IA: El prompt está vacío.',
              ),
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
          const lastUserMessage =
            currentMessageForNode ||
            userMessageForNode ||
            Object.values(userResponses).pop() ||
            '';
          const nodeDataForAction = {
            ...node.data,
            responseVariable: node.data.responseVariable || 'ai_response',
          };
          const aiResult = await executeAiNodeAction(
            nodeDataForAction,
            userResponses,
            lastUserMessage,
            t,
          );
          if (aiResult.success) {
            const aiResponse = aiResult.data;
            const responseVariableName = nodeDataForAction.responseVariable;
            const newResponsesWithAI = {
              ...currentResponses,
              [responseVariableName]: aiResponse,
            };
            addMessageToHistory({
              id: `ai-response-${node.id}`,
              type: 'bot',
              content: aiResponse,
              timestamp: new Date().toISOString(),
            });
            const nextEdge = safeEdges.find((edge) => edge.source === node.id);
            if (nextEdge) {
              await processNodeReference.current(
                nextEdge.target,
                newResponsesWithAI,
                userMessageForNode,
              );
            } else {
              setFlowStatus('ended');
              addMessageToHistory({
                id: 'flow-end-after-ai',
                type: 'system',
                content: t(
                  'simulation.flowEndedAfterAi',
                  'Flujo finalizado después del Nodo IA.',
                ),
                timestamp: new Date().toISOString(),
              });
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
        }

        case 'end': {
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
        }

        default: {
          addMessageToHistory({
            id: `system-non-interactive-${node.id}`,
            type: 'system',
            content: t(
              'simulation.nonInteractiveNode',
              `Nodo no interactivo: ${node.type}. Buscando siguiente nodo.`,
            ),
            timestamp: new Date().toISOString(),
          });
          const defaultNextEdge = safeEdges.find(
            (edge) => edge.source === node.id,
          );
          if (defaultNextEdge) {
            await processNodeReference.current(
              defaultNextEdge.target,
              currentResponses,
              currentMessageForNode,
            );
          } else {
            setFlowStatus('ended');
            addMessageToHistory({
              id: 'flow-end-unknown-type',
              type: 'system',
              content: t(
                'simulation.flowEndedUnknownType',
                'Flujo finalizado: nodo sin salida o tipo no manejado.',
              ),
              timestamp: new Date().toISOString(),
            });
          }
          break;
        }
      }
    },
    [
      safeNodes,
      safeEdges,
      addMessageToHistory,
      t,
      analyticsTracker,
      simulationHistory,
    ],
  );

  const { height: viewportHeight } = useWindowSize();

  useEffect(() => {
    if (scrollReference.current && scrollToBottom) {
      scrollReference.current.scrollTop = scrollReference.current.scrollHeight;
    }
  }, [simulationHistory, scrollToBottom, flowStatus]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 500); // 500ms para coincidir con la animación de cierre
  }, [onClose]);

  const handleRestart = () => {
    setSimulationHistory([]);
    setCurrentNodeId(null);
    setFlowStatus('idle');
    setUserInput('');
    simulationStarted.current = false;
  };

  const currentProcessingNode = useMemo(() => {
    return safeNodes.find((n) => n.id === currentNodeId);
  }, [safeNodes, currentNodeId]);

  const handleUserInputSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || flowStatus !== 'waiting_input') return;

    const userMessageContent = userInput.trim();
    setUserInput('');

    addMessageToHistory({
      id: `user-${currentNodeId}-${Date.now()}`,
      type: 'user',
      content: userMessageContent,
      timestamp: new Date().toISOString(),
    });

    if (analyticsTracker) {
      try {
        analyticsTracker('simulation_user_message_sent', {
          nodeId: currentNodeId,
          messageLength: userMessageContent.length,
        });
      } catch {}
    }

    if (currentProcessingNode?.type === 'message') {
      setUserMessageForNode(userMessageContent);
      const nextEdge = safeEdges.find((edge) => edge.source === currentNodeId);
      if (nextEdge) {
        await processNodeReference.current(
          nextEdge.target,
          userResponses,
          userMessageContent,
        );
      } else {
        setFlowStatus('ended');
        addMessageToHistory({
          id: 'flow-end-after-user-message',
          type: 'system',
          content: t(
            'simulation.flowEndedAfterUserMessage',
            'Flujo finalizado después de tu mensaje.',
          ),
          timestamp: new Date().toISOString(),
        });
      }
    }
  };

  const handleOptionClick = async (option) => {
    if (flowStatus !== 'waiting_input') return;

    setCurrentDecisionOptions([]); // Limpiar opciones después de la selección
    setFlowStatus('processing');
    addMessageToHistory({
      id: `user-option-${currentNodeId}-${Date.now()}`,
      type: 'user',
      content: option.label,
      timestamp: new Date().toISOString(),
    });

    const newResponses = { ...userResponses, [currentNodeId]: option.label };
    setUserResponses(newResponses);

    await new Promise((resolve) => setTimeout(resolve, 50));
    await processNodeReference.current(option.targetNodeId, newResponses, null);
  };

  const mainStyle = { height: `${viewportHeight}px` };

  const renderInputArea = () => {
    if (flowStatus !== 'waiting_input') {
      return null;
    }

    if (currentDecisionOptions.length > 0) {
      return (
        <div className='ts-options-container'>
          {currentDecisionOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option)}
              className='ts-option-btn'
            >
              {option.label}
            </button>
          ))}
        </div>
      );
    }

    const handleTextareaKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (userInput.trim()) {
          handleUserInputSubmit(e);
        }
      }
    };

    return (
      <form onSubmit={handleUserInputSubmit} className='ts-user-input-form'>
        <div className='ts-textarea-wrapper'>
          <textarea
            ref={textareaReference}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={t('simulation.typeHere', 'Escribe aquí...')}
            disabled={flowStatus !== 'waiting_input'}
            className='ts-chat-textarea'
            rows='1'
          />
          <button
            type='submit'
            disabled={!userInput.trim() || flowStatus !== 'waiting_input'}
            className='ts-send-btn'
            aria-label={t('simulation.send', 'Enviar')}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='currentColor'
            >
              <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
            </svg>
          </button>
        </div>
      </form>
    );
  };

  useEffect(() => {
    if (textareaReference.current) {
      textareaReference.current.style.height = 'auto'; // Reset height to recalculate
      const { scrollHeight } = textareaReference.current;
      textareaReference.current.style.height = `${scrollHeight}px`;
    }
  }, [userInput]);

  return (
    <div
      className={`ts-simulation-interface ${isClosing ? 'ts-closing' : ''}`}
      style={mainStyle}
    >
      <div className='ts-header'>
        <h2>{t('simulation.title', 'Simulación')}</h2>
        <div className='ts-header-actions'>
          <button
            onClick={handleRestart}
            className='ts-restart-btn'
            aria-label={t('simulation.restart', 'Reiniciar')}
          >
            <i className='fas fa-redo' />
          </button>
          <button
            onClick={handleClose}
            className='ts-close-btn'
            aria-label={t('simulation.close', 'Cerrar')}
          >
            <i className='fas fa-times' />
          </button>
        </div>
      </div>
      <div className='ts-chat-container' ref={scrollReference}>
        {simulationHistory.length > 0
          ? simulationHistory.map((message) => (
              <div
                key={message.id}
                className={`ts-message ts-${message.type}${message.isActionStatus ? ' ts-action-status' : ''}`}
              >
                {message.type === 'bot' && !message.isActionStatus && (
                  <div className='ts-bot-avatar' />
                )}
                <div className='ts-message-content'>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                  {message.timestamp && (
                    <div className='ts-timestamp'>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          : flowStatus === 'idle' &&
            !simulationStarted.current && (
              <div className='ts-message ts-system'>
                <div className='ts-message-content'>
                  {t('simulation.startPrompt', 'Comienza la conversación...')}
                </div>
              </div>
            )}
        {flowStatus === 'waiting_input' && (
          <div className='ts-message ts-system ts-action-status'>
            <div className='ts-message-content'>
              {t('simulation.waitingForInput', 'Esperando tu respuesta...')}
            </div>
          </div>
        )}
        {flowStatus === 'ended' && (
          <div className='ts-message ts-system ts-action-status'>
            <div className='ts-message-content'>
              {t('simulation.flowEnded', 'El flujo ha finalizado.')}
            </div>
          </div>
        )}
        {flowStatus === 'error' && (
          <div className='ts-message ts-error ts-action-status'>
            <div className='ts-message-content'>
              <strong>{t('simulation.error', 'Error')}:</strong>{' '}
              {t('simulation.errorGeneric', 'Ocurrió un error.')}
            </div>
          </div>
        )}
      </div>

      {renderInputArea()}

      {(flowStatus === 'ended' || flowStatus === 'error') && (
        <div className='ts-restart-container'>
          <button onClick={handleRestart} className='ts-restart-btn'>
            {t('simulation.restart', 'Reiniciar Simulación')}
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(SimulationInterface);
