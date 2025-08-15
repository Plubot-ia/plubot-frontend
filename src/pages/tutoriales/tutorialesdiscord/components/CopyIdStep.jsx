import React from 'react';

const CopyIdStep = () => (
  <section>
    <h2>Paso 2: Copiar el ID del Canal</h2>
    <p>Una vez que el Modo Desarrollador está activado:</p>
    <ul>
      <li>Navega al servidor y al canal específico del cual quieres obtener el ID.</li>
      <li>
        Haz <strong>clic derecho</strong> sobre el nombre del canal en la lista de canales (a la
        izquierda).
      </li>
      <li>
        En el menú contextual que aparece, deberías ver la opción{' '}
        <strong>&quot;Copiar ID&quot;</strong>. Haz clic en ella.
      </li>
    </ul>
    <p>
      ¡Listo! El ID del canal se ha copiado a tu portapapeles. Ahora puedes pegarlo donde lo
      necesites en Plubot.
    </p>
    <p>
      <strong>Ejemplo de un ID de Canal:</strong> <code>123456789012345678</code> (será una larga
      secuencia de números).
    </p>
  </section>
);

export default CopyIdStep;
