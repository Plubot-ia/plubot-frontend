import PropTypes from 'prop-types';

/**
 * PropertyTypes definitions para CustomMiniMap component
 */
export const CustomMinimapPropertyTypes = {
  nodes: PropTypes.array,
  edges: PropTypes.array,
  isExpanded: PropTypes.bool,
  toggleMiniMap: PropTypes.func,
  viewport: PropTypes.object,
  isUltraMode: PropTypes.bool,
};
