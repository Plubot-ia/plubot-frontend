import React, { useState, useEffect } from 'react';
import './EpicHeader.css';
import { Save, Share2, Monitor, LayoutTemplate, MoreHorizontal } from 'lucide-react';

// Importar fuente Orbitron para el estilo cyberpunk
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/700.css';

const EpicHeader = ({ 
  flowName = 'Flujo sin título', 
  nodeCount = 0, 
  edgeCount = 0,
  lastSaved = null,
  onSave,
  onShare,
  onSimulate,
  onShowTemplates,
  onSettings,
  logoSrc = '/logo.png'
}) => {
  // Eliminamos las partículas para mejorar el rendimiento
  const [time, setTime] = useState(new Date());
  
  // Actualizar el reloj cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Formatear la fecha de última guardado
  const formatLastSaved = () => {
    if (!lastSaved) return 'Nunca';
    
    const now = new Date();
    const saved = new Date(lastSaved);
    const diffMinutes = Math.floor((now - saved) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    
    const hours = saved.getHours().toString().padStart(2, '0');
    const minutes = saved.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Formatear la hora actual
  const formatTime = () => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <header className="epic-header">
      {/* Partículas y efectos de fondo eliminados para mejorar el rendimiento */}
      
      {/* Contenido del encabezado */}
      <div className="epic-header-left">
        <img 
          src={logoSrc} 
          alt="Plubot Logo" 
          className="epic-header-logo"
          loading="eager" // Carga prioritaria
          draggable="false" // Evita arrastrar accidentalmente
        />
        <div>
          <h1 className="epic-header-title">{flowName}</h1>
          <p className="epic-header-subtitle">Diseñador de Flujos Avanzado</p>
        </div>
      </div>
      
      <div className="epic-header-right">
        <div className="epic-header-stats">
          <div className="epic-stat">
            <span className="epic-stat-value">{nodeCount}</span>
            <span className="epic-stat-label">Nodos</span>
          </div>
          
          <div className="epic-stat">
            <span className="epic-stat-value">{edgeCount}</span>
            <span className="epic-stat-label">Conexiones</span>
          </div>
          
          <div className="epic-header-divider"></div>
          
          <div className="epic-stat">
            <span className="epic-stat-value">{formatLastSaved()}</span>
            <span className="epic-stat-label">Guardado</span>
          </div>
          
          <div className="epic-stat">
            <span className="epic-stat-value">{formatTime()}</span>
            <span className="epic-stat-label">Hora</span>
          </div>
        </div>
        
        <div className="epic-header-actions">
          <button 
            className="epic-header-button" 
            onClick={onSave}
            title="Guardar flujo"
          >
            <Save size={16} className="epic-header-button-icon" />
            <span>Guardar</span>
          </button>
          
          <button 
            className="epic-header-button"
            onClick={onShare}
            title="Compartir flujo"
          >
            <Share2 size={16} className="epic-header-button-icon" />
            <span>Compartir</span>
          </button>
          
          <button 
            className="epic-header-button"
            onClick={onSimulate}
            title="Simular flujo"
          >
            <Monitor size={16} className="epic-header-button-icon" />
            <span>Simular</span>
          </button>
          
          <button 
            className="epic-header-button"
            onClick={onShowTemplates}
            title="Mostrar plantillas"
          >
            <LayoutTemplate size={16} className="epic-header-button-icon" />
            <span>Plantillas</span>
          </button>
          
          <button 
            className="epic-header-button"
            onClick={onSettings}
            title="Más opciones"
          >
            <MoreHorizontal size={16} className="epic-header-button-icon" />
            <span>Opciones</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default EpicHeader;
