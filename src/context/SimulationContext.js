// SimulationContext.js
import PropTypes from 'prop-types';
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const SimulationContext = createContext();

const initialState = {
  history: [],
  currentNodeId: undefined,
  isTyping: false,
  userInput: '',
  simulationActive: false,
  settings: {
    language: 'es',
    theme: 'dark',
    soundEffects: true,
  },
};

function simulationReducer(state, action) {
  switch (action.type) {
    case 'SET_NODE': {
      return { ...state, currentNodeId: action.payload };
    }
    case 'ADD_MESSAGE': {
      return { ...state, history: [...state.history, action.payload] };
    }
    // Otros casos...
    default: {
      return state;
    }
  }
}

export const SimulationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(simulationReducer, initialState);

  // Persistencia
  useEffect(() => {
    const savedState = localStorage.getItem('simulation-state');
    if (savedState) {
      try {
        dispatch({ type: 'RESTORE_STATE', payload: JSON.parse(savedState) });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('simulation-state', JSON.stringify(state));
  }, [state]);

  return (
    <SimulationContext.Provider value={{ state, dispatch }}>{children}</SimulationContext.Provider>
  );
};

SimulationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useSimulation = () => useContext(SimulationContext);
