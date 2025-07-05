import PropTypes from 'prop-types';
import React from 'react';

const ReactMarkdown = ({ children }) => {
  // Implementación simplificada que renderiza markdown básico
  return <div>{children}</div>;
};

ReactMarkdown.propTypes = {
  children: PropTypes.node,
};

export default ReactMarkdown;
