import PropTypes from 'prop-types';
import React from 'react';

import { adjustColor } from '../utils/adjustColor';

const getBotInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : 'P';
};

const ChatHeader = ({ botInfo }) => (
  <div
    className='chat-header'
    style={{
      background: botInfo?.color
        ? `linear-gradient(135deg, ${botInfo.color} 0%, ${adjustColor(botInfo.color, 30)} 100%)`
        : 'var(--primary-gradient)',
    }}
  >
    <div className='chat-header-avatar'>
      {botInfo?.avatar ? (
        <img src={botInfo.avatar} alt={botInfo.name} />
      ) : (
        getBotInitial(botInfo?.name)
      )}
    </div>
    <h2>{botInfo?.name || 'Chat'}</h2>
    <div className='chat-header-status'>
      <span className='status-dot' />
      <span>En línea</span>
    </div>
  </div>
);

ChatHeader.propTypes = {
  botInfo: PropTypes.shape({
    color: PropTypes.string,
    avatar: PropTypes.string,
    name: PropTypes.string,
  }),
};

ChatHeader.defaultProps = {
  botInfo: undefined,
};

export default ChatHeader;
