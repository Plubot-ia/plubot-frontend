import React, { lazy, Suspense } from 'react';

import useFlowDataContext from '../../../hooks/useFlowDataContext';
import useModalContext from '../../../hooks/useModalContext';

// Lazy load modals for better performance
const TemplateSelector = lazy(
  () => import('../../../components/onboarding/modals/TemplateSelector'),
);
const EmbedModal = lazy(() => import('../../../components/onboarding/modals/EmbedModal'));
const ImportExportModal = lazy(
  () => import('../../../components/onboarding/modals/ImportExportModal'),
);

const GlobalModals = () => {
  const { activeModals, closeModal } = useModalContext();
  const { currentFlowData } = useFlowDataContext();

  return (
    <Suspense fallback={<div />}>
      {activeModals.templateSelector && (
        <TemplateSelector
          isOpen={activeModals.templateSelector}
          onClose={() => closeModal('templateSelector')}
        />
      )}
      {activeModals.embed && (
        <EmbedModal
          isOpen={activeModals.embed}
          onClose={() => closeModal('embed')}
          plubotId={currentFlowData?.id}
          plubotName={currentFlowData?.name || 'Mi Plubot'}
          flowData={currentFlowData}
        />
      )}
      {activeModals.importExport && (
        <ImportExportModal
          isOpen={activeModals.importExport}
          onClose={() => closeModal('importExport')}
          flowData={currentFlowData}
        />
      )}
    </Suspense>
  );
};

export default GlobalModals;
