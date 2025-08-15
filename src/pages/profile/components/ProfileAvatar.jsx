import PropTypes from 'prop-types';
import React from 'react';

const ProfileAvatar = ({
  user,
  level,
  imageLoaded,
  fileInputReference,
  triggerFileInput,
  handleKeyDown,
  handleImageLoad,
  handleImageUpload,
}) => (
  <div className='profile-avatar-container'>
    <div
      className='profile-avatar hover-effect profile-avatar-styles'
      onClick={triggerFileInput}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex='0'
    >
      {user.profile_picture ? (
        <img
          src={user.profile_picture}
          alt='Profile'
          className={`profile-avatar-image profile-avatar-image-styles ${
            imageLoaded ? 'loaded' : ''
          }`}
          onLoad={handleImageLoad}
        />
      ) : (
        <div className='profile-avatar-inner'>{user.name ? user.name.charAt(0) : ''}</div>
      )}
      <div className='profile-avatar-overlay'>📷</div>
    </div>
    <input
      type='file'
      ref={fileInputReference}
      onChange={handleImageUpload}
      accept='image/png,image/jpeg,image/gif'
      className='file-input-hidden'
    />
    <div className='profile-avatar-ring profile-avatar-ring-zindex' />
    <div className='profile-avatar-ring profile-avatar-ring-zindex' />
    <div className='profile-level-badge profile-level-badge-zindex'>
      {level ? level.charAt(0) : ''}
    </div>
  </div>
);

ProfileAvatar.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    profile_picture: PropTypes.string,
  }).isRequired,
  level: PropTypes.string.isRequired,
  imageLoaded: PropTypes.bool.isRequired,
  fileInputReference: PropTypes.object.isRequired,
  triggerFileInput: PropTypes.func.isRequired,
  handleKeyDown: PropTypes.func.isRequired,
  handleImageLoad: PropTypes.func.isRequired,
  handleImageUpload: PropTypes.func.isRequired,
};

export default ProfileAvatar;
