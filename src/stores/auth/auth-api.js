import instance from '@/utils/axios-config.js';

export const loginUser = async (email, password) => {
  const payload = { email: email.trim(), password };
  const response = await instance.post('auth/login', payload, {
    timeout: 30_000,
  });
  return response.data;
};

export const logoutUser = async (accessToken) => {
  // Se crea una cabecera de autorización temporal para esta única llamada,
  // ya que el token en localStorage ya ha sido borrado.
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  const response = await instance.post('/auth/logout', {}, config);
  return response.data;
};

export const fetchUserProfile = async () => {
  const response = await instance.get('auth/profile');
  return response.data;
};

export const registerUser = async (name, email, password) => {
  const payload = { name, email, password };
  const response = await instance.post('auth/register', payload);
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await instance.post('auth/forgot-password', { email });
  return response.data;
};

export const resetUserPassword = async (token, newPassword) => {
  const response = await instance.post('auth/reset-password', {
    token,
    new_password: newPassword,
  });
  return response.data;
};

export const changeUserPassword = async (currentPassword, newPassword) => {
  const response = await instance.post('auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
};

export const verifyUserEmail = async (token) => {
  const response = await instance.get(`/auth/verify-email/${token}`);
  return response.data;
};

export const resendVerificationEmail = async (email) => {
  const response = await instance.post('auth/resend-verification', { email });
  return response.data;
};

export const fetchGoogleAuthUrl = async () => {
  const response = await instance.get('auth/google/login');
  return response.data;
};

export const processGoogleToken = async (token) => {
  const response = await instance.get(`auth/google/callback?code=${token}`);
  return response.data;
};

export const updateUserProfile = async (updates) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      if (typeof value === 'object' && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  }
  const response = await instance.post('auth/update-profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
