import { useState } from 'react';
import useAPI from '../hooks/useAPI';

const PreviewChat = ({ nodes, edges, tone, purpose, businessInfo }) => {
    const [previewMessages, setPreviewMessages] = useState([]);
    const [previewInput, setPreviewInput] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const { createBot, deleteBot } = useAPI();

    const simulateChat = async () => {
        if (!previewInput) return;
        setPreviewMessages((prev) => [...prev, { role: 'user', content: previewInput }]);
        setIsPreviewLoading(true);

        const flowData = nodes.map((node) => ({
            userMessage: node.data.userMessage,
            botResponse: node.data.botResponse,
            condition: node.data.condition,
            actions: node.data.action?.type !== 'none' ? [node.data.action] : [],
        }));
        const tempBotData = {
            name: 'PreviewBot',
            tone,
            purpose,
            flows: flowData,
            business_info: businessInfo,
        };

        try {
            const createData = await createBot(tempBotData);
            const chatbotId = createData.chatbot_id || (createData.message.match(/ID: (\d+)/) || [])[1];
            if (!chatbotId) throw new Error('No se pudo obtener el ID del chatbot temporal');

            const chatRes = await fetch(`/chat/${chatbotId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message: previewInput, user_phone: 'test_user' }),
            });
            const chatData = await chatRes.json();
            if (chatRes.ok) {
                setPreviewMessages((prev) => [...prev, { role: 'bot', content: chatData.response }]);
            } else {
                throw new Error(chatData.message || 'Error al enviar mensaje');
            }

            await deleteBot(chatbotId);
        } catch (error) {
            setPreviewMessages((prev) => [...prev, { role: 'bot', content: `Error: ${error.message}` }]);
        } finally {
            setIsPreviewLoading(false);
            setPreviewInput('');
        }
    };

    return (
        <div className="preview-chat mt-4">
            <h3 className="text-lg font-semibold text-white mb-2">Vista Previa del Chat</h3>
            <div className="large-mobile-frame">
                <div className="mobile-device bg-black rounded-xl shadow-lg overflow-hidden mx-auto w-[320px]">
                    <div className="mobile-notch h-6 bg-black w-full"></div>
                    <div className="mobile-screen flex flex-col h-[560px] bg-white">
                        {/* Header estilo WhatsApp */}
                        <div className="whatsapp-header flex items-center gap-2 px-3 py-2 bg-green-600 text-white">
                            <div className="whatsapp-avatar w-8 h-8 bg-white text-green-600 rounded-full flex items-center justify-center">
                                <i className="fas fa-robot"></i>
                            </div>
                            <div>
                                <div className="font-semibold text-sm">Vista Previa</div>
                                <div className="text-xs">Plubot</div>
                            </div>
                        </div>

                        {/* Cuerpo del chat */}
                        <div className="whatsapp-body flex-1 px-3 py-2 overflow-y-auto bg-gray-100">
                            {previewMessages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] p-2 rounded-xl text-sm ${msg.role === 'user'
                                        ? 'bg-blue-500 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none shadow'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isPreviewLoading && (
                                <div className="text-center text-gray-500 text-sm">Cargando...</div>
                            )}
                        </div>

                        {/* Input estilo WhatsApp */}
                        <div className="whatsapp-input px-3 py-2 bg-white flex items-center border-t border-gray-200">
                            <input
                                type="text"
                                value={previewInput}
                                onChange={(e) => setPreviewInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && simulateChat()}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 text-sm outline-none"
                                disabled={isPreviewLoading}
                            />
                            <button onClick={simulateChat} disabled={isPreviewLoading} className="ml-3">
                                <i className="fas fa-paper-plane text-blue-500 text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewChat;
