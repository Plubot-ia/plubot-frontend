const suggestionProviders = [];

export const registerSuggestionProvider = (provider) => {
  if (typeof provider !== 'function') {
    throw new Error('El proveedor de sugerencias debe ser una función');
  }
  suggestionProviders.push(provider);
};

export const getSuggestions = (context) => {
  return suggestionProviders.reduce((acc, provider) => {
    try {
      const suggestions = provider(context);
      return [...acc, ...suggestions];
    } catch (error) {

      return acc;
    }
  }, []);
};