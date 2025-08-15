import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

import useFlowStore from '@/stores/use-flow-store';

// Removed non-existent useStore import - using useFlowStore instead
import { DEFAULT_SOURCE_HANDLE } from '../../../config/handleConfig';
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

// Función auxiliar para validar datos de Discord
const validateDiscordNodeData = (nodeData, t) => {
  const { discordToken, channelId, messageContent } = nodeData;

  if (!discordToken || !channelId || !messageContent) {
    const missing = [];
    if (!discordToken) missing.push(t('simulation.missingBotToken', 'Token del Bot'));
    if (!channelId) missing.push('ID del Canal');
    if (!messageContent) missing.push('Mensaje a Enviar');
    return {
      isValid: false,
      error: `Configuración del nodo Discord incompleta. Faltan: ${missing.join(', ')}`,
    };
  }

  return { isValid: true, data: { discordToken, channelId, messageContent } };
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

  const validation = validateDiscordNodeData(nodeData, t);
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.error,
    };
  }

  const { discordToken, channelId, messageContent } = validation.data;

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
          message: responseData.message || 'Acción de Discord ejecutada con éxito.',
        }
      : {
          success: false,
          message:
            responseData.message || responseData.error || `Error del servidor: ${response.status}`,
        };
  } catch (error) {
    return {
      success: false,
      message: `Error de red o conexión: ${error.message}`,
    };
  }
};

// Helper function to convert duration to milliseconds
const convertDurationToMs = (duration, unit) => {
  switch (unit) {
    case 'ms': {
      return duration;
    }
    case 's': {
      return duration * 1000;
    }
    case 'm': {
      return duration * 60 * 1000;
    }
    case 'h': {
      return duration * 60 * 60 * 1000;
    }
    default: {
      return duration * 1000; // Por defecto, asumir segundos
    }
  }
};

// Helper function to format wait message
const formatWaitMessage = (duration, unit) => {
  switch (unit) {
    case 'ms': {
      return duration === 1 ? '1 milisegundo' : `${duration} milisegundos`;
    }
    case 's': {
      return duration === 1 ? '1 segundo' : `${duration} segundos`;
    }
    case 'm': {
      return duration === 1 ? '1 minuto' : `${duration} minutos`;
    }
    case 'h': {
      return duration === 1 ? '1 hora' : `${duration} horas`;
    }
    default: {
      return `${duration} ${unit}`;
    }
  }
};

// Helper function for prompt interpolation
const interpolatePrompt = (template, variables, lastUserMessage) => {
  if (!template) return '';
  let interpolated = template;
  if (variables && typeof variables === 'object') {
    for (const key in variables) {
      if (Object.prototype.hasOwnProperty.call(variables, key)) {
        // eslint-disable-next-line security/detect-non-literal-regexp -- key is safely escaped with escapeRegex() before use
        const regex = new RegExp(`{{\\s*${escapeRegex(key)}\\s*}}`, 'g');
        // eslint-disable-next-line security/detect-object-injection -- key comes from safe hasOwnProperty iteration
        interpolated = interpolated.replace(regex, variables[key] ?? '');
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

// Function to execute ApiNode HTTP requests
// Helper function to parse headers
const parseApiHeaders = (headers) => {
  if (typeof headers !== 'string') {
    return headers;
  }

  try {
    return JSON.parse(headers);
  } catch {
    // If not valid JSON, try to parse as key:value pairs
    const parsedHeaders = {};
    for (const line of headers.split('\n')) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        parsedHeaders[key.trim()] = valueParts.join(':').trim();
      }
    }
    return parsedHeaders;
  }
};

// Helper function to interpolate body with variables
const interpolateApiBody = (body, currentVariables) => {
  if (!body || !currentVariables || typeof currentVariables !== 'object') {
    return body;
  }

  let interpolatedBody = body;
  for (const [key, value] of Object.entries(currentVariables)) {
    // eslint-disable-next-line security/detect-non-literal-regexp -- key is safely escaped with escapeRegex() before use
    const regex = new RegExp(`\\{\\{\\s*${escapeRegex(key)}\\s*\\}\\}`, 'g');
    interpolatedBody = interpolatedBody.replace(regex, value ?? '');
  }
  return interpolatedBody;
};

// Helper function to parse response
const parseApiResponse = (responseData) => {
  try {
    return JSON.parse(responseData);
  } catch {
    return responseData;
  }
};

const executeApiNodeAction = async ({ nodeData, currentVariables, t }) => {
  const {
    url,
    method = 'GET',
    headers = {},
    body = '',
    guardarEnVariable = 'api_response',
  } = nodeData;

  if (!url) {
    return {
      success: false,
      error: t('simulation.apiNodeNoUrl', 'URL no configurada en el nodo API'),
    };
  }

  try {
    // Parse headers
    const parsedHeaders = parseApiHeaders(headers);

    // Parse body if needed
    const parsedBody = method !== 'GET' && body ? interpolateApiBody(body, currentVariables) : body;

    // Build fetch options
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...parsedHeaders,
      },
    };

    if (method !== 'GET' && parsedBody) {
      fetchOptions.body = typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody);
    }

    // Execute the request
    const response = await fetch(url, fetchOptions);
    const responseData = await response.text();
    const parsedResponse = parseApiResponse(responseData);

    return response.ok
      ? {
          success: true,
          data: parsedResponse,
          status: response.status,
          variable: guardarEnVariable,
        }
      : {
          success: false,
          error: `HTTP ${response.status}: ${responseData}`,
          status: response.status,
        };
  } catch (error) {
    return {
      success: false,
      error: t('simulation.apiNodeError', `Error en petición: ${error.message}`),
    };
  }
};

