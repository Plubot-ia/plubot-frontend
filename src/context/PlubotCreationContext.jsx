import PropTypes from 'prop-types';
import React, { useState, useCallback } from 'react';

import { PlubotCreationContext } from './PlubotCreationContextObject';

const sectionProgressMap = new Map([
  ['name', 1],
  ['personality', 2],
  ['powers', 3],
  ['preview', 4],
]);

export const PlubotCreationProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeSection, setActiveSection] = useState('name');
  const [plubotData, setPlubotData] = useState({
    name: '',
    color: '#9b59b6',
    tone: '',
    powers: [],
    selectedPowers: new Set(),
    flowData: {
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Inicio' },
        },
      ],
      edges: [],
    },
    flowVersions: [],
  });

  const nextStep = useCallback(() => {
    setCurrentStep((previous) => previous + 1);
  }, []);

  const updatePlubotData = useCallback((newData) => {
    setPlubotData((previous) => ({ ...previous, ...newData }));
  }, []);

  const updateActiveSection = useCallback((section) => {
    setActiveSection(section);
    setCurrentStep(sectionProgressMap.get(section) || 1);
  }, []);

  const resetPlubotCreation = useCallback(() => {
    setCurrentStep(1);
    setActiveSection('name');
    setPlubotData({
      name: '',
      color: '#9b59b6',
      tone: '',
      powers: [],
      selectedPowers: new Set(),
      flowData: {
        nodes: [
          {
            id: 'start-1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Inicio' },
          },
        ],
        edges: [],
      },
      flowVersions: [],
    });
  }, []);

  const contextValue = {
    currentStep,
    nextStep,
    plubotData,
    updatePlubotData,
    activeSection,
    updateActiveSection,
    resetPlubotCreation,
  };

  return (
    <PlubotCreationContext.Provider value={contextValue}>{children}</PlubotCreationContext.Provider>
  );
};

PlubotCreationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
