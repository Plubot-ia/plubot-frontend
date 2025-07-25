import { useState, useEffect, useRef } from 'react';

export const useHeaderState = () => {
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [isSaving, setSavingIndicator] = useState(false);
  const [saveStatus, setSaveStatus] = useState();
  const [notification, setNotification] = useState();
  const saveTimeoutReference = useRef(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (saveStatus) {
      saveTimeoutReference.current = setTimeout(
        () => setSaveStatus(undefined),
        3000,
      );
    }
    return () => {
      if (saveTimeoutReference.current) {
        clearTimeout(saveTimeoutReference.current);
      }
    };
  }, [saveStatus]);

  return {
    optionsMenuOpen,
    setOptionsMenuOpen,
    isSaving,
    setSavingIndicator,
    saveStatus,
    setSaveStatus,
    notification,
    setNotification,
    time,
  };
};
