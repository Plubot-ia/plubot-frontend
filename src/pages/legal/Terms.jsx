import './Terms.css';

const Terms = () => {
  return (
    <section className='terms-section'>
      <div className='terms-container'>
        <h1 className='terms-title'>Términos y Condiciones de Plubot</h1>
        <p className='terms-intro'>
          Bienvenido(a) al Pluniverso. Al usar los servicios de Plubot Web, aceptas los siguientes
          términos y condiciones que rigen tu interacción con nuestra plataforma. Te recomendamos
          leerlos cuidadosamente.
        </p>

        <h2 className='terms-subtitle'>1. Aceptación de los Términos</h2>
        <p>
          Al registrarte, acceder o utilizar Plubot Web, aceptas estar legalmente vinculado(a) a
          estos Términos y Condiciones, así como a nuestra{' '}
          <a href='/privacy'>Política de Privacidad</a>. Si no estás de acuerdo con alguna parte de
          estos términos, por favor, no uses nuestros servicios.
        </p>

        <h2 className='terms-subtitle'>2. Uso del Servicio</h2>
        <p>
          Plubot Web está diseñado para ayudarte a automatizar procesos de negocio mediante
          inteligencia artificial y herramientas avanzadas dentro del Pluniverso. Te comprometes a
          usar nuestros servicios únicamente para fines legítimos y legales. Queda estrictamente
          prohibido utilizar nuestros bots o servicios para actividades ilegales, fraudulentas o que
          infrinjan los derechos de terceros.
        </p>

        <h2 className='terms-subtitle'>3. Propiedad Intelectual</h2>
        <p>
          Todo el contenido, diseño, código, gráficos y tecnología de Plubot Web, incluidas las
          narrativas del Pluniverso y el Santuario del Fundador, son propiedad intelectual de
          Plubot. No puedes copiar, modificar, distribuir ni reproducir nuestro contenido sin
          autorización expresa por escrito.
        </p>

        <h2 className='terms-subtitle'>4. Pagos y Suscripciones</h2>
        <p>
          Algunos servicios de Plubot pueden requerir pagos o suscripciones. Al realizar un pago,
          aceptas proporcionar información de pago precisa y autorizas a Plubot a realizar los
          cargos correspondientes. Las suscripciones se renovarán automáticamente a menos que las
          canceles antes de la fecha de renovación.
        </p>

        <h2 className='terms-subtitle'>5. Limitación de Responsabilidad</h2>
        <p>
          Plubot no será responsable por interrupciones del servicio, pérdida de datos, ni daños
          indirectos, incidentales o consecuentes derivados del uso de nuestra plataforma. Usas
          Plubot Web bajo tu propio riesgo, y nuestro servicio se proporciona &quot;tal cual&quot;
          sin garantías implícitas.
        </p>

        <h2 className='terms-subtitle'>6. Terminación del Servicio</h2>
        <p>
          Nos reservamos el derecho de suspender o terminar tu acceso a Plubot Web en caso de
          incumplimiento de estos términos, actividades sospechosas, o por cualquier otra razón a
          nuestra discreción. En caso de terminación, no se emitirán reembolsos por suscripciones
          activas.
        </p>

        <h2 className='terms-subtitle'>7. Ley Aplicable</h2>
        <p>
          Estos términos se rigen por las leyes del país donde Plubot tiene su sede principal.
          Cualquier disputa será resuelta en los tribunales competentes de dicha jurisdicción.
        </p>

        <h2 className='terms-subtitle'>8. Cambios a los Términos</h2>
        <p>
          Podemos actualizar estos Términos y Condiciones periódicamente para reflejar cambios en
          nuestros servicios o en la legislación. Te notificaremos sobre cambios significativos a
          través de un aviso en nuestro sitio web o por correo electrónico.
        </p>

        <p className='terms-contact'>
          Si tienes preguntas sobre estos términos, contáctanos a través de{' '}
          <a href='/contact'>nuestro formulario</a>.
        </p>
      </div>
    </section>
  );
};

export default Terms;
