// nodeConfig.js
import { v4 as uuidv4 } from 'uuid';
import { powers } from '../data/powers';

export const NODE_TYPES = {
    start: 'start',
    end: 'end',
    message: 'message',
    decision: 'decision',
    action: 'action',
    option: 'option',
    HTTP_REQUEST_NODE: 'httpRequestNode',
    WEBHOOK_NODE: 'webhookNode',
    DATABASE_NODE: 'databaseNode',
    AI_NODE: 'aiNode',
    NLP_NODE: 'nlpNode',
    COMPLEX_CONDITION_NODE: 'complexConditionNode',
    POWER_NODE: 'powerNode',
    ULTRA_OPTIMIZED_NODE: 'ultraOptimizedNode', // Nodo optimizado para el modo Ultra Rendimiento
    ADVANCED_AI_NODE: 'ai', // Nuevo nodo IA Avanzada
};

export const EDGE_TYPES = {
    default: 'default',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    ULTRA_OPTIMIZED_EDGE: 'ultraOptimizedEdge', // Borde optimizado para el modo Ultra Rendimiento
};

export const ACTION_TYPES = [
    { value: 'sendEmail', label: 'Enviar Correo', icon: '📧' },
    { value: 'saveData', label: 'Guardar Datos', icon: '💾' },
    { value: 'sendNotification', label: 'Enviar Notificación', icon: '🔔' },
    { value: 'apiCall', label: 'Llamada API', icon: '🌐' },
    { value: 'transformData', label: 'Transformar Datos', icon: '🔄' },
    { value: 'conditional', label: 'Condicional', icon: '⚙️' },
    { value: 'delay', label: 'Retraso', icon: '⏱️' },
    { value: 'webhook', label: 'Webhook', icon: '🔗' },
];

export const CONDITION_TYPES = [
    'Contiene',
    'Igual a',
    'Mayor que',
    'Menor que',
    'Es nulo',
    'No contiene',
];

export const NODE_DEFAULT_SIZES = {
    start: { width: 80, height: 40 },
    end: { width: 120, height: 80 },
    message: { width: 180, height: 80 },
    decision: { width: 180, height: 110 },
    action: { width: 240, height: 140 },
    option: { width: 150, height: 80 },
    httpRequestNode: { width: 240, height: 140 },
    webhookNode: { width: 240, height: 140 },
    databaseNode: { width: 240, height: 140 },
    aiNode: { width: 240, height: 140 },
    nlpNode: { width: 240, height: 140 },
    complexConditionNode: { width: 240, height: 140 },
    powerNode: { width: 240, height: 160 },
};

export const EDGE_COLORS = {
    default: '#ff00ff', // Magenta neón intenso para las aristas
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    // Colores optimizados para modo ultra rendimiento
    ultra: {
        default: '#8a2be2', // Versión más suave del magenta para rendimiento
        success: '#00cc7a',
        warning: '#cc9400',
        danger: '#cc2449'
    }
};

export const NODE_LABELS = {
    start: 'Inicio',
    end: 'Fin',
    message: 'Mensaje',
    decision: 'Decisión',
    action: 'Acción',
    option: 'Opción',
    HTTP_REQUEST_NODE: 'Solicitud HTTP',
    WEBHOOK_NODE: 'Webhook',
    DATABASE_NODE: 'Base de Datos',
    AI_NODE: 'Inteligencia Artificial',
    NLP_NODE: 'Procesamiento NLP',
    COMPLEX_CONDITION_NODE: 'Condición Compleja',
    POWER_NODE: 'Poder',
    ADVANCED_AI_NODE: 'IA Avanzada',
};

export const NODE_DESCRIPTIONS = {
    start: 'Punto de inicio del flujo.',
    end: 'Punto de fin del flujo.',
    message: 'Envía un mensaje al usuario.',
    decision: 'Evalúa una condición y bifurca el flujo.',
    action: 'Realiza una acción.',
    option: 'Opción de decisión.',
    HTTP_REQUEST_NODE: 'Realiza una solicitud HTTP a un servicio externo.',
    WEBHOOK_NODE: 'Recibe eventos externos a través de un endpoint.',
    DATABASE_NODE: 'Interactúa con una base de datos para guardar o recuperar información.',
    AI_NODE: 'Utiliza inteligencia artificial para generar respuestas o analizar datos.',
    NLP_NODE: 'Procesa lenguaje natural para extraer significado, entidades o intenciones.',
    COMPLEX_CONDITION_NODE: 'Evalúa múltiples condiciones con operaciones lógicas AND/OR/NOT.',
    POWER_NODE: 'Integra tu Plubot con aplicaciones y servicios externos.',
    ADVANCED_AI_NODE: 'Nodo IA configurable con prompts dinámicos, múltiples modelos y parámetros.',
};

