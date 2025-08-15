import logger from '../services/loggerService';

const suggestionProviders = [];

export const registerSuggestionProvider = (provider) => {
  if (typeof provider !== 'function') {
    throw new TypeError('El proveedor de sugerencias debe ser una función');
  }
  suggestionProviders.push(provider);
};

export const getSuggestions = (context) => {
  const allSuggestions = [];
  for (const provider of suggestionProviders) {
    try {
      const suggestions = provider(context);
      allSuggestions.push(...suggestions);
    } catch (error) {
      logger.error('Error en el proveedor de sugerencias:', error);
    }
  }
  return allSuggestions;
};
