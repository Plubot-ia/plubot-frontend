import React from 'react';

/**
 * Componente modal para editar un plubot
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.plubot - Datos del plubot a editar
 * @param {Function} props.setEditModalPlubot - Función para cerrar el modal
 * @param {Function} props.handleEditFlows - Función para editar los flujos del plubot
 * @param {Function} props.showNotification - Función para mostrar notificaciones
 * @param {Function} props.navigate - Función de navegación
 */
const EditPlubotModal = ({ 
  plubot, 
  setEditModalPlubot, 
  handleEditFlows, 
  showNotification, 
  navigate 
}) => {
  const handleEditIdentity = () => {
    if (!plubot.id) {
      console.error('[EditPlubotModal] Error: plubotId no válido en Editar Identidad:', plubot.id);
      showNotification('Error: ID del Plubot no válido', 'error');
      return;
    }
    console.log('[EditPlubotModal] Navegando a editar identidad para plubotId:', plubot.id);
    setEditModalPlubot(null);
    navigate(`/plubot/edit/personalization?plubotId=${plubot.id}`);
  };

  return (
    <div className="modal-overlay modal-overlay-immediate" onClick={() => setEditModalPlubot(null)}>
      <div
        className="edit-modal-content-styles"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-styles"
          onClick={() => setEditModalPlubot(null)}
        >
          ✖
        </button>
        <h3 className="edit-modal-title-styles">
          Personalizar {plubot.name || 'Plubot'}
        </h3>
        <p className="edit-modal-paragraph">
          Selecciona una opción para modificar las características de tu Plubot.
        </p>
        <div className="edit-modal-buttons-container">
          <button
            className="edit-modal-identity-button"
            onClick={handleEditIdentity}
          >
            <span className="edit-modal-icon">🎨</span> Editar Identidad
          </button>
          <button
            className="edit-modal-flows-button"
            onClick={() => {
              if (!plubot.id) {
                console.error('[EditPlubotModal] Error: plubotId no válido en Editar Flujos:', plubot);
                showNotification('Error: ID del Plubot no válido. Por favor, crea un nuevo plubot.', 'error');
                setEditModalPlubot(null);
                return;
              }
              console.log('[EditPlubotModal] Navegando a editar flujos para plubotId:', plubot.id);
              handleEditFlows(plubot.id);
            }}
          >
            <span className="edit-modal-icon">🔄</span> Editar Flujos
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPlubotModal;