// Obtener categorías únicas de los poderes
export const POWER_CATEGORIES = [...new Set(powers.map(power => power.category))].map(category => ({
    id: category,
    name: category.charAt(0).toUpperCase() + category.slice(1),
}));

// Categorías para la paleta de nodos organizada
export const NODE_CATEGORIES = [
    {
        id: 'basic',
        name: 'Básicos',
        description: 'Nodos fundamentales para cualquier flujo de conversación',
        nodes: [
            { type: NODE_TYPES.start, label: NODE_LABELS.start, icon: 'fas fa-play' },
            { type: NODE_TYPES.message, label: NODE_LABELS.message, icon: 'fas fa-comment-alt' },
            { type: NODE_TYPES.decision, label: NODE_LABELS.decision, icon: 'fas fa-code-branch' },
            { type: NODE_TYPES.end, label: NODE_LABELS.end, icon: 'fas fa-stop' },
        ]
    },
    {
        id: 'advanced',
        name: 'Avanzados',
        description: 'Nodos para funcionalidades más sofisticadas',
        nodes: [
            { type: NODE_TYPES.action, label: NODE_LABELS.action, icon: 'fas fa-bolt' },
            { type: NODE_TYPES.option, label: NODE_LABELS.option, icon: 'fas fa-list-ul' },
            { type: NODE_TYPES.COMPLEX_CONDITION_NODE, label: NODE_LABELS.COMPLEX_CONDITION_NODE, icon: 'fas fa-filter' },
        ]
    },
    {
        id: 'integrations',
        name: 'Integraciones',
        description: 'Nodos para conectar con servicios y sistemas externos',
        nodes: [
            { type: NODE_TYPES.HTTP_REQUEST_NODE, label: NODE_LABELS.HTTP_REQUEST_NODE, icon: 'fas fa-globe' },
            { type: NODE_TYPES.WEBHOOK_NODE, label: NODE_LABELS.WEBHOOK_NODE, icon: 'fas fa-link' },
            { type: NODE_TYPES.DATABASE_NODE, label: NODE_LABELS.DATABASE_NODE, icon: 'fas fa-database' },
            { type: NODE_TYPES.POWER_NODE, label: NODE_LABELS.POWER_NODE, icon: 'fas fa-plug' },
        ]
    },
  {
    id: 'ai',
    label: 'Inteligencia Artificial',
    icon: 'fas fa-robot',
    nodes: [
      {
        type: 'ai',
        label: 'IA Genérica',
        icon: 'fas fa-brain',
        description: 'Un nodo de IA configurable para diversas tareas.',
      },
      {
        type: 'emotionDetection',
        label: 'Detección de Emoción',
        icon: 'fas fa-smile-beam',
        description: 'Detecta la emoción predominante en un texto.',
      },
    ],
  },
]; // End of NODE_CATEGORIES.