// Function to execute AI Node logic
// Function to execute Emotion Detection Node logic
const executeEmotionDetectionNodeAction = async ({ _nodeData, currentVariables, inputText, t }) => {
  const jwtToken = getAuthToken();
  if (!jwtToken) {
    return {
      success: false,
      error: t('simulation.errorAuthGeneric', 'Error de autenticación: Token no encontrado.'),
    };
  }

  const interpolatedText = interpolatePrompt(inputText, currentVariables, '');

  if (!interpolatedText) {
    return {
      success: false,
      error: 'Error en Nodo de Emoción: El texto de entrada está vacío.',
    };
  }

  const apiUrlFromEnvironment = import.meta.env.VITE_API_URL ?? '';
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
        error: response.statusText || 'Error en la API de detección de emoción.',
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
const executeAiNodeAction = async ({ nodeData, currentVariables, lastUserMessage, t }) => {
  const jwtToken = getAuthToken();
  if (!jwtToken) {
    return {
      success: false,
      error: t('simulation.errorAuthGeneric', 'Error de autenticación: Token no encontrado.'),
    };
  }

  // CORRECTED: Handle both aiNode (prompt) and aiNodePro (promptTemplate)
  const promptTemplate = nodeData.promptTemplate ?? nodeData.prompt ?? '';
  const systemMessage = nodeData.systemMessage ?? '';

  const interpolatedPrompt = interpolatePrompt(promptTemplate, currentVariables, lastUserMessage);

  if (!interpolatedPrompt && !systemMessage) {
    return {
      success: false,
      error: t(
        'simulation.errorAiNodeNoPrompt',
        'Error de configuración del Nodo IA: El prompt está vacío.',
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
          <div className='ts-message-timestamp'>{new Date(timestamp).toLocaleTimeString()}</div>
        )}
      </div>
    </div>
  );
});

MessageItem.propTypes = {
  message: PropTypes.shape({
    type: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired,
    isActionStatus: PropTypes.bool,
  }).isRequired,
};

MessageItem.displayName = 'MessageItem';

/* eslint-disable max-lines-per-function */
// DEUDA TÉCNICA: SimulationInterface es el motor central de simulación conversacional.
// La función (722 líneas) implementa el engine completo de procesamiento de flujos:
// simulación de nodos, validaciones, transiciones, analytics, manejo de errores,
// estados conversacionales, y lógica de UI/UX para la experiencia de chat.
// CORE BUSINESS: Funcionalidad principal de valor del producto Plubot.
// ARQUITECTURA: Parcialmente modularizada con helpers y optimizaciones de rendimiento.
// RIESGO CRÍTICO: Refactorización comprometería el corazón funcional del producto.
// FUTURE: Dividir en engine + UI + analytics en arquitectura completamente nueva.
// Regla desactivada para preservar estabilidad del sistema de simulación crítico.

