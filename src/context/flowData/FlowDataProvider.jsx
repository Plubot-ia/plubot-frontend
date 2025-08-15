import PropTypes from 'prop-types';
import { useState, useCallback, useMemo, useEffect } from 'react';

import { FlowDataContext } from './FlowDataContext';

const FlowDataProvider = ({ children }) => {
  const [currentFlowData, setCurrentFlowData] = useState({
    nodes: [],
    edges: [],
    plubotId: undefined,
    plubotName: 'Mi Plubot',
    project: { id: undefined, name: 'Proyecto' },
  });

  const updateCurrentFlowData = useCallback((newData) => {
    setCurrentFlowData((previous) => ({ ...previous, ...newData }));
  }, []);

  useEffect(() => {
    const handleFlowDataUpdate = (event) => {
      try {
        const { nodes, edges, plubotId, plubotName, project } = event.detail;
        updateCurrentFlowData({ nodes, edges, plubotId, plubotName, project });
      } catch {}
    };

    globalThis.addEventListener('plubot-flow-data-update', handleFlowDataUpdate);
    return () => {
      globalThis.removeEventListener('plubot-flow-data-update', handleFlowDataUpdate);
    };
  }, [updateCurrentFlowData]);

  const contextValue = useMemo(
    () => ({ currentFlowData, updateCurrentFlowData }),
    [currentFlowData, updateCurrentFlowData],
  );

  return <FlowDataContext.Provider value={contextValue}>{children}</FlowDataContext.Provider>;
};

FlowDataProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default FlowDataProvider;
