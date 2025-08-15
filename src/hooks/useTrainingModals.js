import useTrainingStore from '@/stores/use-training-store';

export const useTrainingModals = () => {
  const { openShareModal, openSimulateModal, openTemplatesModal, openSettingsModal } =
    useTrainingStore((state) => ({
      openShareModal: state.openShareModal,
      openSimulateModal: state.openSimulateModal,
      openTemplatesModal: state.openTemplatesModal,
      openSettingsModal: state.openSettingsModal,
    }));

  return {
    storeShareModal: openShareModal,
    storeSimulateModal: openSimulateModal,
    storeTemplatesModal: openTemplatesModal,
    storeSettingsModal: openSettingsModal,
  };
};
