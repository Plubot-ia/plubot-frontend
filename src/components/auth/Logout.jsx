import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import useAuthStore from '@/stores/useAuthStore';

const Logout = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      await logout();
      navigate('/login');
      window.scrollTo(0, 0);
    };

    performLogout();
  }, [logout, navigate]);

  return null;
};

export default Logout;