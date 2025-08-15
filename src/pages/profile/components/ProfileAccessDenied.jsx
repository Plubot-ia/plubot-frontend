import React from 'react';

const ProfileAccessDenied = () => (
  <div className='profile-container'>
    <div className='loading-terminal'>
      <div className='terminal-header'>Acceso Denegado</div>
      <div className='terminal-body'>
        <div className='terminal-line'>{'>'} Error: Usuario no autenticado</div>
        <div className='terminal-line'>{'>'} Por favor inicie sesión para continuar</div>
        <div className='terminal-line terminal-cursor'>{'>'} _</div>
      </div>
    </div>
  </div>
);

export default ProfileAccessDenied;
