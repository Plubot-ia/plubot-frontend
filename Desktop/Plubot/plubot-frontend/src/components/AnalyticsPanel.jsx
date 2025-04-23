// src/components/AnalyticsPanel.jsx
import { useState, useEffect } from 'react';

const AnalyticsPanel = ({ chatbotId }) => {
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch(`/analytics/${chatbotId}`, { credentials: 'include' });
                const data = await res.json();
                if (res.ok) {
                    setAnalytics(data);
                }
            } catch (error) {
                console.error('Error al cargar analíticas:', error);
            }
        };
        if (chatbotId) fetchAnalytics();
    }, [chatbotId]);

    if (!analytics) return null;

    return (
        <div className="analytics-panel mt-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Estadísticas del Chatbot</h3>
            <p className="text-gray-300">Total de conversaciones: {analytics.total_conversations}</p>
            <p className="text-gray-300">Mensajes más comunes:</p>
            <ul className="text-gray-400">
                {analytics.common_messages.map(([msg, count], i) => (
                    <li key={i}>
                        {msg}: {count} veces
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AnalyticsPanel;