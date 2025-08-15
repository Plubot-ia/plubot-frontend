export const fetchByteResponse = async (userMessage, messages) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
  const response = await fetch(`${API_BASE_URL}/byte-embajador`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: userMessage,
      context:
        'Providing information about Plubot, its features, and how to create digital assistants.',
      history: messages.slice(-10),
    }),
  });

  if (!response.ok) {
    throw new Error(`Error communicating with Byte Embajador: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
