/**
 * @file messageUtils.js
 * @description Utilidades para el manejo de mensajes y variables.
 * @author PLUBOT Team & Cascade AI
 */

/**
 * Reemplaza las ocurrencias de variables (ej: {{variable}}) en un mensaje con sus valores.
 * @param {string} message - El mensaje original con placeholders de variables.
 * @param {Array<Object>} variables - Un array de objetos variable, donde cada objeto tiene { name: string, value: string }.
 * @returns {string} - El mensaje con las variables reemplazadas.
 */
export const replaceVariablesInMessage = (message, variables) => {
  if (!message) return '';
  if (!variables || variables.length === 0) return message;

  let processedText = message;
  variables.forEach(variable => {
    if (variable && variable.name) {
      // Crear una expresión regular para encontrar {{nombre_variable}} o {{ nombre_variable }}
      // Asegura que el nombre de la variable no contenga caracteres especiales de regex sin escapar
      const escapedVarName = variable.name.replace(/[.*+?^${}()|[\\]]/g, '\\$&');
      // eslint-disable-next-line no-useless-escape
      const regex = new RegExp(`{{\s*${escapedVarName}\s*}}`, 'g');
      const replacement = typeof variable.value === 'string' ? variable.value : '';
      processedText = processedText.replace(regex, replacement);
    }
  });

  return processedText;
};
