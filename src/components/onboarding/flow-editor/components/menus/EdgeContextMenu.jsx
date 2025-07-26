import PropTypes from 'prop-types';
import { FiTrash2, FiLink } from 'react-icons/fi';

import useFlowStore from '@/stores/use-flow-store';

const handleKeyDown = (event, action) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
};

/**
 * Menu00fa contextual para aristas del flujo
 * @param {Object} props - Propiedades
 * @param {Object} props.position - Posiciu00f3n {x, y} donde mostrar el menu00fa
 * @param {Function} props.onClose - Funciu00f3n para cerrar el menu00fa
 */
// Constantes de estilos para el menú contextual de aristas
const EDGE_MENU_STYLES = {
  menu: {
    position: 'absolute',
    zIndex: 10_000,
    backgroundColor: '#fff',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    padding: '5px 0',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 15px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '14px',
  },
  icon: {
    marginRight: '8px',
    fontSize: '16px',
  },
  separator: {
    height: '1px',
    backgroundColor: '#eee',
    margin: '5px 0',
  },
  header: {
    padding: '5px 15px',
    fontSize: '12px',
    color: '#666',
  },
};

// Colores disponibles para las aristas
const EDGE_COLORS = [
  { name: 'Azul', color: '#3498db', stroke: '#3498db', strokeWidth: 2 },
  { name: 'Verde', color: '#2ecc71', stroke: '#2ecc71', strokeWidth: 2 },
  { name: 'Rojo', color: '#e74c3c', stroke: '#e74c3c', strokeWidth: 2 },
];

// Helper para renderizar ítem de color
const _renderColorItem = (colorConfig, handleStyleChange, onKeyDown) => (
  <div
    key={colorConfig.name}
    className='menu-item style-item'
    style={{ ...EDGE_MENU_STYLES.menuItem, color: colorConfig.color }}
    onClick={() =>
      handleStyleChange({
        stroke: colorConfig.stroke,
        strokeWidth: colorConfig.strokeWidth,
      })
    }
    onKeyDown={(event) =>
      onKeyDown(event, () =>
        handleStyleChange({
          stroke: colorConfig.stroke,
          strokeWidth: colorConfig.strokeWidth,
        }),
      )
    }
    role='button'
    tabIndex={0}
  >
    {colorConfig.name}
  </div>
);

const EdgeContextMenu = ({ position, onClose }) => {
  const selectedEdge = useFlowStore((state) =>
    state.edges.find((edge) => edge.id === state.selectedEdge),
  );
  const { removeEdge, updateEdge } = useFlowStore();

  if (!selectedEdge) return;

  const handleRemove = () => {
    removeEdge(selectedEdge.id);
    onClose();
  };

  const handleToggleAnimate = () => {
    updateEdge(selectedEdge.id, {
      animated: !selectedEdge.animated,
    });
    onClose();
  };

  const handleStyleChange = (style) => {
    updateEdge(selectedEdge.id, { style });
    onClose();
  };

  const menuStyle = {
    ...EDGE_MENU_STYLES.menu,
    left: `${position.x}px`,
    top: `${position.y}px`,
  };

  return (
    <div className='edge-context-menu' style={menuStyle}>
      <div
        className='menu-item animate-item'
        style={EDGE_MENU_STYLES.menuItem}
        onClick={handleToggleAnimate}
        onKeyDown={(event) => handleKeyDown(event, handleToggleAnimate)}
        role='button'
        tabIndex={0}
      >
        <FiLink style={EDGE_MENU_STYLES.icon} />
        {selectedEdge.animated ? 'Desactivar Animación' : 'Activar Animación'}
      </div>

      <div
        className='menu-item delete-item'
        style={EDGE_MENU_STYLES.menuItem}
        onClick={handleRemove}
        onKeyDown={(event) => handleKeyDown(event, handleRemove)}
        role='button'
        tabIndex={0}
      >
        <FiTrash2 style={EDGE_MENU_STYLES.icon} /> Eliminar Conexión
      </div>

      <div className='menu-separator' style={EDGE_MENU_STYLES.separator} />

      <div style={EDGE_MENU_STYLES.header}>Estilos de Conexión</div>

      {EDGE_COLORS.map((colorConfig) =>
        _renderColorItem(colorConfig, handleStyleChange, handleKeyDown),
      )}
    </div>
  );
};

EdgeContextMenu.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default EdgeContextMenu;
