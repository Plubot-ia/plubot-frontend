/**
 * PersonalizationFormUtils.js - Utilidades para PersonalizationForm
 */

/**
 * Normaliza y extrae datos del Plubot desde la respuesta de la API
 * @param {Object} response - Respuesta de la API
 * @returns {Object} Datos normalizados del Plubot
 */
export const normalizeAndExtractPlubotData = (response) => {
  const { name, tone, color, powers: plubotPowers, purpose, initial_message } = response.plubot;

  // Normalizar datos para evitar valores nulos o indefinidos
  const normalizedTone = tone ? tone.toLowerCase() : 'neutral';
  let normalizedPowers = [];
  if (Array.isArray(plubotPowers)) {
    normalizedPowers = plubotPowers;
  } else if (typeof plubotPowers === 'string') {
    normalizedPowers = plubotPowers.split(',').filter(Boolean);
  }

  return {
    name: name ?? '',
    tone: normalizedTone,
    color: color || '#D1D5DB',
    powers: normalizedPowers,
    purpose: purpose || 'asistir a los clientes en chat web',
    initial_message: initial_message ?? '',
  };
};

/**
 * Actualiza el contexto y estados con datos normalizados
 * @param {string} id - ID del Plubot
 * @param {Object} normalizedData - Datos normalizados
 * @param {Function} updatePlubotData - Función para actualizar datos del Plubot
 * @param {Function} setNameInput - Función para establecer input del nombre
 * @param {Function} setEnergyLevel - Función para establecer nivel de energía
 */
export const updateContextAndStates = (
  id,
  normalizedData,
  updatePlubotData,
  { setNameInput, setEnergyLevel },
) => {
  // Actualizar el contexto con datos completos
  updatePlubotData({
    id,
    ...normalizedData,
  });

  // Actualizar estados locales
  setNameInput(normalizedData.name);
  setEnergyLevel(normalizedData.name ? Math.min(normalizedData.name.length * 10, 100) : 0);
};

/**
 * Maneja errores específicos de la API
 * @param {Error} error - Error capturado
 * @param {Function} setErrorMessage - Función para establecer mensaje de error
 * @param {Function} setMessageText - Función para establecer texto de mensaje
 */
export const handleFetchErrors = (error, setErrorMessage, setMessageText) => {
  // Manejar errores específicos
  if (error.message?.includes('404')) {
    setErrorMessage('Plubot no encontrado');
    setMessageText('Plubot no encontrado. Verifica el ID del Plubot.');
  } else {
    setErrorMessage(error.message || 'Error de conexión');
    setMessageText(`Error al cargar el Plubot: ${error.message || 'Error de conexión'}`);
  }
};

/**
 * Función para cargar datos del Plubot desde la API
 * @param {string} id - ID del Plubot
 * @param {Object} dependencies - Dependencias necesarias
 * @returns {Promise<boolean>} True si la carga fue exitosa
 */
export const fetchPlubotData = async (
  id,
  {
    request,
    setIsLoading,
    setErrorMessage,
    setMessageText,
    updatePlubotData,
    setNameInput,
    setEnergyLevel,
  },
) => {
  if (!id) return false;

  setIsLoading(true);
  setErrorMessage('');

  try {
    const response = await request('GET', `/plubots/${id}`);

    if (response?.status === 'success' && response?.plubot) {
      const normalizedData = normalizeAndExtractPlubotData(response);
      updateContextAndStates(id, normalizedData, updatePlubotData, {
        setNameInput,
        setEnergyLevel,
      });
      return true;
    } else {
      const errorMessage_ = response?.message || 'Error desconocido al cargar datos';
      setMessageText(`Error al cargar el Plubot: ${errorMessage_}`);
      return false;
    }
  } catch (error) {
    handleFetchErrors(error, setErrorMessage, setMessageText);
    return false;
  } finally {
    setIsLoading(false);
  }
};

/**
 * Genera mensajes contextuales según el modo de edición
 * @param {string} plubotId - ID del Plubot (null para modo creación)
 * @returns {Object} Mensajes contextuales
 */
export const getPersonalizationMessages = (plubotId) => ({
  name: plubotId
    ? 'Edita el nombre de tu Plubot para reflejar su nueva identidad.'
    : 'Dale un nombre único a tu Plubot Despierto. ¡Este será su identidad en el Pluniverse!',
  personality: plubotId
    ? 'Ajusta la personalidad de tu Plubot para cambiar cómo interactúa.'
    : 'Elige una personalidad para tu Plubot. Define cómo interactuará con el mundo.',
  powers: plubotId
    ? 'Modifica los poderes de tu Plubot para adaptarlo a nuevas tareas.'
    : 'Selecciona poderes gratuitos para tu Plubot. Los poderes Pro desbloquean integraciones avanzadas.',
  preview: plubotId
    ? '¡Tu Plubot está actualizado! Revisa los cambios antes de guardar.'
    : '¡Tu Plubot Despierto está listo! Actívalo para configurar sus respuestas.',
});
