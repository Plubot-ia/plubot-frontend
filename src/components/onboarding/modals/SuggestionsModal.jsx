import PropTypes from 'prop-types';

import './SuggestionsModal.css';
// Importar el contexto global
import useModalContext from '../../../hooks/useModalContext';

const SuggestionsModal = ({ suggestions, onApplySuggestion, onClose }) => {
  // Usar el contexto global
  const { closeModal } = useModalContext();

  // Función para cerrar el modal utilizando el contexto global o la prop onClose
  const handleClose = () => {
    if (closeModal) {
      closeModal('suggestionsModal');
    } else if (typeof onClose === 'function') {
      onClose();
    }
  };
  return (
    <div className='ts-suggestions-modal-overlay'>
      <div className='ts-suggestions-modal'>
        <div className='ts-suggestions-modal-header'>
          <h3>Sugerencias para tu Flujo</h3>
          <button className='ts-close-button' onClick={handleClose} title='Cerrar modal'>
            ✕
          </button>
        </div>
        <div className='ts-suggestions-modal-content'>
          {suggestions.length === 0 ? (
            <p>No hay sugerencias disponibles.</p>
          ) : (
            suggestions.map((suggestion, _index) => (
              <div key={suggestion.description} className='ts-suggestion-item'>
                <p>{suggestion.description}</p>
                <button
                  onClick={() => onApplySuggestion(suggestion.action)}
                  className='ts-apply-suggestion-btn'
                >
                  Aplicar
                </button>
              </div>
            ))
          )}
        </div>
        <div className='ts-suggestions-modal-footer'>
          <button onClick={handleClose} className='ts-close-modal-btn'>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

SuggestionsModal.propTypes = {
  suggestions: PropTypes.arrayOf(
    PropTypes.shape({
      description: PropTypes.string.isRequired,
      action: PropTypes.object.isRequired,
    }),
  ).isRequired,
  onApplySuggestion: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SuggestionsModal;
