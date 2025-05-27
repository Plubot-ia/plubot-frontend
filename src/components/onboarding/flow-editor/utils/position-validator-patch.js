/**
 * position-validator-patch.js
 * 
 * Parche para aplicar automáticamente la validación de posiciones
 * de nodos y sanitización de paths de aristas sin modificar FlowMain.jsx
 */

import { sanitizeEdgePaths, validateNodePositions } from './node-position-validator';
import useFlowStore from '@/stores/useFlowStore';

// Variable global para evitar duplicación de logs
let isPatchApplied = false;

/**
 * Aplica el parche automáticamente al cargarse este módulo
 * No necesita ser importado específicamente
 */
const applyPositionValidatorPatch = () => {
  if (isPatchApplied) return;
  console.log('[position-validator-patch] Aplicando parche de validación de posiciones...');
  
  // Sobrescribir selectivamente métodos de FlowStore para validar posiciones
  const originalSetReactFlowInstance = useFlowStore.getState().setReactFlowInstance;
  
  // Parchar setReactFlowInstance para validar posiciones al inicializar ReactFlow
  useFlowStore.setState({
    setReactFlowInstance: (instance) => {
      // Llamar a la función original primero
      originalSetReactFlowInstance(instance);
      
      // Validar posiciones de todos los nodos existentes
      const currentNodes = useFlowStore.getState().nodes;
      if (currentNodes && currentNodes.length > 0) {
        console.log('[position-validator-patch] Validando posiciones de nodos en inicialización...');
        const validatedNodes = validateNodePositions(currentNodes);
        if (JSON.stringify(validatedNodes) !== JSON.stringify(currentNodes)) {
          console.log('[position-validator-patch] Corrigiendo posiciones inválidas en', 
            validatedNodes.length - currentNodes.length, 'nodos');
          useFlowStore.getState().setNodes(validatedNodes);
        }
      }
      
      // Configurar un intervalo para sanitizar paths de aristas periódicamente
      // pero SOLO cuando no hay un arrastre en progreso
      const sanitizeInterval = setInterval(() => {
        // Verificar si hay un arrastre en progreso antes de validar
        if (!window.__dragInProgress) {
          sanitizeEdgePaths();
        }
      }, 2000); // Reducir frecuencia a cada 2 segundos para mejorar rendimiento
      
      // Almacenar el intervalo para poder limpiarlo después si es necesario
      window.__positionValidatorInterval = sanitizeInterval;
      
      // Configurar un observador para cambios en el DOM que podrían afectar aristas
      // pero evitando validaciones durante el arrastre para maximizar rendimiento
      const observer = new MutationObserver(() => {
        // Solo ejecutar si NO hay un arrastre en progreso
        if (!window.__dragInProgress) {
          sanitizeEdgePaths();
        }
      });
      
      // Observar cambios en el elemento react-flow si existe
      const reactFlowElement = document.querySelector('.react-flow');
      if (reactFlowElement) {
        observer.observe(reactFlowElement, { 
          childList: true, 
          subtree: true 
        });
        
        // Almacenar el observador para poder desconectarlo si es necesario
        window.__positionValidatorObserver = observer;
      }
    }
  });
  
  // Registrar limpieza al cerrar/recargar la página
  window.addEventListener('beforeunload', () => {
    if (window.__positionValidatorInterval) {
      clearInterval(window.__positionValidatorInterval);
    }
    if (window.__positionValidatorObserver) {
      window.__positionValidatorObserver.disconnect();
    }
  });
  
  isPatchApplied = true;
  console.log('[position-validator-patch] Parche aplicado con éxito');
};

// Aplicar el parche inmediatamente
applyPositionValidatorPatch();

// Exportar una función para aplicar el parche manualmente si es necesario
export const forceApplyPatch = () => {
  isPatchApplied = false;
  applyPositionValidatorPatch();
};

export default {
  forceApplyPatch
};
