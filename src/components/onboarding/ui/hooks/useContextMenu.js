import { useState, useCallback, useEffect, useRef } from 'react';

const useContextMenu = (isContextMenuMode, onClose, options) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuReference = useRef(null);

  const handleClose = useCallback(() => {
    if (isContextMenuMode) {
      onClose();
    } else {
      setShowMenu(false);
    }
  }, [isContextMenuMode, onClose]);

  const handleContextMenu = useCallback(
    (event) => {
      if (!isContextMenuMode && options && options.length > 0) {
        event.preventDefault();
        setMenuPosition({ x: event.clientX, y: event.clientY });
        setShowMenu(true);
      }
    },
    [isContextMenuMode, options],
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuReference.current && !menuReference.current.contains(event.target)) {
        handleClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (showMenu || isContextMenuMode) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu, isContextMenuMode, handleClose]);

  return {
    showMenu,
    menuPosition,
    menuReference,
    handleContextMenu,
    handleClose,
  };
};

export default useContextMenu;
