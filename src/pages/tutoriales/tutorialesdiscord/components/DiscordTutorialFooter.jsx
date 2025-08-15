import React from 'react';
import { Link } from 'react-router-dom';

const DiscordTutorialFooter = () => (
  <div className='tutorial-footer'>
    <p>
      Asegúrate de tener el Modo Desarrollador activado para poder ver la opción &quot;Copiar
      ID&quot;. Si tienes problemas, verifica tu configuración de Discord.
    </p>
    <Link to='/profile' className='cyber-link-button tutorial-link-back'>
      Volver a Integraciones
    </Link>
  </div>
);

export default DiscordTutorialFooter;
