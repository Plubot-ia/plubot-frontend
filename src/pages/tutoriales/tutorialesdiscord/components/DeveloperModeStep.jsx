import React from 'react';

const DeveloperModeStep = () => (
  <section>
    <h2>Paso 1: Habilitar el Modo Desarrollador en Discord</h2>
    <p>
      Antes de poder copiar IDs, necesitas activar el &quot;Modo Desarrollador&quot; en tu
      configuración de Discord.
    </p>
    <ul>
      <li>Abre tu aplicación de Discord (de escritorio o web).</li>
      <li>
        Ve a <strong>Ajustes de Usuario</strong> (el ícono de engranaje ⚙️ cerca de tu nombre de
        usuario, usualmente en la parte inferior izquierda).
      </li>
      <li>
        En el menú de la izquierda, bajo &quot;Ajustes de Aplicación&quot;, selecciona{' '}
        <strong>Avanzado</strong>.
      </li>
      <li>
        Activa la opción <strong>Modo de desarrollador</strong>. Debería ponerse de color verde o
        azul.
      </li>
    </ul>
    <p>
      <em>
        Nota: Si no ves la opción &quot;Avanzado&quot; directamente, puede estar dentro de
        &quot;Apariencia&quot; o una sección similar dependiendo de las actualizaciones de Discord.
        Busca &quot;Modo de desarrollador&quot;.
      </em>
    </p>
  </section>
);

export default DeveloperModeStep;
