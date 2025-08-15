import { useContext } from 'react';

import { ByteMessageContext } from '../context/byteMessage/ByteMessageContext';

const useByteMessageContext = () => {
  const context = useContext(ByteMessageContext);
  if (context === undefined) {
    throw new Error('useByteMessageContext must be used within a ByteMessageProvider');
  }
  return context;
};

export default useByteMessageContext;
