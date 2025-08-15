import { useContext } from 'react';

import { FlowDataContext } from '../context/flowData/FlowDataContext';

const useFlowDataContext = () => {
  const context = useContext(FlowDataContext);
  if (context === undefined) {
    throw new Error('useFlowDataContext must be used within a FlowDataProvider');
  }
  return context;
};

export default useFlowDataContext;
