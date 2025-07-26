import PropTypes from 'prop-types';
import React from 'react';

import ByteMessageProvider from './byteMessage/ByteMessageProvider';
import FlowDataProvider from './flowData/FlowDataProvider';
import ModalProvider from './modal/ModalProvider';

const GlobalProvider = ({ children }) => (
  <ModalProvider>
    <ByteMessageProvider>
      <FlowDataProvider>{children}</FlowDataProvider>
    </ByteMessageProvider>
  </ModalProvider>
);

GlobalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default GlobalProvider;
