import { useState, useCallback } from 'react';

/**
 * Hook personalizado para gestionar el estado y la lógica del menú contextual.
 * Encapsula la creación, posicionamiento y cierre de los menús para nodos y aristas.
 * @returns {{menu: Object, onNodeContextMenu: Function, onEdgeContextMenu: Function, onPaneClick: Function, closeContextMenu: Function}}
 */
const useContextMenu = () => {
  const [menu, setMenu] = useState();

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    const pane = event.target.closest('.react-flow__pane');
    if (!pane) return;

    const paneBounds = pane.getBoundingClientRect();
    setMenu({
      id: node.id,
      type: 'node',
      top: event.clientY - paneBounds.top,
      left: event.clientX - paneBounds.left,
      data: node,
    });
  }, []);

  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    const pane = event.target.closest('.react-flow__pane');
    if (!pane) return;

    const paneBounds = pane.getBoundingClientRect();
    setMenu({
      id: edge.id,
      type: 'edge',
      top: event.clientY - paneBounds.top,
      left: event.clientX - paneBounds.left,
      data: edge,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setMenu(undefined);
  }, []);

  return {
    menu,
    onNodeContextMenu,
    onEdgeContextMenu,
    onPaneClick: closeContextMenu,
    closeContextMenu,
  };
};

export default useContextMenu;
