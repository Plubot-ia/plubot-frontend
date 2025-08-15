import instance from '../../../utils/axios-config';

const handleApiError = (error) => {
  if (error.response) {
    if (error.response.status === 404) {
      return 'El chatbot que buscas no existe o ha sido movido.';
    }
    if (error.response.status >= 500) {
      return 'Estamos experimentando problemas en el servidor. Intenta de nuevo más tarde.';
    }
    return error.response.data?.message || 'Error al contactar al servidor.';
  }
  if (error.request) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }
  return error.message || 'Ocurrió un error inesperado.';
};

export const getBotInfo = async (publicId) => {
  if (!publicId || publicId === 'undefined') {
    throw new Error('ID de chatbot inválido');
  }

  try {
    const response = await instance.get(`/plubots/chat/${publicId}`);
    const { data } = response;

    if (data.status === 'success') {
      return data.data;
    }
    throw new Error(data.message || 'No se pudo cargar la información del chatbot');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const postMessage = async (publicId, payload) => {
  try {
    const response = await instance.post(`/plubots/chat/${publicId}/message`, payload);
    const { data } = response;

    if (data.status === 'success') {
      return data.data;
    }
    throw new Error(data.message || 'Error en la respuesta del bot');
  } catch {
    throw new Error('No se pudo obtener respuesta. Intenta de nuevo.');
  }
};
