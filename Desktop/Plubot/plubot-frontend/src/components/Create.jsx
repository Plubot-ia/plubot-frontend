import { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import ChatbotList from './ChatbotList';
import ChatInterface from './ChatInterface';
import DeleteModal from './DeleteModal';
import StepWizard from './steps/StepWizard';
import useAPI from '../hooks/useAPI';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Create = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [chatbots, setChatbots] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [quota, setQuota] = useState({ messages_used: 0, messages_limit: 100, plan: 'free' });
    const [selectedChatbot, setSelectedChatbot] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [chatbotToDelete, setChatbotToDelete] = useState(null);
    const [editingBot, setEditingBot] = useState(null);
    const [step, setStep] = useState(1);
    const { fetchChatbots, fetchTemplates, fetchQuota, deleteBot } = useAPI();
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('http://localhost:5000/login', {
                    method: 'GET',
                    credentials: 'include',
                });
                const data = await response.json();
                if (data.status === 'success') {
                    setIsAuthenticated(true);
                    loadInitialData();
                } else {
                    throw new Error('No autorizado');
                }
            } catch (error) {
                console.error('Error en verificación de autenticación:', error);
                setIsAuthenticated(false);
                toast.error('No estás autenticado. Redirigiendo al login...');
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        checkAuth();
    }, [navigate]);

    const loadInitialData = async () => {
        console.log("Cargando datos iniciales...");
        try {
            setIsLoading(true);
            const [botsData, templatesData, quotaData] = await Promise.all([
                fetchChatbots(),
                fetchTemplates(),
                fetchQuota(),
            ]);

            setChatbots(botsData.chatbots || []);
            setTemplates(templatesData.templates || []);
            setQuota(quotaData || { messages_used: 0, messages_limit: 100, plan: 'free' });
        } catch (error) {
            console.error('Error al cargar datos iniciales:', error);
            toast.error(`Error al cargar datos iniciales: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChat = async (chatbot) => {
        setSelectedChatbot(chatbot);
        setMessages([{ role: 'bot', content: chatbot.initial_message || 'Hola, ¿en qué puedo ayudarte?' }]);
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/chat/${chatbot.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message: 'Hola', user_phone: 'test_user' }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessages((prev) => [...prev, { role: 'bot', content: data.response }]);
                const updatedQuota = await fetchQuota();
                setQuota(updatedQuota);
            } else {
                toast.error(data.message || 'Error al iniciar el chat');
            }
        } catch (error) {
            toast.error(`Error al iniciar el chat: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (bot) => {
        setEditingBot(bot);
        setStep(1);
    };

    const handleDelete = async () => {
        if (!chatbotToDelete) return;
        setIsLoading(true);
        try {
            await deleteBot(chatbotToDelete.id);
            setChatbots((await fetchChatbots()).chatbots || []);
            toast.success('Chatbot eliminado con éxito');
            const updatedQuota = await fetchQuota();
            setQuota(updatedQuota);
            if (selectedChatbot?.id === chatbotToDelete.id) {
                setSelectedChatbot(null);
                setMessages([]);
            }
        } catch (error) {
            toast.error(`Error al eliminar: ${error.message}`);
        } finally {
            setIsLoading(false);
            setShowDeleteModal(false);
            setChatbotToDelete(null);
        }
    };

    const handleWizardSuccess = async () => {
        setChatbots((await fetchChatbots()).chatbots || []);
        toast.success('Chatbot guardado con éxito');
        setEditingBot(null);
        setStep(1);
        const updatedQuota = await fetchQuota();
        setQuota(updatedQuota);
    };

    if (isAuthenticated === null) {
        return <div className="text-white text-center p-4">Verificando autenticación...</div>;
    }

    if (!isAuthenticated) {
        return null; // La redirección se maneja en useEffect
    }

    if (quota.messages_used >= quota.messages_limit) {
        return (
            <div className="text-white text-center p-4">
                <h2 className="text-2xl mb-4">Límite de Mensajes Alcanzado</h2>
                <p>Has usado {quota.messages_used}/{quota.messages_limit} mensajes este mes.</p>
                <p>
                    Actualiza tu plan para continuar.{' '}
                    <a href="/pricing" className="text-blue-500 underline">Suscríbete aquí</a>.
                </p>
            </div>
        );
    }

    return (
        <ReactFlowProvider>
            <section className="chatbot-section">
                <div className="chatbot-container grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="chatbot-text-column">
                        <h1 className="chatbot-title text-4xl md:text-5xl mb-6">Crea tu Plubot</h1>
                        <div className="bot-config p-6 bg-gray-900 rounded-lg">
                            <h2 className="text-2xl mb-4 text-white">Configura tu Chatbot</h2>
                            <div className="quota-info mb-4 text-gray-300">
                                <p>Mensajes usados: {quota.messages_used}/{quota.messages_limit}</p>
                                {quota.messages_used >= 75 && quota.messages_used < quota.messages_limit && (
                                    <p className="text-yellow-500">
                                        ¡Cerca del límite! Suscríbete{' '}
                                        <a href="/pricing" className="text-blue-500">
                                            aquí
                                        </a>
                                        .
                                    </p>
                                )}
                            </div>
                            <StepWizard
                                templates={templates}
                                editingBot={editingBot}
                                setEditingBot={setEditingBot}
                                onSuccess={handleWizardSuccess}
                            />
                            {responseMessage && (
                                <div
                                    className="response-message mt-4 text-white"
                                    dangerouslySetInnerHTML={{ __html: responseMessage }}
                                />
                            )}
                        </div>
                        <ChatbotList
                            chatbots={chatbots}
                            isLoading={isLoading}
                            onChat={handleChat}
                            onEdit={handleEdit}
                            onDelete={(bot) => {
                                setChatbotToDelete(bot);
                                setShowDeleteModal(true);
                            }}
                        />
                    </div>
                    {selectedChatbot && (
                        <ChatInterface
                            chatbot={selectedChatbot}
                            messages={messages}
                            setMessages={setMessages}
                            isLoading={isLoading}
                            setIsLoading={setIsLoading}
                            onQuotaUpdate={setQuota}
                        />
                    )}
                </div>
                <DeleteModal
                    show={showDeleteModal}
                    chatbot={chatbotToDelete}
                    isLoading={isLoading}
                    onCancel={() => setShowDeleteModal(false)}
                    onConfirm={handleDelete}
                />
            </section>
        </ReactFlowProvider>
    );
};

export default Create;