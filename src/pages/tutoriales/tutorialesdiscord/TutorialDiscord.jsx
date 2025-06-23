import React from 'react';
import { Link } from 'react-router-dom';
import './TutorialDiscord.css';

const TutorialDiscord = () => {
  return (
    <div className="tutorial-discord-container">
      <Link to="/profile" className="cyber-link-button tutorial-link-back">Volver a Integraciones</Link>
      <h1>Guía: Integrar tu Bot de Discord con Plubot</h1>
      <p>Esta guía te ayudará a obtener el token de tu bot de Discord y a configurarlo en Plubot.</p>
      
      <section>
        <h2>Paso 1: Acceder al Portal de Desarrolladores de Discord</h2>
        <p>Ve a <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer">Discord Developer Portal</a> e inicia sesión con tu cuenta de Discord.</p>
      </section>

      <section>
        <h2>Paso 2: Crear una Nueva Aplicación</h2>
        <p>1. Haz clic en el botón "New Application" en la esquina superior derecha.</p>
        <p>2. Dale un nombre a tu aplicación (por ejemplo, "MiBotParaPlubot") y acepta los términos.</p>
        <p>3. Haz clic en "Create".</p>
      </section>

      <section>
        <h2>Paso 3: Crear un Bot User</h2>
        <p>1. En el menú de la izquierda, selecciona la pestaña "Bot".</p>
        <p>2. Haz clic en "Add Bot" y confirma.</p>
        <p>3. Puedes personalizar el nombre de usuario y el avatar de tu bot aquí si lo deseas.</p>
      </section>

      <section>
        <h2>Paso 4: Obtener el Token del Bot</h2>
        <p><strong>¡Este token es secreto! No lo compartas con nadie.</strong></p>
        <p>1. En la misma sección "Bot", busca la sección "TOKEN".</p>
        <p>2. Haz clic en "Reset Token" (o "View Token" si ya existe y lo has guardado antes). Discord te pedirá tu contraseña o código 2FA si lo tienes activado.</p>
        <p>3. Copia el token que aparece. Este es el token que necesitas para Plubot.</p>
        <p><em>Nota: Si reseteas el token, el token anterior dejará de funcionar.</em></p>
      </section>

      <section>
        <h2>Paso 5: Configurar Permisos (Intents)</h2>
        <p>Para que tu bot funcione correctamente, especialmente si va a leer mensajes o interactuar con miembros, necesitarás habilitar "Privileged Gateway Intents":</p>
        <p>1. En la sección "Bot", baja hasta "Privileged Gateway Intents".</p>
        <p>2. Activa las siguientes opciones según necesites (para la mayoría de los usos comunes, estas son recomendables):</p>
        <ul>
          <li><strong>PRESENCE INTENT</strong> (si necesitas saber el estado de los usuarios)</li>
          <li><strong>SERVER MEMBERS INTENT</strong> (si necesitas acceder a la lista de miembros del servidor o eventos de miembros)</li>
          <li><strong>MESSAGE CONTENT INTENT</strong> (CRUCIAL si tu bot necesita leer el contenido de los mensajes. Deberás solicitar aprobación de Discord si tu bot está en más de 100 servidores, pero para uso personal o en pocos servidores, solo necesitas activarlo aquí).</li>
        </ul>
        <p><em>Importante: Si no habilitas "MESSAGE CONTENT INTENT", tu bot no podrá leer los mensajes que no sean menciones directas o comandos de barra (slash commands).</em></p>
      </section>

      <section>
        <h2>Paso 6: Invitar tu Bot a tu Servidor</h2>
        <p>1. En el menú de la izquierda, ve a "OAuth2" y luego a "URL Generator".</p>
        <p>2. En "SCOPES", selecciona "bot". Si tu bot usará comandos de barra (slash commands), también selecciona "applications.commands".</p>
        <p>3. En "BOT PERMISSIONS" que aparece abajo, selecciona los permisos que tu bot necesitará en el servidor (ej. Enviar Mensajes, Leer Historial de Mensajes, Gestionar Roles, etc.). Sé específico para mayor seguridad.</p>
        <p>4. Copia la URL generada que aparece al final de la página.</p>
        <p>5. Pega esta URL en tu navegador, selecciona el servidor al que quieres añadir el bot y autoriza.</p>
      </section>

      <section>
        <h2>Paso 7: Añadir la Integración en Plubot</h2>
        <p>1. Ve a tu Perfil en Plubot, a la sección de "Integraciones".</p>
        <p>2. Haz clic en "Añadir Nueva Integración".</p>
        <p>3. Dale un nombre a tu integración (ej. "Bot Principal de Mi Servidor").</p>
        <p>4. Pega el <strong>token del bot</strong> que copiaste en el Paso 4.</p>
        <p>5. Opcionalmente, puedes añadir el ID del Servidor (Guild ID) y el ID del Canal por Defecto si lo deseas.</p>
        <p>6. Guarda la integración. Plubot intentará verificar el token.</p>
        <p>¡Y eso es todo! Si el estado de la integración cambia a "Activo", está lista para ser usada en tus flujos de Plubot.</p>
      </section>

      <div className="tutorial-footer">
        <p>Si tienes problemas, revisa que el token sea correcto y que el bot tenga los permisos necesarios en tu servidor de Discord.</p>
        <Link to="/profile" className="cyber-link-button tutorial-link-back">Volver a Integraciones</Link>
      </div>
    </div>
  );
};

export default TutorialDiscord;
