import React from 'react';

const ProfileLoading = () => (
  <div className='profile-container'>
    <div className='loading-terminal'>
      <div className='terminal-header'>Cargando Perfil...</div>
      <div className='terminal-body'>
        <div className='terminal-line'>{'>'} Estableciendo conexión segura...</div>
        <div className='terminal-line'>{'>'} Autenticando credenciales...</div>
        <div className='terminal-line terminal-cursor'>{'>'} _</div>
      </div>
    </div>
  </div>
);

export default ProfileLoading;
