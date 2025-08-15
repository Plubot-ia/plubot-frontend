import React from 'react';
import { Link } from 'react-router-dom';

const DiscordTutorialHeader = () => (
  <>
    <Link to='/profile' className='cyber-link-button tutorial-link-back'>
      Volver a Integraciones
    </Link>
    <h1>Guía: Obtener el ID de un Canal de Discord</h1>
    <p>
      Para configurar ciertas funciones en Plubot, como enviar mensajes a un canal específico,
      necesitarás el ID de ese canal de Discord. Aquí te mostramos cómo obtenerlo.
    </p>
  </>
);

export default DiscordTutorialHeader;
