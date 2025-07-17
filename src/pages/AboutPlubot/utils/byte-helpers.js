export const secureRandom = () => {
  return crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32 - 1);
};

import byteHappy from '@/assets/img/byte-happy.png';
import byteNormal from '@/assets/img/byte-normal.png';
import byteSad from '@/assets/img/byte-sad.png';
import byteThinking from '@/assets/img/byte-thinking.png';
import byteWarning from '@/assets/img/byte-warning.png';

export const getTypeColor = (messageType) => {
  switch (messageType) {
    case 'error': {
      return '#ff2e5b';
    }
    case 'success': {
      return '#00ff9d';
    }
    case 'warning': {
      return '#ffb700';
    }
    default: {
      return '#00e0ff';
    }
  }
};

export const getByteImage = (state) => {
  switch (state) {
    case 'happy': {
      return byteHappy;
    }
    case 'sad': {
      return byteSad;
    }
    case 'warning': {
      return byteWarning;
    }
    case 'thinking': {
      return byteThinking;
    }
    default: {
      return byteNormal;
    }
  }
};
