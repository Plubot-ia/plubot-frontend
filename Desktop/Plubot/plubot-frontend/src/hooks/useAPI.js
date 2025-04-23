const useAPI = () => {
    // Función de reintentos
    const withRetry = async (fn, retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn(); // Intenta ejecutar la función
            } catch (error) {
                if (i === retries - 1) throw error; // Si ya es el último intento, lanza el error
                await new Promise((resolve) => setTimeout(resolve, delay)); // Espera antes de reintentar
            }
        }
    };

    // Función para manejar respuestas y redirecciones
    const handleResponse = (response) => {
        if (response.status === 401 || response.status === 302 || response.redirected) {
            // Si no estamos autenticados o redirigidos, redirigir al login
            window.location.href = 'http://localhost:5173/login';
            throw new Error('No autorizado o redirigiendo al login...');
        }
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    };

    // Función para obtener los chatbots
    const fetchChatbots = async () => {
        const response = await withRetry(() =>
            fetch('http://localhost:5000/list-bots', {
                method: 'GET',
                credentials: 'include',
            })
        );
        return handleResponse(response);
    };

    // Función para obtener las plantillas
    const fetchTemplates = async () => {
        const response = await withRetry(() =>
            fetch('http://localhost:5000/api/templates', {
                method: 'GET',
                credentials: 'include',
            })
        );
        return handleResponse(response);
    };

    // Función para obtener la cuota
    const fetchQuota = async () => {
        const response = await withRetry(() =>
            fetch('http://localhost:5000/api/quota', {
                method: 'GET',
                credentials: 'include',
            })
        );
        return handleResponse(response);
    };

    // Función para eliminar un chatbot
    const deleteBot = async (chatbotId) => {
        const response = await withRetry(() =>
            fetch(`http://localhost:5000/delete-bot/${chatbotId}`, {
                method: 'DELETE',
                credentials: 'include',
            })
        );
        return handleResponse(response);
    };

    return { fetchChatbots, fetchTemplates, fetchQuota, deleteBot };
};

export default useAPI;
