import { useFlowMeta } from '@/stores/selectors';
import useAuthStore from '@/stores/use-auth-store';

import useByteMessageContext from './useByteMessageContext';
import useModalContext from './useModalContext';

export const useHeaderData = () => {
  const { openModal, closeAllModals } = useModalContext();
  const { showNotification } = useByteMessageContext();
  const { lastSaved, saveFlow } = useFlowMeta();
  const { isAuthenticated } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
  }));

  return {
    openModal,
    closeAllModals,
    showNotification,
    lastSaved,
    saveFlow,
    isAuthenticated,
  };
};
