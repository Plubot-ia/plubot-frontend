import { useState, useCallback } from 'react';

const useExpandedSections = (initialState) => {
  const [expandedSections, setExpandedSections] = useState(initialState);

  const toggleSection = useCallback((sectionId) => {
    setExpandedSections((previousState) => ({
      ...previousState,
      // The sectionId is an internally controlled value, so this is safe.
      // eslint-disable-next-line security/detect-object-injection
      [sectionId]: !previousState[sectionId],
    }));
  }, []);

  return { expandedSections, toggleSection };
};

export default useExpandedSections;
