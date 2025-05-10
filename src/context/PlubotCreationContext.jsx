import { createContext, useContext, useState, useCallback } from 'react';

export const PlubotCreationContext = createContext();

export const PlubotCreationProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeSection, setActiveSection] = useState('name');
  const [plubotData, setPlubotData] = useState({
    name: '',
    color: '#9b59b6',
    tone: '', // Cambiado de personality a tone para consistencia
    powers: [],
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
    setCurrentStep(prev => prev + 1);
  }, []);

  const updatePlubotData = useCallback((newData) => {
    setPlubotData(prev => {
      const updatedData = { ...prev, ...newData };
      // Evitar actualizaciones innecesarias si los datos no han cambiado
      if (JSON.stringify(prev) === JSON.stringify(updatedData)) {
        return prev;
      }
      return updatedData;
    });
  }, []);

  const updateActiveSection = useCallback((section) => {
    setActiveSection(section);
    const sectionProgress = {
      name: 1,
      personality: 2,
      powers: 3,
      preview: 4,
    };
    setCurrentStep(sectionProgress[section] || 1);
  }, []);

  const resetPlubotCreation = useCallback(() => {
    setCurrentStep(1);
    setActiveSection('name');
    setPlubotData({
      name: '',
      color: '#9b59b6',
      tone: '',
      powers: [],
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

  return (
    <PlubotCreationContext.Provider value={{ currentStep, nextStep, plubotData, updatePlubotData, activeSection, updateActiveSection, resetPlubotCreation }}>
      {children}
    </PlubotCreationContext.Provider>
  );
};

export const usePlubotCreation = () => {
  const context = useContext(PlubotCreationContext);
  if (!context) {
    throw new Error('usePlubotCreation debe usarse dentro de un PlubotCreationProvider');
  }
  return context;
};