import { useState } from 'react';

const useProfileState = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [expandedSection, setExpandedSection] = useState();
  const [animateBadges, setAnimateBadges] = useState(false);
  const [pulsatingElements, setPulsatingElements] = useState([]);
  const [modalPlubot, setModalPlubot] = useState();
  const [editModalPlubot, setEditModalPlubot] = useState();

  return {
    activeTab,
    setActiveTab,
    expandedSection,
    setExpandedSection,
    animateBadges,
    setAnimateBadges,
    pulsatingElements,
    setPulsatingElements,
    modalPlubot,
    setModalPlubot,
    editModalPlubot,
    setEditModalPlubot,
  };
};

export default useProfileState;
