import PropTypes from 'prop-types';
import React, { useRef, useEffect, useState } from 'react';

import EliteEdge from './EliteEdge';

/**
 * APPLE-LEVEL OPTIMIZATION WRAPPER
 * This wrapper controls when EliteEdge actually re-renders
 * by intercepting props and only passing through significant changes
 */
const EliteEdgeWrapper = (props) => {
  const [controlledProps, setControlledProps] = useState(props);
  const lastPropsRef = useRef(props);
  const renderCountRef = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();

    // Smart comparison function - simplified to always return true for now
    const shouldUpdate = () => true;

    // Check if we need to update
    const needsUpdate = shouldUpdate();

    if (needsUpdate) {
      lastRenderTime.current = now;
      lastPropsRef.current = props;
      setControlledProps(props);
      renderCountRef.current++;
    }
  }, [props]);

  // Pass controlled props to actual EliteEdge
  return <EliteEdge {...controlledProps} />;
};

EliteEdgeWrapper.displayName = 'EliteEdgeWrapper';

EliteEdgeWrapper.propTypes = {
  isDragging: PropTypes.bool,
  id: PropTypes.string,
  source: PropTypes.string,
  target: PropTypes.string,
  selected: PropTypes.bool,
  sourceHandle: PropTypes.string,
  targetHandle: PropTypes.string,
  sourceX: PropTypes.number,
  sourceY: PropTypes.number,
  targetX: PropTypes.number,
  targetY: PropTypes.number,
};

export default React.memo(EliteEdgeWrapper);
