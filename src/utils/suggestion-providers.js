// Helper: Sugerencias para nodos de inicio
function _handleStartNodeSuggestions(selectedNode, suggestions) {
  suggestions.push({
    id: 'connect-to-message',
    description: 'Conectar a un nodo de mensaje para definir el flujo inicial',
    action: {
      type: 'ADD_NODE',
      payload: { type: 'message', source: selectedNode.id },
    },
    priority: 2,
  });
}

// Helper: Sugerencias para nodos de mensaje
function _handleMessageNodeSuggestions(selectedNode, nodeCount, suggestions) {
  suggestions.push({
    id: 'add-decision',
    description: 'Añadir un nodo de decisión para ramificar el flujo',
    action: {
      type: 'ADD_NODE',
      payload: { type: 'decision', source: selectedNode.id },
    },
    priority: 2,
  });
  if (nodeCount < 10) {
    suggestions.push({
      id: 'add-action',
      description: 'Añadir un nodo de acción para realizar una tarea',
      action: {
        type: 'ADD_NODE',
        payload: { type: 'action', source: selectedNode.id },
      },
      priority: 1,
    });
  }
}

// Helper: Sugerencias para nodos de decisión
function _handleDecisionNodeSuggestions(selectedNode, suggestions) {
  suggestions.push({
    id: 'add-option',
    description: 'Añadir un nodo de opción para definir una rama',
    action: {
      type: 'ADD_NODE',
      payload: { type: 'option', source: selectedNode.id },
    },
    priority: 2,
  });
}

// Helper: Sugerencias para nodos de opción
function _handleOptionNodeSuggestions(selectedNode, suggestions) {
  suggestions.push({
    id: 'connect-to-action',
    description: 'Conectar a un nodo de acción para continuar el flujo',
    action: {
      type: 'ADD_NODE',
      payload: { type: 'action', source: selectedNode.id },
    },
    priority: 2,
  });
}

// Helper: Sugerencias para nodos de acción
function _handleActionNodeSuggestions(selectedNode, suggestions) {
  suggestions.push({
    id: 'connect-to-end',
    description: 'Conectar a un nodo de fin para completar el flujo',
    action: {
      type: 'ADD_NODE',
      payload: { type: 'end', source: selectedNode.id },
    },
    priority: 2,
  });
}

// Helper: Sugerencias por defecto
function _handleDefaultNodeSuggestions(selectedNode, suggestions) {
  suggestions.push({
    id: 'generic-connect',
    description: 'Conectar a un nuevo nodo para extender el flujo',
    action: {
      type: 'ADD_NODE',
      payload: { type: 'message', source: selectedNode.id },
    },
    priority: 1,
  });
}

export const nodeTypeSuggestionProvider = (context) => {
  const { selectedNode, nodes } = context;
  const suggestions = [];

  if (!selectedNode) {
    suggestions.push({
      id: 'add-start-node',
      description: 'Añadir un nodo de inicio para comenzar el flujo',
      action: { type: 'ADD_NODE', payload: { type: 'start' } },
      priority: 1,
    });
    return suggestions;
  }

  const nodeCount = nodes.length;
  const nodeType = selectedNode.type;

  switch (nodeType) {
    case 'start': {
      _handleStartNodeSuggestions(selectedNode, suggestions);
      break;
    }
    case 'message': {
      _handleMessageNodeSuggestions(selectedNode, nodeCount, suggestions);
      break;
    }
    case 'decision': {
      _handleDecisionNodeSuggestions(selectedNode, suggestions);
      break;
    }
    case 'option': {
      _handleOptionNodeSuggestions(selectedNode, suggestions);
      break;
    }
    case 'action': {
      _handleActionNodeSuggestions(selectedNode, suggestions);
      break;
    }
    default: {
      _handleDefaultNodeSuggestions(selectedNode, suggestions);
    }
  }

  return suggestions;
};

// Registrar el proveedor automáticamente
import { registerSuggestionProvider } from './suggestion-registry';

registerSuggestionProvider(nodeTypeSuggestionProvider);