const SimulationInterface = ({
  nodes = [],
  edges = [],
  onClose = () => {
    // Default empty handler
  },
  analyticsTracker,
  /* eslint-disable-next-line react/prop-types */
  _isUltraMode = false,
}) => {
  const { t } = useTranslation();
  const safeNodes = useMemo(() => (Array.isArray(nodes) ? nodes : []), [nodes]);
  const safeEdges = useMemo(() => (Array.isArray(edges) ? edges : []), [edges]);

  const [simulationHistory, setSimulationHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const scrollReference = useRef(undefined);
  const textareaReference = useRef(undefined);

  const [scrollToBottom] = useState(true);
  const [currentNodeId, setCurrentNodeId] = useState();
  const [flowStatus, setFlowStatus] = useState('idle');
  const [userResponses, setUserResponses] = useState({});
  const [userMessageForNode, setUserMessageForNode] = useState();
  const [currentInputNode, setCurrentInputNode] = useState();
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
    setCurrentNodeId(undefined);
    setFlowStatus('idle');
    simulationStarted.current = false;
  }, [nodesJson, edgesJson]); // Se ejecuta solo si la estructura de nodos o aristas cambia.

  // Efecto para iniciar la simulación de forma controlada
  useEffect(() => {
    // Condiciones para iniciar la simulación:
    // 1. El flujo debe estar en estado 'idle' (inactivo).
    // 2. La simulación no debe haber sido iniciada previamente (controlado por simulationStarted.current).
    // 3. Deben existir nodos en el flujo (safeNodes.length > 0).
    if (flowStatus === 'idle' && !simulationStarted.current && safeNodes.length > 0) {
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

  // Función auxiliar para validar y preparar nodo antes del procesamiento
  const validateAndPrepareNode = useCallback(
    (nodeId) => {
      if (!nodeId) {
        setFlowStatus('ended');
        addMessageToHistory({
          id: 'flow-end-no-node',
          type: 'system',
          content: t('simulation.flowEndedNoNode', 'Flujo finalizado: no hay más nodos.'),
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
          content: t('simulation.errorNodeNotFound', `Error: Nodo ${nodeId} no encontrado.`),
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

      return node;
    },
    [safeNodes, setFlowStatus, addMessageToHistory, t, analyticsTracker, setCurrentNodeId],
  );

  // Hook para acceder al store de la misma manera que el editor
  const flowStore = useFlowStore();

  // Función para validar si un nodo AI tiene un prompt válido
  const validateNodeHasPrompt = useCallback(
    (node) => {
      try {
        const storeNode = flowStore.nodes?.find((n) => n.id === node.id);

        if (!storeNode) {
          return false;
        }

        const nodeData = storeNode.data ?? {};

        const hasValidPrompt =
          (nodeData.prompt && nodeData.prompt.trim() !== '') ||
          (nodeData.promptTemplate && nodeData.promptTemplate.trim() !== '');

        return hasValidPrompt;
      } catch {
        return false;
      }
    },
    [flowStore.nodes],
  );

  // Función auxiliar para procesar nodos de inicio
  const processStartNode = useCallback(
    async (node, currentResponses, currentMessageForNode) => {
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
          content: t('simulation.flowEndedNoEdge', 'Flujo finalizado: nodo de inicio sin salida.'),
          timestamp: new Date().toISOString(),
        });
      }
    },
    [safeEdges, setFlowStatus, addMessageToHistory, t],
  );

  // Función auxiliar para procesar nodos de fin
  const processEndNode = useCallback(
    (node) => {
      if (node.data.label) {
        addMessageToHistory({
          id: node.id,
          type: 'system',
          content: node.data.label,
          timestamp: new Date().toISOString(),
        });
      }
      setFlowStatus('ended');
    },
    [addMessageToHistory, setFlowStatus],
  );

  // Función auxiliar para procesar nodos no interactivos (default case)
  const processDefaultNode = useCallback(
    async (node, currentResponses, currentMessageForNode) => {
      addMessageToHistory({
        id: `system-non-interactive-${node.id}`,
        type: 'system',
        content: t(
          'simulation.nonInteractiveNode',
          `Nodo no interactivo: ${node.type}. Buscando siguiente nodo.`,
        ),
        timestamp: new Date().toISOString(),
      });
      const defaultNextEdge = safeEdges.find((edge) => edge.source === node.id);
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
    },
    [addMessageToHistory, t, safeEdges, setFlowStatus],
  );

  // Función auxiliar para procesar nodos de entrada (InputNode)
  const processInputNode = useCallback(
    (node, _currentResponses) => {
      const question = node.data.question || '¿Cuál es tu respuesta?';
      const variableName = node.data.variable || 'respuesta';
      const inputType = node.data.type || 'text';
      const required = node.data.required ?? false;

      // Mostrar la pregunta al usuario
      addMessageToHistory({
        id: `input-question-${node.id}`,
        type: 'bot',
        content: question,
        timestamp: new Date().toISOString(),
      });

      // Configurar el estado para esperar la respuesta del usuario
      setCurrentInputNode({
        id: node.id,
        variableName,
        inputType,
        required,
      });

      setFlowStatus('waiting_input');
    },
    [addMessageToHistory, setFlowStatus],
  );

  // Función auxiliar para procesar nodos de mensaje
  const processMessageNode = useCallback(
    (node, currentResponses) => {
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
        node.data.message || t('simulation.undefinedMessage', 'Mensaje no definido'),
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
    },
    [t, addMessageToHistory, setFlowStatus],
  );

  // Función auxiliar para procesar nodos de opción
  const processOptionNode = useCallback(
    async (node, currentResponses, currentMessageForNode) => {
      const nextEdgeFromOption = safeEdges.find((edge) => edge.source === node.id);
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
          content: t('simulation.flowEndedAfterOption', 'Flujo finalizado después de la opción.'),
          timestamp: new Date().toISOString(),
        });
      }
    },
    [safeEdges, setFlowStatus, addMessageToHistory, t],
  );

  // Función auxiliar para procesar nodos de decisión
  const processDecisionNode = useCallback(
    (node) => {
      addMessageToHistory({
        id: node.id,
        type: 'bot',
        content:
          node.data.question || t('simulation.undefinedQuestion', '¿Qué opción deseas tomar?'),
        timestamp: new Date().toISOString(),
      });
      const optionEdges = safeEdges.filter((edge) => edge.source === node.id);
      const options = optionEdges.map((edge) => {
        const optionNode = safeNodes.find((n) => n.id === edge.target && n.type === 'option');
        return {
          targetNodeId: edge.target,
          label: optionNode?.data?.text || edge.label || `Opción ${optionNode?.id}`,
        };
      });
      setCurrentDecisionOptions(options);
      setFlowStatus('waiting_input');
    },
    [addMessageToHistory, t, safeEdges, safeNodes, setCurrentDecisionOptions, setFlowStatus],
  );

  // Función auxiliar para procesar nodos de Discord
  const processDiscordNode = useCallback(
    async (node, currentResponses, currentMessageForNode) => {
      addMessageToHistory({
        id: `action-status-${node.id}`,
        type: 'system',
        content: t('simulation.executingDiscord', 'Ejecutando acción de Discord...'),
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
            content: t('simulation.flowEndedAfterAction', 'Flujo finalizado después de la acción.'),
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        setFlowStatus('error');
      }
    },
    [addMessageToHistory, t, setFlowStatus, safeEdges],
  );

  // Función auxiliar para extraer texto de entrada para nodos de emoción
  const extractEmotionInputText = useCallback(
    (node, currentResponses, currentMessageForNode) => {
      let inputText = '';
      const sourceEdges = safeEdges.filter((edge) => edge.target === node.id);
      if (sourceEdges.length > 0) {
        const [sourceEdge] = sourceEdges;
        const sourceNode = safeNodes.find((n) => n.id === sourceEdge.source);
        if (sourceNode) {
          const messageContent =
            simulationHistory.length > 0 ? simulationHistory.at(-1).content : '';
          inputText =
            sourceNode.type === 'message'
              ? currentMessageForNode || messageContent
              : sourceNode.data.question || 'Decision';
        }
      } else {
        inputText =
          Object.values(currentResponses).find(
            (value) => typeof value === 'string' && value.trim() !== '',
          ) ?? '';
      }
      return inputText;
    },
    [safeEdges, safeNodes, simulationHistory],
  );

  // Función auxiliar para evaluar una condición individual
  const evaluateCondition = useCallback((condition, currentResponses) => {
    const variableValue = currentResponses[condition.variable] ?? '';
    const compareValue = condition.value ?? '';

    switch (condition.operator) {
      case 'equals': {
        return variableValue === compareValue;
      }
      case 'not_equals': {
        return variableValue !== compareValue;
      }
      case 'greater': {
        return Number(variableValue) > Number(compareValue);
      }
      case 'less': {
        return Number(variableValue) < Number(compareValue);
      }
      case 'greater_equal': {
        return Number(variableValue) >= Number(compareValue);
      }
      case 'less_equal': {
        return Number(variableValue) <= Number(compareValue);
      }
      case 'contains': {
        return String(variableValue).includes(String(compareValue));
      }
      case 'not_contains': {
        return !String(variableValue).includes(String(compareValue));
      }
      default: {
        return false;
      }
    }
  }, []);

  // Función auxiliar para procesar nodos de condición
  const processConditionNode = useCallback(
    async (node, currentResponses, currentMessageForNode) => {
      setFlowStatus('processing');

      // Evaluar las condiciones
      const conditions = node.data.conditions ?? [];
      let result = false;

      for (const condition of conditions) {
        const conditionResult = evaluateCondition(condition, currentResponses);

        // Aplicar operador lógico
        if (conditions.indexOf(condition) === 0) {
          result = conditionResult;
        } else if (condition.logicalOperator === 'and') {
          result = result && conditionResult;
        } else if (condition.logicalOperator === 'or') {
          result = result || conditionResult;
        }
      }

      // Mostrar mensaje de evaluación
      addMessageToHistory({
        id: `condition-${node.id}`,
        type: 'system',
        content: t(
          'simulation.evaluatingCondition',
          `Evaluando condición: ${result ? 'Verdadero' : 'Falso'}`,
        ),
        timestamp: new Date().toISOString(),
      });

      // Buscar la salida correspondiente
      const handleId = result ? 'true' : 'false';
      const nextEdge = safeEdges.find(
        (edge) => edge.source === node.id && edge.sourceHandle === handleId,
      );

      if (nextEdge) {
        await processNodeReference.current(
          nextEdge.target,
          currentResponses,
          currentMessageForNode,
        );
      } else {
        // Si no hay salida específica, buscar salida por defecto
        const defaultEdge = safeEdges.find(
          (edge) => edge.source === node.id && edge.sourceHandle === DEFAULT_SOURCE_HANDLE,
        );

        if (defaultEdge) {
          await processNodeReference.current(
            defaultEdge.target,
            currentResponses,
            currentMessageForNode,
          );
        } else {
          setFlowStatus('ended');
          addMessageToHistory({
            id: 'flow-end-after-condition',
            type: 'system',
            content: t(
              'simulation.flowEndedAfterCondition',
              'Flujo finalizado después de evaluar la condición.',
            ),
            timestamp: new Date().toISOString(),
          });
        }
      }
    },
    [addMessageToHistory, t, setFlowStatus, safeEdges, evaluateCondition],
  );

  // Función auxiliar para procesar nodos de detección de emoción
  const processEmotionDetectionNode = useCallback(
    async (node, currentResponses, currentMessageForNode) => {
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
      const inputText = extractEmotionInputText(node, currentResponses, currentMessageForNode);
      const emotionResult = await executeEmotionDetectionNodeAction({
        nodeData: node.data,
        currentVariables: currentResponses,
        inputText,
        t,
      });
      if (emotionResult.success) {
        const { detectedEmotion } = emotionResult.data;
        const nextEdge = safeEdges.find(
          (edge) => edge.source === node.id && edge.sourceHandle === `emotion-${detectedEmotion}`,
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
            t('simulation.errorEmotionDetection', 'Error al detectar la emoción: ') +
            emotionResult.error,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [setFlowStatus, addMessageToHistory, t, safeEdges, extractEmotionInputText],
  );

  // Función auxiliar para procesar nodos ApiNode
  const processApiNode = useCallback(
    async (node, currentResponses, currentMessageForNode) => {
      setFlowStatus('executing_action');

      // Mostrar mensaje de estado
      addMessageToHistory({
        id: `api-executing-${node.id}`,
        type: 'system',
        content: t(
          'simulation.executingApiNode',
          `Ejecutando petición HTTP ${node.data.method || 'GET'}...`,
        ),
        timestamp: new Date().toISOString(),
        isActionStatus: true,
      });

      // Ejecutar la petición HTTP
      const apiResult = await executeApiNodeAction({
        nodeData: node.data,
        currentVariables: currentResponses,
        t,
      });

      if (apiResult.success) {
        // Guardar respuesta en variable si está configurado
        const newResponses = { ...currentResponses };
        if (apiResult.variable) {
          newResponses[apiResult.variable] = apiResult.data;
        }

        // Mostrar mensaje de éxito
        addMessageToHistory({
          id: `api-success-${node.id}`,
          type: 'system',
          content: t(
            'simulation.apiNodeSuccess',
            `Petición HTTP exitosa (${apiResult.status}). Respuesta guardada en: ${apiResult.variable}`,
          ),
          timestamp: new Date().toISOString(),
          isActionStatus: true,
        });

        // Continuar con el siguiente nodo
        setFlowStatus('processing');
        const nextEdge = safeEdges.find((edge) => edge.source === node.id);
        if (nextEdge) {
          await processNodeReference.current(nextEdge.target, newResponses, currentMessageForNode);
        } else {
          setFlowStatus('ended');
          addMessageToHistory({
            id: 'flow-end-after-api',
            type: 'system',
            content: t(
              'simulation.flowEndedAfterApi',
              'Flujo finalizado después de la petición HTTP.',
            ),
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // Mostrar mensaje de error
        addMessageToHistory({
          id: `api-error-${node.id}`,
          type: 'error',
          content: apiResult.error,
          timestamp: new Date().toISOString(),
          isActionStatus: true,
        });
        setFlowStatus('error');
      }
    },
    [addMessageToHistory, t, setFlowStatus, safeEdges],
  );

  // Función auxiliar para procesar nodos de IA
  const processAiNode = useCallback(
    async (node, currentResponses, currentMessageForNode) => {
      if (!validateNodeHasPrompt(node)) {
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
        return;
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
        currentMessageForNode ?? userMessageForNode ?? Object.values(userResponses).pop() ?? '';
      const nodeDataForAction = {
        ...node.data,
        responseVariable: node.data.responseVariable || 'ai_response',
      };
      const aiResult = await executeAiNodeAction({
        nodeData: nodeDataForAction,
        currentVariables: userResponses,
        lastUserMessage,
        t,
      });
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
            content: t('simulation.flowEndedAfterAi', 'Flujo finalizado después del Nodo IA.'),
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
    },
    [
      validateNodeHasPrompt,
      addMessageToHistory,
      t,
      setFlowStatus,
      userMessageForNode,
      userResponses,
      safeEdges,
    ],
  );

  // Función auxiliar para generar contenido HTML de media
  const generateMediaContent = useCallback(
    (mediaType, url, caption, altText) => {
      const captionHtml = caption
        ? `<p class="media-caption" style="margin-top: 8px; font-size: 14px; color: #666;">${caption}</p>`
        : '';

      switch (mediaType) {
        case 'image': {
          return `<div class="media-container">
            <img src="${url}" alt="${altText || caption || 'Imagen'}" style="max-width: 100%; height: auto; border-radius: 8px;" />
            ${captionHtml}
          </div>`;
        }
        case 'video': {
          return `<div class="media-container">
            <video controls style="max-width: 100%; height: auto; border-radius: 8px;">
              <source src="${url}" type="video/mp4">
              ${t('simulation.videoNotSupported', 'Tu navegador no soporta el elemento de video.')}
            </video>
            ${captionHtml}
          </div>`;
        }
        case 'audio': {
          return `<div class="media-container">
            <audio controls style="width: 100%;">
              <source src="${url}" type="audio/mpeg">
              ${t('simulation.audioNotSupported', 'Tu navegador no soporta el elemento de audio.')}
            </audio>
            ${captionHtml}
          </div>`;
        }
        case 'file': {
          const fileName = url.split('/').pop() || 'archivo';
          return `<div class="media-container" style="padding: 16px; background: #f5f5f5; border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 24px;">📎</span>
              <div>
                <a href="${url}" download target="_blank" style="color: #0066cc; text-decoration: none; font-weight: 500;">${fileName}</a>
                ${caption ? `<p style="margin-top: 4px; font-size: 14px; color: #666;">${caption}</p>` : ''}
              </div>
            </div>
          </div>`;
        }
        default: {
          return `<p>${t('simulation.unsupportedMediaType', 'Tipo de media no soportado')}</p>`;
        }
      }
    },
    [t],
  );

  // Función auxiliar para procesar nodos multimedia (MediaNode)
  const processMediaNode = useCallback(
    async (node, currentResponses, currentMessageForNode) => {
      const { type, url, caption, altText } = node.data ?? {};

      if (!url) {
        addMessageToHistory({
          id: `media-error-${node.id}`,
          type: 'error',
          content: t('simulation.mediaUrlMissing', 'URL del contenido multimedia no especificada'),
          timestamp: new Date().toISOString(),
        });
        setFlowStatus('error');
        return;
      }

      // Crear el contenido HTML según el tipo de media
      const mediaType = type || 'image';
      const mediaContent = generateMediaContent(mediaType, url, caption, altText);

      // Mostrar el contenido multimedia
      addMessageToHistory({
        id: `media-${node.id}`,
        type: 'bot',
        content: mediaContent,
        timestamp: new Date().toISOString(),
        isHtml: true,
      });

      // Continuar con el siguiente nodo
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
          id: 'flow-end-after-media',
          type: 'system',
          content: t(
            'simulation.flowEndedAfterMedia',
            'Flujo finalizado después del contenido multimedia.',
          ),
          timestamp: new Date().toISOString(),
        });
      }
    },
    [addMessageToHistory, t, setFlowStatus, safeEdges, generateMediaContent],
  );

  // Función auxiliar para procesar nodos de espera (WaitNode)
  const processWaitNode = useCallback(
    async (node, currentResponses, currentMessageForNode) => {
      // CRITICAL: Always get the most recent node data from the props
      // The safeNodes might be stale, so we need to check the nodes prop directly
      const mostRecentNode = nodes.find((n) => n.id === node.id);
      const currentNode = mostRecentNode || safeNodes.find((n) => n.id === node.id) || node;
      const nodeData = currentNode.data || {};

      // Usar los valores del nodo con valores por defecto apropiados
      const duration =
        nodeData.duration !== undefined && nodeData.duration !== null
          ? Number(nodeData.duration)
          : 2;
      const unit = nodeData.unit || 's';
      const description = nodeData.description || '';

      // Convertir a milisegundos usando la función auxiliar
      const durationMs = convertDurationToMs(duration, unit);

      // Formatear el mensaje de espera usando la función auxiliar
      const waitMessage = formatWaitMessage(duration, unit);

      // Mostrar mensaje de inicio de espera
      addMessageToHistory({
        id: `wait-start-${node.id}-${Date.now()}`,
        type: 'system',
        content: (() => {
          const descriptionPart = description ? `: ${description}` : '';
          return t('simulation.waitingFor', `⏱ Esperando ${waitMessage}${descriptionPart}...`);
        })(),
        timestamp: new Date().toISOString(),
      });

      try {
        // Realizar la espera
        await new Promise((resolve) => {
          setTimeout(resolve, durationMs);
        });

        // Mostrar mensaje de espera completada
        addMessageToHistory({
          id: `wait-complete-${node.id}-${Date.now()}`,
          type: 'system',
          content: t('simulation.waitComplete', '✅ Espera completada'),
          timestamp: new Date().toISOString(),
        });

        // Continuar con el siguiente nodo
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
            id: 'flow-end-after-wait',
            type: 'system',
            content: t('simulation.flowEndedAfterWait', 'Flujo finalizado después de la espera.'),
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        addMessageToHistory({
          id: `wait-error-${node.id}`,
          type: 'error',
          content: `Error en el nodo de espera: ${error.message}`,
          timestamp: new Date().toISOString(),
        });
        setFlowStatus('error');
      }
    },
    [addMessageToHistory, t, setFlowStatus, safeEdges, safeNodes, nodes],
  );

  // Función auxiliar para manejar operación SET de memoria
  const handleMemorySet = useCallback(
    (key, value, currentResponses) => {
      if (!value && value !== 0 && value !== false) {
        return {
          success: false,
          message: t('simulation.memoryValueMissing', 'Valor requerido para la acción "set"'),
        };
      }
      Object.assign(globalThis.memoryContext, { [key]: value });
      Object.assign(currentResponses, { [key]: value });
      return { success: true, message: `🧠 ➕ Memoria guardada: "${key}" = "${value}"` };
    },
    [t],
  );

  // Función auxiliar para manejar operación GET de memoria
  const handleMemoryGet = useCallback((key, outputVariable, currentResponses) => {
    let retrievedValue;
    if (Object.prototype.hasOwnProperty.call(globalThis.memoryContext, key)) {
      retrievedValue = Object.entries(globalThis.memoryContext).find(([k]) => k === key)?.[1];
    }
    if (retrievedValue === undefined) {
      return { success: true, message: `🧠 ⚠️ Clave "${key}" no encontrada en memoria` };
    }
    const variableName = outputVariable || 'memory_value';
    Object.assign(currentResponses, { [variableName]: retrievedValue });
    return { success: true, message: `🧠 👁 Valor obtenido: "${key}" = "${retrievedValue}"` };
  }, []);

  // Función auxiliar para manejar operación DELETE de memoria
  const handleMemoryDelete = useCallback((key, currentResponses) => {
    if (!Object.prototype.hasOwnProperty.call(globalThis.memoryContext, key)) {
      return { success: true, message: `🧠 ⚠️ Clave "${key}" no existía en memoria` };
    }
    const entries = Object.entries(globalThis.memoryContext).filter(
      ([property]) => property !== key,
    );
    globalThis.memoryContext = Object.fromEntries(entries);
    if (Object.prototype.hasOwnProperty.call(currentResponses, key)) {
      // Filtrar las entradas sin reasignar el parámetro
      Object.entries(currentResponses).filter(([property]) => property !== key);
    }
    return { success: true, message: `🧠 🗑 Memoria eliminada: "${key}"` };
  }, []);

  // Función helper para manejar errores de memoria
  const handleMemoryError = useCallback(
    (nodeId, message) => {
      addMessageToHistory({
        id: `memory-error-${nodeId}`,
        type: 'error',
        content: message,
        timestamp: new Date().toISOString(),
      });
      setFlowStatus('error');
    },
    [addMessageToHistory, setFlowStatus],
  );

  // Función helper para ejecutar operaciones de memoria
  const executeMemoryOperation = useCallback(
    (action, key, nodeData, currentResponses) => {
      switch (action) {
        case 'set': {
          const { value } = nodeData;
          return handleMemorySet(key, value, currentResponses);
        }
        case 'get': {
          const outputVariable = nodeData.output_variable || nodeData.outputVariable;
          return handleMemoryGet(key, outputVariable, currentResponses);
        }
        case 'delete': {
          return handleMemoryDelete(key, currentResponses);
        }
        default: {
          return {
            success: false,
            message: `🧠 ❌ Acción desconocida: "${action}"`,
          };
        }
      }
    },
    [handleMemorySet, handleMemoryGet, handleMemoryDelete],
  );

  // Función auxiliar para procesar nodos de memoria (MemoryNode)
  const processMemoryNode = useCallback(
    async (node, currentResponses, currentMessageForNode) => {
      const nodeData = node.data ?? {};
      const { action, description } = nodeData;

      // Obtener la clave según la acción
      const key = nodeData.key || nodeData.variable_name;

      // Validar que haya una clave
      if (!key) {
        handleMemoryError(
          node.id,
          t('simulation.memoryKeyMissing', 'Clave de memoria no especificada'),
        );
        return;
      }

      // Inicializar el contexto de memoria si no existe
      if (!globalThis.memoryContext) {
        globalThis.memoryContext = {};
      }

      let resultMessage = '';
      let success = true;

      try {
        const result = executeMemoryOperation(action, key, nodeData, currentResponses);

        // Para la operación 'set', manejar errores especialmente
        if (action === 'set' && !result.success) {
          handleMemoryError(node.id, result.message);
          return;
        }

        ({ message: resultMessage, success } = result);
      } catch (error) {
        resultMessage = `🧠 ❌ Error al procesar memoria: ${error.message}`;
        success = false;
      }

      // Agregar descripción si existe
      if (description && success) {
        resultMessage += `\n📝 ${description}`;
      }

      // Mostrar el resultado de la operación
      addMessageToHistory({
        id: `memory-${node.id}`,
        type: success ? 'system' : 'error',
        content: resultMessage,
        timestamp: new Date().toISOString(),
      });

      // Mostrar estado actual del contexto (opcional, para debugging)
      // if (process.env.NODE_ENV === 'development') {
      //   // Memory context available at globalThis.memoryContext for debugging
      // }

      // Continuar con el siguiente nodo si la operación fue exitosa
      if (success) {
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
            id: 'flow-end-after-memory',
            type: 'system',
            content: t(
              'simulation.flowEndedAfterMemory',
              'Flujo finalizado después de la operación de memoria.',
            ),
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        setFlowStatus('error');
      }
    },
    [addMessageToHistory, t, setFlowStatus, safeEdges, executeMemoryOperation, handleMemoryError],
  );

  // Función auxiliar para procesar tipos de nodo con mapeo
  const processNodeByType = useCallback(
    async (node, currentResponses, currentMessageForNode) => {
      const nodeProcessors = {
        start: () => processStartNode(node, currentResponses, currentMessageForNode),
        startNode: () => processStartNode(node, currentResponses, currentMessageForNode),
        message: () => processMessageNode(node, currentResponses),
        decision: () => processDecisionNode(node),
        condition: () => processConditionNode(node, currentResponses, currentMessageForNode),
        option: () => processOptionNode(node, currentResponses, currentMessageForNode),
        discord: () => processDiscordNode(node, currentResponses, currentMessageForNode),
        emotionDetection: () =>
          processEmotionDetectionNode(node, currentResponses, currentMessageForNode),
        apinode: () => processApiNode(node, currentResponses, currentMessageForNode),
        waitnode: () => processWaitNode(node, currentResponses, currentMessageForNode),
        medianode: () => processMediaNode(node, currentResponses, currentMessageForNode),
        memorynode: () => processMemoryNode(node, currentResponses, currentMessageForNode),
        aiNode: () => processAiNode(node, currentResponses, currentMessageForNode),
        aiNodePro: () => processAiNode(node, currentResponses, currentMessageForNode),
        inputNode: () => processInputNode(node, currentResponses, currentMessageForNode),
        end: () => processEndNode(node),
      };

      const processor =
        nodeProcessors[node.type] ||
        (() => processDefaultNode(node, currentResponses, currentMessageForNode));
      await processor();
    },
    [
      processStartNode,
      processMessageNode,
      processDecisionNode,
      processConditionNode,
      processOptionNode,
      processDiscordNode,
      processEmotionDetectionNode,
      processApiNode,
      processWaitNode,
      processMediaNode,
      processMemoryNode,
      processAiNode,
      processInputNode,
      processEndNode,
      processDefaultNode,
    ],
  );

  // 4. Asignación de la función principal a la referencia.
  // Esto completa el patrón para manejar funciones recursivas o interdependientes con useEffect.
  processNodeReference.current = useCallback(
    async (nodeId, currentResponses, currentMessageForNode) => {
      const node = validateAndPrepareNode(nodeId);
      if (!node) return;

      await processNodeByType(node, currentResponses, currentMessageForNode);
    },
    [validateAndPrepareNode, processNodeByType],
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
    // Resetear todos los estados relacionados con la simulación
    setSimulationHistory([]);
    setCurrentNodeId(undefined);
    setFlowStatus('idle');
    setUserInput('');
    setUserResponses({});
    setUserMessageForNode(undefined);
    setCurrentInputNode(undefined);
    setCurrentDecisionOptions([]);
    simulationStarted.current = false;

    // Forzar el reinicio del flujo desde el nodo inicial
    // Esto asegura que el flujo comience desde el principio
    setTimeout(() => {
      const startNode = safeNodes.find((n) => n.type === 'start');

      if (startNode && processNodeReference.current) {
        // Pass the node ID, not the node object
        processNodeReference.current(startNode.id, {});
      } else {
        // Could not restart: no start node or processNode not ready
      }
    }, 100);
  };

  const handleUserInputSubmit = async (event_) => {
    event_.preventDefault();
    if (!userInput.trim() || flowStatus !== 'waiting_input') return;

    const userMessageContent = userInput.trim();
    setUserInput('');

    addMessageToHistory({
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessageContent,
      timestamp: new Date().toISOString(),
    });

    // Si estamos procesando un InputNode, guardar la respuesta con el nombre de variable correcto
    let updatedResponses;
    if (currentInputNode) {
      updatedResponses = {
        ...userResponses,
        [currentInputNode.variableName]: userMessageContent,
      };
      setCurrentInputNode(undefined); // Limpiar el estado del InputNode
    } else {
      // Comportamiento normal para otros tipos de nodos
      updatedResponses = {
        ...userResponses,
        [currentNodeId || 'user_input']: userMessageContent,
      };
    }

    setUserResponses(updatedResponses);
    setUserMessageForNode(userMessageContent);

    // Buscar el siguiente nodo
    const currentNode = safeNodes.find(
      (node) => node.id === (currentInputNode?.id || currentNodeId),
    );
    if (currentNode) {
      const nextEdge = safeEdges.find((edge) => edge.source === currentNode.id);
      if (nextEdge) {
        await processNodeReference.current(nextEdge.target, updatedResponses, userMessageContent);
      } else {
        setFlowStatus('ended');
        addMessageToHistory({
          id: 'flow-end',
          type: 'system',
          content: t('simulation.flowEnded', 'El flujo ha finalizado.'),
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

    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 50));
    await processNodeReference.current(option.targetNodeId, newResponses);
  };

  const mainStyle = { height: `${viewportHeight}px` };

  const renderInputArea = () => {
    if (flowStatus !== 'waiting_input') {
      return;
    }

    if (currentDecisionOptions.length > 0) {
      return (
        <div className='ts-options-container'>
          {currentDecisionOptions.map((option, index) => (
            <button
              key={option.targetNodeId || `option-${index}`}
              onClick={() => handleOptionClick(option)}
              className='ts-option-btn'
            >
              {option.label}
            </button>
          ))}
        </div>
      );
    }

    const handleTextareaKeyDown = (event_) => {
      if (event_.key === 'Enter' && !event_.shiftKey) {
        event_.preventDefault();
        if (userInput.trim()) {
          handleUserInputSubmit(event_);
        }
      }
    };

    return (
      <form onSubmit={handleUserInputSubmit} className='ts-user-input-form'>
        <div className='ts-textarea-wrapper'>
          <textarea
            ref={textareaReference}
            value={userInput}
            onChange={(event_) => setUserInput(event_.target.value)}
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
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'>
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

  // Componente auxiliar para el header
  const SimulationHeader = () => (
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
  );

  // Componente auxiliar para el área de mensajes
  const ChatContainer = () => (
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
  );

  return (
    <div className={`ts-simulation-interface ${isClosing ? 'ts-closing' : ''}`} style={mainStyle}>
      <SimulationHeader />
      <ChatContainer />

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

SimulationInterface.propTypes = {
  nodes: PropTypes.array,
  edges: PropTypes.array,
  onClose: PropTypes.func,
  analyticsTracker: PropTypes.any,
};

export default React.memo(SimulationInterface);
