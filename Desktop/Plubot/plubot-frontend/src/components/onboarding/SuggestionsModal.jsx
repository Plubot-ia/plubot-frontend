import React from 'react';
import './SuggestionsModal.css';

const SuggestionsModal = ({ suggestions, onApplySuggestion, onClose }) => {
  return (
    <div className="ts-suggestions-modal-overlay">
      <div className="ts-suggestions-modal">
        <div className="ts-suggestions-modal-header">
          <h3>Sugerencias para tu Flujo</h3>
          <button className="ts-close-button" onClick={onClose} title="Cerrar modal">
            ✕
          </button>
        </div>
        <div className="ts-suggestions-modal-content">
          {suggestions.length === 0 ? (
            <p>No hay sugerencias disponibles.</p>
          ) : (
            suggestions.map((suggestion, index) => (
              <div key={index} className="ts-suggestion-item">
                <p>{suggestion.description}</p>
                <button
                  onClick={() => onApplySuggestion(suggestion.action)}
                  className="ts-apply-suggestion-btn"
                >
                  Aplicar
                </button>
              </div>
            ))
          )}
        </div>
        <div className="ts-suggestions-modal-footer">
          <button onClick={onClose} className="ts-close-modal-btn">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionsModal;