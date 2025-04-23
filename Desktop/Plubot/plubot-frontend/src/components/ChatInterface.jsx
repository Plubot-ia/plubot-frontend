// src/components/ChatInterface.jsx
import { useState } from 'react';
import useAPI from '../hooks/useAPI'; // Actualizado a importación por defecto
import Tilt from 'react-tilt'; // Importamos Tilt

const ChatInterface = ({ chatbot, messages, setMessages, isLoading, setIsLoading, onQuotaUpdate }) => {
    const [inputMessage, setInputMessage] = useState('');
    const { sendChatMessage, fetchQuota } = useAPI();

    const sendMessage = async () => {
        if (!inputMessage) return;
        const newMessage = { role: 'user', content: inputMessage };
        setMessages((prev) => [...prev, newMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const data = await sendChatMessage(chatbot.id, {
                message: inputMessage,
                user_phone: 'test_user',
            });
            setMessages((prev) => [...prev, { role: 'bot', content: data.response }]);
            const quotaData = await fetchQuota();
            onQuotaUpdate(quotaData);
        } catch (error) {
            setMessages((prev) => [...prev, { role: 'bot', content: `Error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chatbot-mobile-column">
            <div className="large-mobile-frame">
                {/* Aquí aplicamos el Tilt */}
                <Tilt options={{ max: 15, scale: 1.02, speed: 300 }}>
                    <div className="mobile-device">
                        <div className="mobile-notch"></div>
                        <div className="mobile-screen">
                            <div className="chatbot-widget">
                                <div className="whatsapp-header flex justify-between p-2 bg-green-600 text-white">
                                    <div className="whatsapp-contact flex items-center">
                                        <div className="whatsapp-avatar mr-2">
                                            <i className="fas fa-robot"></i>
                                        </div>
                                        <div className="whatsapp-info">
                                            <span className="whatsapp-name">{chatbot.name}</span>
                                            <span className="whatsapp-number block text-sm">
                                                {chatbot.whatsapp_number || 'Plubot'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="whatsapp-actions flex gap-2">
                                        <i className="fas fa-phone"></i>
                                        <i className="fas fa-video"></i>
                                        <i className="fas fa-ellipsis-v"></i>
                                    </div>
                                </div>
                                <div className="whatsapp-body p-4 h-96 overflow-y-auto bg-gray-100">
                                    {messages.map((msg, i) => (
                                        <div
                                            key={i}
                                            className={`chatbot-message ${msg.role} mb-3 ${
                                                msg.role === 'user' ? 'text-right' : 'text-left'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block p-2 rounded ${
                                                    msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300'
                                                }`}
                                            >
                                                {msg.content}
                                            </span>
                                            <div className="message-meta text-xs text-gray-500 mt-1">
                                                <span>
                                                    {new Date().toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                                {msg.role === 'user' && (
                                                    <span className="ml-1">
                                                        <i className="fas fa-check-double"></i>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="loading-indicator text-center text-gray-500">
                                            Cargando...
                                        </div>
                                    )}
                                </div>
                                <div className="whatsapp-input flex p-2 bg-white">
                                    <div className="input-wrapper flex-1 flex items-center">
                                        <i className="fas fa-smile input-icon mr-2 text-gray-500"></i>
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder="Escribe un mensaje..."
                                            className="flex-1 border-none outline-none"
                                            disabled={isLoading}
                                        />
                                        <i className="fas fa-paperclip input-icon ml-2 text-gray-500"></i>
                                    </div>
                                    <button onClick={sendMessage} disabled={isLoading} className="ml-2 text-blue-500">
                                        <i className="fas fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tilt>
            </div>
        </div>
    );
};

export default ChatInterface;
