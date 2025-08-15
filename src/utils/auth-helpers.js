/**
 * @file Módulo de ayudantes para la lógica de autenticación.
 * Contiene funciones reutilizables para validación de formularios, evaluación de contraseñas,
 * y manejo de envíos de formularios de registro y login.
 */

/**
 * Evalúa la fortaleza de una contraseña y devuelve un objeto con el nivel, color y texto de feedback.
 * @param {string} newPassword - La contraseña a evaluar.
 * @returns {{width: number, color: string, text: string}} Objeto con los datos de la fortaleza.
 */
export const evaluatePasswordStrength = (newPassword) => {
  let strengthValue = 0;
  let feedbackText = 'Sin verificar';
  let color = '#333';

  if (newPassword.length > 0) {
    if (newPassword.length >= 8) strengthValue += 25;
    if (/[A-Z]/.test(newPassword)) strengthValue += 25;
    if (/\d/.test(newPassword)) strengthValue += 25;
    if (/[^A-Za-z0-9]/.test(newPassword)) strengthValue += 25;

    if (strengthValue <= 25) {
      feedbackText = 'Débil';
      color = '#ff4747';
    } else if (strengthValue <= 50) {
      feedbackText = 'Media';
      color = '#ffa500';
    } else if (strengthValue <= 75) {
      feedbackText = 'Buena';
      color = '#2de6ac';
    } else {
      feedbackText = 'Fuerte';
      color = '#00ff96';
    }
  }

  return { width: strengthValue, color, text: feedbackText };
};

/**
 * Compara dos cadenas en tiempo constante para mitigar ataques de temporización (timing attacks).
 * No se exporta porque es un ayudante interno para este módulo.
 * @param {string} stringA La primera cadena.
 * @param {string} stringB La segunda cadena.
 * @returns {boolean} `true` si las cadenas son iguales, `false` en caso contrario.
 */
export const secureCompare = (stringA, stringB) => {
  if (typeof stringA !== 'string' || typeof stringB !== 'string') {
    return false;
  }

  // La comparación de longitud por sí sola puede filtrar información de tiempo.
  // Usamos una estrategia que recorre los datos de manera consistente.
  const encoder = new TextEncoder();
  const a = encoder.encode(stringA);
  let b = encoder.encode(stringB);

  let mismatch = a.length === b.length ? 0 : 1;
  if (mismatch) {
    // Forzamos que b tenga la misma longitud que a para que el bucle se ejecute
    // en tiempo constante, pero el resultado final seguirá siendo `false`.
    b = new Uint8Array(a.length);
  }

  for (const [index, element] of a.entries()) {
    // eslint-disable-next-line security/detect-object-injection
    mismatch |= element ^ b[index];
  }

  return mismatch === 0;
};

/**
 * Valida los datos del formulario de registro.
 * @param {{name: string, email: string, password: string, confirmPassword: string}} fields - Campos del formulario.
 * @returns {{isValid: boolean, message: string}} Resultado de la validación.
 */
export const validateRegistrationForm = (fields) => {
  const { name, email, password, confirmPassword } = fields;

  if (!name || !email || !password || !confirmPassword) {
    return { isValid: false, message: 'Por favor completa todos los campos' };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'La contraseña debe tener al menos 8 caracteres',
    };
  }

  if (!secureCompare(password, confirmPassword)) {
    return { isValid: false, message: 'Las contraseñas no coinciden' };
  }

  const emailRegex = /[^\s@]{1,64}@[^\s@]{1,255}\.[a-zA-Z]{2,63}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Por favor ingresa un email válido' };
  }

  return { isValid: true, message: '' };
};
