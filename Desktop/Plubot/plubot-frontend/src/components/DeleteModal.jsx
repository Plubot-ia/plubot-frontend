// src/components/DeleteModal.jsx
const DeleteModal = ({ show, chatbot, isLoading, onCancel, onConfirm }) => {
    if (!show || !chatbot) return null;

    return (
        <div className={`modal ${show ? '' : 'hidden'}`}>
            <div className="modal-content bg-gray-900 text-white p-6 rounded-lg">
                <h2 className="text-xl mb-4">Confirmar Eliminación</h2>
                <p>¿Seguro que deseas eliminar "{chatbot.name}"? Esta acción es irreversible.</p>
                <div className="modal-actions flex gap-4 mt-4">
                    <button
                        className="confirm-btn bg-red-500 text-white p-2 rounded"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
                    </button>
                    <button
                        className="cancel-btn bg-gray-700 p-2 rounded"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;