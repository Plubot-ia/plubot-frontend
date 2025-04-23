// src/components/ChatbotList.jsx
import React from 'react';
import useAPI from '../hooks/useAPI'; // Actualizado a importación por defecto
import AnalyticsPanel from './AnalyticsPanel';

const ChatbotList = ({ chatbots, isLoading, onChat, onEdit, onDelete }) => {
    const { connectWhatsapp } = useAPI();

    const handleConnectWhatsapp = async (bot) => {
        try {
            const data = await connectWhatsapp({
                chatbot_id: bot.id,
                phone_number: bot.whatsapp_number,
            });
            alert(data.message);
        } catch (error) {
            alert(`Error al conectar WhatsApp: ${error.message}`);
        }
    };

    return (
        <div className="chatbot-list mt-8">
            <h2 className="text-xl font-semibold mb-6 text-white">Tus Chatbots</h2>
            {chatbots.length > 0 ? (
                chatbots.map((bot) => (
                    <div
                        className="chatbot-item p-4 mb-4 bg-gray-800 rounded"
                        key={bot.id}
                        role="region"
                        aria-labelledby={`chatbot-${bot.id}`}
                    >
                        <div
                            className="chatbot-item-details text-base text-white"
                            id={`chatbot-${bot.id}`}
                        >
                            <strong>{bot.name}</strong> - {bot.purpose} (Tono: {bot.tone})
                            {bot.whatsapp_number && ` | WhatsApp: ${bot.whatsapp_number}`}
                        </div>
                        <AnalyticsPanel chatbotId={bot.id} />
                        <div className="chatbot-item-buttons mt-2 flex gap-2 flex-wrap">
                            <button
                                className="quantum-btn magenta"
                                onClick={() => onChat(bot)}
                                disabled={isLoading}
                                aria-label={`Chatear con ${bot.name}`}
                                aria-disabled={isLoading}
                                style={{
                                    backgroundColor: isLoading ? '#cccccc' : '#8a2be2', // Aseguramos un buen contraste
                                    color: '#fff',
                                }}
                            >
                                {isLoading ? 'Cargando...' : 'Chatear'}
                            </button>
                            {bot.whatsapp_number && (
                                <button
                                    className="quantum-btn whatsapp-btn"
                                    onClick={() => handleConnectWhatsapp(bot)}
                                    disabled={isLoading}
                                    aria-label={`Conectar WhatsApp con ${bot.name}`}
                                    aria-disabled={isLoading}
                                    style={{
                                        backgroundColor: isLoading ? '#cccccc' : '#25d366', // Aseguramos un buen contraste
                                        color: '#fff',
                                    }}
                                >
                                    {isLoading ? 'Conectando...' : 'Conectar WhatsApp'}
                                </button>
                            )}
                            <button
                                className="quantum-btn"
                                onClick={() => onEdit(bot)}
                                disabled={isLoading}
                                aria-label={`Editar chatbot ${bot.name}`}
                                aria-disabled={isLoading}
                                style={{
                                    backgroundColor: isLoading ? '#cccccc' : '#4caf50', // Buen contraste
                                    color: '#fff',
                                }}
                            >
                                Editar
                            </button>
                            <button
                                className="quantum-btn delete-btn"
                                onClick={() => onDelete(bot)}
                                disabled={isLoading}
                                aria-label={`Eliminar chatbot ${bot.name}`}
                                aria-disabled={isLoading}
                                style={{
                                    backgroundColor: isLoading ? '#cccccc' : '#f44336', // Buen contraste
                                    color: '#fff',
                                }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-gray-400" aria-live="polite">
                    No hay chatbots disponibles.
                </p>
            )}
        </div>
    );
};

export default ChatbotList;
