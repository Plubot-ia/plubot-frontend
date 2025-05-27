import React, { useState, useEffect } from 'react';
import useFlowStore from '@/stores/useFlowStore';

/**
 * Componente de recuperación de emergencia que monitorea la pérdida de nodos
 * y ofrece un botón para recuperarlos si desaparecen
 */
const EmergencyRecovery = () => {
  const [showRecovery, setShowRecovery] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  const [hasBackup, setHasBackup] = useState(false);
  
  // Obtener nodos y función de recuperación
  const nodes = useFlowStore(state => state.nodes);
  const recoverNodesEmergency = useFlowStore(state => state.recoverNodesEmergency);
  const plubotId = useFlowStore(state => state.plubotId); // Get plubotId for backup key
  
  // Verificar si existe un respaldo de emergencia
  useEffect(() => {
    if (!plubotId) return; // Don't check for backup if no plubotId
    try {
      const backup = localStorage.getItem(`plubot-nodes-emergency-backup-${plubotId}`);
      setHasBackup(!!backup);
    } catch (e) {
      console.error('[EmergencyRecovery] Error al verificar respaldo:', e);
    }
  }, [plubotId]);
  
  // Monitorear cambios en los nodos
  useEffect(() => {
    // Si tenemos el conteo anterior y ahora no hay nodos, mostrar recuperación
    if (nodeCount > 0 && (!nodes || nodes.length === 0)) {
      console.log('[EmergencyRecovery] Nodos perdidos detectados, activando recuperación');
      setShowRecovery(true);
    }
    
    // Actualizar conteo de nodos
    setNodeCount(nodes?.length || 0);
  }, [nodes, nodeCount]);
  
  // Función para recuperar nodos
  const handleRecovery = () => {
    try {
      if (recoverNodesEmergency && typeof recoverNodesEmergency === 'function') {
        const success = recoverNodesEmergency();
        if (success) {
          console.log('[EmergencyRecovery] Nodos recuperados con éxito');
          setShowRecovery(false);
        } else {
          console.warn('[EmergencyRecovery] No se pudieron recuperar los nodos');
        }
      }
    } catch (e) {
      console.error('[EmergencyRecovery] Error al recuperar nodos:', e);
    }
  };
  
  // Función para cerrar el mensaje
  const handleClose = () => {
    setShowRecovery(false);
  };

  // Si no hay que mostrar recuperación o no hay respaldo, no renderizar nada
  if (!showRecovery || !hasBackup) {
    return null;
  }
  
  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(10, 20, 40, 0.9)', // Dark blueish tech background
        color: '#00FFFF', // Cyan text
        padding: '15px 25px',
        borderRadius: '10px',
        border: '1px solid #FF00FF', // Magenta border
        boxShadow: '0 0 15px rgba(255, 0, 255, 0.7), 0 0 20px rgba(0, 255, 255, 0.5) inset', // Magenta outer glow, Cyan inner glow
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        fontFamily: '"Orbitron", sans-serif', // Techy font (ensure it's imported or available)
        textAlign: 'center',
      }}
    >
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '8px',
          right: '10px',
          background: 'transparent',
          border: 'none',
          color: '#00FFFF', // Cyan
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: 'pointer',
          padding: '0',
          lineHeight: '1'
        }}
        aria-label="Cerrar"
      >
        &times;
      </button>
      <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>⚠️ ¡Alerta de Fusión de Quanta! ⚠️</div>
      <div>Se detectó una anomalía en la matriz de nodos. ¿Restaurar desde la última singularidad estable?</div>
      <button 
        onClick={handleRecovery}
        style={{
          backgroundColor: '#FF00FF', // Magenta button
          color: 'white',
          border: '1px solid #00FFFF', // Cyan border
          padding: '10px 20px',
          borderRadius: '5px',
          fontWeight: 'bold',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          boxShadow: '0 0 10px #FF00FF',
          transition: 'all 0.3s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px #FF00FF, 0 0 5px #FFFFFF'}
        onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 0 10px #FF00FF'}
      >
        Recuperar Continuidad Nodal
      </button>
    </div>
  );
};

export default EmergencyRecovery;
