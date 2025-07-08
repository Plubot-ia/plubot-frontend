import { FaWhatsapp } from 'react-icons/fa';
import './WhatsAppButton.css';

const WhatsAppButton = () => (
  <div className='whatsapp-btn-wrapper'>
    <a
      href='https://wa.me/+19142782514?text=Hola,%20quiero%20hablar%20con%20Plubot'
      className='whatsapp-btn'
      target='_blank'
      rel='noopener noreferrer'
      aria-label='Contactar por WhatsApp'
    >
      <FaWhatsapp />
      <span className='whatsapp-tooltip'>Chatea con Nosotros</span>
    </a>
  </div>
);

export default WhatsAppButton;