// Función para obtener los datos iniciales de un nodo
export const getNodeInitialData = (nodeType, nodeLabel, powerItemData = null) => {
    const baseData = {
        label: nodeLabel || 'Nodo Desconocido',
    };

    switch (nodeType) {
        case NODE_TYPES.HTTP_REQUEST_NODE:
            return {
                ...baseData,
                method: 'GET',
                url: '',
                headers: [{ id: uuidv4(), key: '', value: '' }],
                bodyType: 'none', // 'none', 'json', 'text', 'form-data'
                body: '', // Para json & text
                formData: [{ id: uuidv4(), key: '', value: '' }], // Para form-data
                responseMapping: [{ id: uuidv4(), source: 'body_json_path', path: '', variableName: '' }],
                status: { state: 'idle', message: '' }, // 'idle', 'testing', 'success', 'error'
                testResult: null,
                cacheResponse: false,
                retryConfig: { enabled: false, maxRetries: 3, delayMs: 1000 }
            };
        
        case NODE_TYPES.WEBHOOK_NODE:
            return {
                ...baseData,
                endpoint: `/webhook/${uuidv4().slice(0, 8)}`,
                method: 'POST',
                authToken: uuidv4(),
                responseMode: 'async', // 'async' o 'sync'
                timeout: 30000, // ms
                responseMapping: [{ id: uuidv4(), source: 'body_json_path', path: '', variableName: '' }],
                status: { state: 'idle', message: '' }
            };
            
        case NODE_TYPES.ADVANCED_AI_NODE:
            return {
                ...baseData, // Includes label: NODE_LABELS.ADVANCED_AI_NODE
                type: NODE_TYPES.ADVANCED_AI_NODE,
                promptTemplate: 'Escribe tu prompt aquí. Usa {{variable}} para variables dinámicas.',
                temperature: 0.7,
                model: 'gpt-4',
                maxTokens: 512,
                systemMessage: 'Eres un asistente de IA útil y creativo.',
                responseVariable: 'respuestaDelAI',
                streaming: false,
                isLoading: false,
                error: null,
                lastResponse: null,
                interpolatedPromptPreview: '',
                ultraMode: false,
            };

        case NODE_TYPES.DATABASE_NODE:
            return {
                ...baseData,
                operation: 'query', // 'query', 'insert', 'update', 'delete'
                dataSource: 'internal', // 'internal', 'external'
                connectionString: '',
                table: '',
                fields: [{ id: uuidv4(), name: '', value: '', type: 'string' }],
                query: '',
                resultMapping: [{ id: uuidv4(), field: '', variableName: '' }],
                status: { state: 'idle', message: '' }
            };
            
        case NODE_TYPES.AI_NODE:
            return {
                ...baseData,
                aiType: 'text_generation', // 'text_generation', 'image_generation', 'classification'
                prompt: '',
                model: 'general', // 'general', 'customer_support', 'sales', 'technical'
                maxTokens: 150,
                temperature: 0.7,
                resultVariable: 'aiResponse',
                status: { state: 'idle', message: '' }
            };
            
        case NODE_TYPES.NLP_NODE:
            return {
                ...baseData,
                nlpTask: 'sentiment_analysis', // 'sentiment_analysis', 'entity_extraction', 'intent_detection'
                inputVariable: 'userInput',
                confidence: 0.7,
                language: 'es',
                resultMapping: [{ id: uuidv4(), entity: '', variableName: '' }],
                status: { state: 'idle', message: '' }
            };
            
        case NODE_TYPES.COMPLEX_CONDITION_NODE:
            return {
                ...baseData,
                conditions: [
                    { id: uuidv4(), variable: '', operator: 'equals', value: '', connector: 'AND' }
                ],
                outputs: ['Verdadero', 'Falso'],
                defaultPath: 'Falso',
                status: { state: 'idle', message: '' }
            };
            
        case NODE_TYPES.POWER_NODE:
            if (powerItemData && powerItemData.id === 'advancedAiPower') {
                return {
                    label: powerItemData.title || NODE_LABELS.ADVANCED_AI_NODE,
                    type: NODE_TYPES.ADVANCED_AI_NODE, // 'ai'
                    promptTemplate: 'Escribe tu prompt aquí. Usa {{variable}} para variables dinámicas.',
                    temperature: 0.7,
                    model: 'gpt-4',
                    maxTokens: 512,
                    systemMessage: 'Eres un asistente de IA útil y creativo.',
                    responseVariable: 'respuestaDelAI',
                    streaming: false, isLoading: false, error: null, lastResponse: null, interpolatedPromptPreview: '', ultraMode: false,
                    powerId: powerItemData.id
                };
            }
            // Lógica para otros Power Nodes no-AI (que no sean el advancedAiPower)
            return {
                ...baseData, // Esto usará el label del powerItemData si no es nuestro AI Power
                powerId: powerItemData?.id || '',
                inputs: powerItemData?.inputs || [],
                outputs: powerItemData?.outputs || [],
                config: powerItemData?.config || {},
            };    
            
        default:
            return baseData;
    }
};