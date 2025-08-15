/**
 * reset-node-types.js
 *
 * Utilidad para reiniciar y revalidar los tipos de nodos en ReactFlow
 * Esta es una solución definitiva para problemas de renderizado de nodos
 */

// Función para verificar y reparar los tipos de nodos en el estado de ReactFlow
export const resetAndVerifyNodeTypes = (reactFlowInstance, nodeTypes) => {
  if (!reactFlowInstance || !nodeTypes) {
    return;
  }

  try {
    // 1. Obtener todos los nodos actuales
    const currentNodes = reactFlowInstance.getNodes();

    if (!currentNodes || currentNodes.length === 0) {
      return;
    }

    // 2. Verificar que cada nodo tenga un tipo válido
    const validNodeTypes = Object.keys(nodeTypes);
    let needsUpdate = false;

    // Crear una copia para modificar
    const updatedNodes = currentNodes.map((node) => {
      // Verificar si el tipo es válido
      if (!validNodeTypes.includes(node.type)) {
        // Intentar determinar el tipo correcto basado en el ID
        let correctedType = 'message'; // Tipo por defecto

        if (node.id.startsWith('start-')) correctedType = 'start';
        else if (node.id.startsWith('end-')) correctedType = 'end';
        else if (node.id.startsWith('decision-')) correctedType = 'decision';
        else if (node.id.startsWith('action-')) correctedType = 'action';
        else if (node.id.startsWith('option-')) correctedType = 'option';

        // Crear un nodo actualizado con el tipo corregido
        needsUpdate = true;
        return {
          ...node,
          type: correctedType,
          // Asegurar visibilidad
          hidden: false,
          style: {
            ...node.style,
            visibility: 'visible',
            display: 'block',
            opacity: 1,
          },
        };
      }

      // Si el tipo ya es válido, solo asegurar visibilidad
      return {
        ...node,
        hidden: false,
        style: {
          ...node.style,
          visibility: 'visible',
          display: 'block',
          opacity: 1,
        },
      };
    });

    // 3. Actualizar los nodos si fue necesario
    if (needsUpdate) {
      reactFlowInstance.setNodes(updatedNodes);
    } else {
      // Opcional: manejar el caso donde no hay cambios
    }

    // 4. Forzar actualización de la vista
    setTimeout(() => {
      // Forzar actualización visual
      try {
        reactFlowInstance.fitView({ padding: 0.2 });
        setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 500);
      } catch {
        // Manejar el error de actualización de vista si es necesario
      }
    }, 200);
  } catch {
    // Manejar el error de verificación de tipos de nodos si es necesario
  }
};

export default resetAndVerifyNodeTypes;
