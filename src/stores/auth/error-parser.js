export const parseAuthError = (error) => {
  if (error.response && error.response.status === 422 && Array.isArray(error.response.data)) {
    const validationErrors = error.response.data;
    const passwordError = validationErrors.find(
      (validationError) => validationError.loc && validationError.loc.includes('password'),
    );
    if (passwordError) {
      return passwordError.msg;
    }
    return validationErrors.map((validationError) => validationError.msg).join(', ');
  }
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  return error.message || 'Error de conexión o del servidor.';
};
