import { useContext } from 'react';

import FlowEditorContext from '../contexts/FlowEditorContextObject';

const useFlowEditor = () => {
  const context = useContext(FlowEditorContext);
  if (!context) {
    throw new Error('useFlowEditor debe usarse dentro de un FlowEditorProvider');
  }
  return context;
};

export default useFlowEditor;
