import PropTypes from 'prop-types';
import React from 'react';

import FlowEditorContext from './FlowEditorContextObject';
import { useFlowEditorLogic } from './hooks/useFlowEditorLogic';

/**
 * Proveedor de contexto para el editor de flujos
 * Maneja el estado global, historial y optimizaciones
 */
export const FlowEditorProvider = ({ children }) => {
  const contextValue = useFlowEditorLogic();

  return <FlowEditorContext.Provider value={contextValue}>{children}</FlowEditorContext.Provider>;
};

FlowEditorProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
