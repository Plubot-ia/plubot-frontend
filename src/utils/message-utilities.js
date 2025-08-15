/**
 * @file message-utils.js
 * @description Utilidades para el manejo de mensajes y variables.
 * @author PLUBOT Team & Cascade AI
 */

import { escapeRegex } from './regex-utilities.js';

/**
 * Reemplaza las ocurrencias de variables (ej: {{variable}}) en un mensaje con sus valores.
 * @param {string} message - El mensaje original con placeholders de variables.
 * @param {Array<Object>} variables - Un array de objetos variable, donde cada objeto tiene
 *   { name: string, value: string }.
 * @returns {string} - El mensaje con las variables reemplazadas.
 */
export const replaceVariablesInMessage = (message, variables) => {
  if (!message) return '';
  if (!variables || variables.length === 0) return message;

  let processedText = message;
  for (const variable of variables) {
    if (variable && variable.name) {
      // Escapar el nombre de la variable para usarlo de forma segura en la regex.
      const escapedVariableName = escapeRegex(variable.name);
      // La variable ha sido saneada con escapeRegex, por lo que es seguro usarla aquí.
      // eslint-disable-next-line security/detect-non-literal-regexp
      const regex = new RegExp(`{{\\s*${escapedVariableName}\\s*}}`, 'g');
      const replacement = typeof variable.value === 'string' ? variable.value : '';
      processedText = processedText.replace(regex, replacement);
    }
  }

  return processedText;
};
