import React from 'react';
import { Link } from 'react-router-dom';
import './TutorialDiscordChannelId.css'; // Importar el CSS específico

const TutorialDiscordChannelId = () => {
  return (
    <div className="tutorial-discord-container"> {/* Clase principal para estilos */}
      <Link to="/profile" className="cyber-link-button tutorial-link-back">Volver a Integraciones</Link>
      <h1>Guía: Obtener el ID de un Canal de Discord</h1>
      <p>Para configurar ciertas funciones en Plubot, como enviar mensajes a un canal específico, necesitarás el ID de ese canal de Discord. Aquí te mostramos cómo obtenerlo.</p>

      <section>
        <h2>Paso 1: Habilitar el Modo Desarrollador en Discord</h2>
        <p>Antes de poder copiar IDs, necesitas activar el &quot;Modo Desarrollador&quot; en tu configuración de Discord.</p>
        <ul>
          <li>Abre tu aplicación de Discord (de escritorio o web).</li>
          <li>Ve a <strong>Ajustes de Usuario</strong> (el ícono de engranaje ⚙️ cerca de tu nombre de usuario, usualmente en la parte inferior izquierda).</li>
          <li>En el menú de la izquierda, bajo &quot;Ajustes de Aplicación&quot;, selecciona <strong>Avanzado</strong>.</li>
          <li>Activa la opción <strong>Modo de desarrollador</strong>. Debería ponerse de color verde o azul.</li>
        </ul>
        <p><em>Nota: Si no ves la opción &quot;Avanzado&quot; directamente, puede estar dentro de &quot;Apariencia&quot; o una sección similar dependiendo de las actualizaciones de Discord. Busca &quot;Modo de desarrollador&quot;.</em></p>
      </section>

      <section>
        <h2>Paso 2: Copiar el ID del Canal</h2>
        <p>Una vez que el Modo Desarrollador está activado:</p>
        <ul>
          <li>Navega al servidor y al canal específico del cual quieres obtener el ID.</li>
          <li>Haz <strong>clic derecho</strong> sobre el nombre del canal en la lista de canales (a la izquierda).</li>
          <li>En el menú contextual que aparece, deberías ver la opción <strong>&quot;Copiar ID&quot;</strong>. Haz clic en ella.</li>
        </ul>
        <p>¡Listo! El ID del canal se ha copiado a tu portapapeles. Ahora puedes pegarlo donde lo necesites en Plubot.</p>
        <p><strong>Ejemplo de un ID de Canal:</strong> <code>123456789012345678</code> (será una larga secuencia de números).</p>
      </section>

      <section>
        <h2>¿Qué es un ID de Canal y por qué lo necesito?</h2>
        <p>Cada canal, usuario, servidor (guild) y mensaje en Discord tiene un ID único. Estos IDs son la forma en que Discord identifica elementos específicos internamente. Plubot utiliza estos IDs para saber exactamente a dónde enviar mensajes o de dónde obtener información, asegurando que las acciones se realicen en el lugar correcto.</p>
      </section>

      <div className="tutorial-footer">
        <p>Asegúrate de tener el Modo Desarrollador activado para poder ver la opción &quot;Copiar ID&quot;. Si tienes problemas, verifica tu configuración de Discord.</p>
        <Link to="/profile" className="cyber-link-button tutorial-link-back">Volver a Integraciones</Link>
      </div>
    </div>
  );
};

export default TutorialDiscordChannelId;

