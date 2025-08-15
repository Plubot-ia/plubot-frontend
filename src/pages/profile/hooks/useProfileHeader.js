import { useCallback, useState } from 'react';

import useAuthStore from '@/stores/use-auth-store';

const useProfileHeader = ({ onEdit, onLogout }) => {
  const { user } = useAuthStore();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMenuOpen((previous) => !previous);
  }, []);

  const handleEdit = useCallback(() => {
    onEdit();
    setMenuOpen(false);
  }, [onEdit]);

  const handleLogout = useCallback(() => {
    onLogout();
    setMenuOpen(false);
  }, [onLogout]);

  return {
    user,
    isMenuOpen,
    toggleMenu,
    handleEdit,
    handleLogout,
  };
};

export default useProfileHeader;
