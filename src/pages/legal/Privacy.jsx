import PropTypes from 'prop-types';
import './Privacy.css';

const PolicySection = ({ title, children }) => (
  <>
    <h2 className='privacy-subtitle'>{title}</h2>
    <div>{children}</div>
  </>
);

PolicySection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

// Constantes para secciones de política - extraídas para reducir líneas en componente principal
const POLICY_SECTIONS = [
  {
    title: '1. Información que Recopilamos',
    content: (
      <p>
        Recopilamos datos que nos proporcionas directamente, como nombre, correo electrónico y
        mensajes enviados a través de formularios de contacto o suscripción. También recopilamos
        información automáticamente, como tu dirección IP, tipo de navegador y datos de navegación,
        para mejorar tu experiencia en Plubot Web.
      </p>
    ),
  },
  {
    title: '2. Uso de la Información',
    content: (
      <>
        <p>Utilizamos tus datos para:</p>
        <ul>
          <li>Responder a tus consultas y solicitudes.</li>
          <li>Enviar boletines y actualizaciones (si te has suscrito).</li>
          <li>Personalizar y optimizar nuestros servicios en el Pluniverso.</li>
          <li>Analizar el uso del sitio para mejorar su funcionalidad.</li>
        </ul>
      </>
    ),
  },
  {
    title: '3. Cookies y Tecnologías Similares',
    content: (
      <p>
        Usamos cookies y tecnologías similares para recordar tus preferencias, analizar el tráfico y
        ofrecer una experiencia más personalizada. Puedes gestionar las cookies a través de la
        configuración de tu navegador, pero desactivarlas podría afectar algunas funcionalidades de
        Plubot Web.
      </p>
    ),
  },
  {
    title: '4. Seguridad',
    content: (
      <p>
        Implementamos medidas de seguridad avanzadas, como cifrado SSL y protocolos de protección de
        datos, para salvaguardar tu información personal contra accesos no autorizados, pérdida o
        alteración. Sin embargo, ningún sistema es completamente infalible, y no podemos garantizar
        la seguridad absoluta.
      </p>
    ),
  },
  {
    title: '5. Compartir Información',
    content: (
      <p>
        No vendemos ni compartimos tu información personal con terceros, excepto cuando sea
        necesario para cumplir con obligaciones legales, proteger nuestros derechos, o trabajar con
        proveedores de servicios (como procesadores de pagos) que cumplen con estándares de
        privacidad.
      </p>
    ),
  },
  {
    title: '6. Derechos del Usuario',
    content: (
      <p>
        Tienes derecho a acceder, corregir, eliminar o restringir el uso de tus datos personales.
        También puedes optar por no recibir nuestros boletines en cualquier momento. Para ejercer
        estos derechos, contáctanos a través de nuestro formulario.
      </p>
    ),
  },
  {
    title: '7. Transferencias Internacionales',
    content: (
      <p>
        Si accedes a Plubot Web desde fuera de nuestra jurisdicción principal, tu información podría
        ser transferida a servidores en otros países. Nos aseguramos de que estas transferencias
        cumplan con las leyes de protección de datos aplicables.
      </p>
    ),
  },
  {
    title: '8. Cambios a la Política de Privacidad',
    content: (
      <p>
        Podemos actualizar esta Política de Privacidad para reflejar cambios en nuestras prácticas o
        en la legislación. Te notificaremos sobre cambios significativos a través de un aviso en
        nuestro sitio web o por correo electrónico.
      </p>
    ),
  },
];

const PrivacyContent = () => (
  <>
    <h1 className='privacy-title'>Política de Privacidad de Plubot</h1>
    <p className='privacy-intro'>
      En Plubot, tu privacidad es una prioridad en el Pluniverso. Nos comprometemos a proteger tu
      información personal con las mejores prácticas de seguridad y transparencia. A continuación,
      te explicamos cómo recopilamos, usamos y protegemos tus datos.
    </p>

    {POLICY_SECTIONS.map((section) => (
      <PolicySection key={section.title} title={section.title}>
        {section.content}
      </PolicySection>
    ))}

    <p className='privacy-contact'>
      Para más detalles o para ejercer tus derechos de privacidad, contáctanos en{' '}
      <a href='/contact'>nuestro formulario</a>.
    </p>
  </>
);

const Privacy = () => {
  return (
    <section className='privacy-section'>
      <div className='privacy-container'>
        <PrivacyContent />
      </div>
    </section>
  );
};

export default Privacy;
