import { useState, useEffect } from 'react';

import useSyncService, { getSyncState } from '../services/syncService';

const useSyncButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [syncDetails, setSyncDetails] = useState();
  const { syncAllPlubots } = useSyncService();

  useEffect(() => {
    const updateDetails = () => {
      setSyncDetails(getSyncState());
    };

    updateDetails(); // Carga inicial
    const updateInterval = setInterval(updateDetails, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  const handleClick = () => {
    setIsExpanded((previous) => !previous);
  };

  const handleSync = (event) => {
    event.stopPropagation();
    syncAllPlubots();
  };

  return { isExpanded, syncDetails, handleClick, handleSync };
};

export default useSyncButton;
