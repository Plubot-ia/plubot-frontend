import { motion } from 'framer-motion';
import React, { useState } from 'react';
import {
  FaWhatsapp,
  FaCheckCircle,
  FaRocket,
  FaShieldAlt,
  FaChartLine,
  FaTimes,
  FaClock,
} from 'react-icons/fa';
import './WhatsAppMigrationModal.css';

const WhatsAppMigrationModal = ({ isOpen, onClose, currentUserId }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    phoneNumber: '',
    countryCode: '+1',
    businessType: '',
    estimatedMessages: '1000',
  });

  const benefits = [
    { icon: <FaRocket />, title: 'Sin límites', desc: 'Conecta miles de usuarios simultáneos' },
    { icon: <FaShieldAlt />, title: '100% Estable', desc: 'API oficial de Meta, sin caídas' },
    { icon: <FaCheckCircle />, title: 'Verificación', desc: 'Marca verde de empresa verificada' },
    { icon: <FaClock />, title: '24/7', desc: 'Funcionamiento continuo garantizado' },
  ];

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/whatsapp/business/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          ...formData,
        }),
      });

      if (response.ok) {
        setStep(3); // Success step
      }
    } catch (error) {
      console.error('Error registering for Business API:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='migration-modal-overlay'>
      <motion.div
        className='migration-modal'
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className='migration-modal-header'>
          <div className='migration-modal-title'>
            <FaWhatsapp size={32} style={{ color: '#25d366' }} />
            <span>Migración a WhatsApp Business API</span>
          </div>
          <p className='migration-modal-subtitle'>La solución profesional para tu negocio</p>
          <button className='migration-modal-close' onClick={onClose}>
            <FaTimes size={20} />
          </button>
        </div>

        {step === 1 && (
          <div className='migration-modal-body'>
            <div
              className='demo-warning'
              style={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <FaClock style={{ color: '#ffc107', fontSize: '24px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#ffc107' }}>Modo Demo Actual</strong>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  El QR es solo para pruebas (máx. 20 usuarios). Para producción real, necesitas la
                  API oficial.
                </p>
              </div>
            </div>

            <div className='migration-benefits'>
              <h3 className='migration-section-title'>Beneficios</h3>
              <div className='migration-benefit-item'>
                <FaCheckCircle className='migration-benefit-icon' style={{ color: '#25d366' }} />
                <span>Sin límites de usuarios simultáneos</span>
              </div>
              <div className='migration-benefit-item'>
                <FaRocket className='migration-benefit-icon' style={{ color: '#25d366' }} />
                <span>Conexión más estable</span>
              </div>
              <div className='migration-benefit-item'>
                <FaShieldAlt className='migration-benefit-icon' style={{ color: '#25d366' }} />
                <span>100% Estable</span>
              </div>
              <div className='migration-benefit-item'>
                <FaChartLine className='migration-benefit-icon' style={{ color: '#25d366' }} />
                <span>24h oficial de Meta, sin caídas</span>
              </div>
            </div>

            <div className='migration-features'>
              <h3 className='migration-section-title'>Características</h3>
              <div className='migration-feature-list'>
                <div className='migration-feature-item'>
                  <strong>✓ Verificación:</strong> Marca verde de empresa verificada
                </div>
                <div className='migration-feature-item'>
                  <strong>✓ 24/7:</strong> Funcionamiento continuo garantizado
                </div>
                <div className='migration-feature-item'>
                  <strong>✓ Simple y Transparente:</strong> Configuración fácil
                </div>
              </div>
            </div>

            <div className='pricing-info'>
              <h3>Simple y Transparente</h3>
              <div className='migration-setup-list'>
                <div className='migration-setup-item'>✓ Setup automático en 24-48 horas</div>
                <div className='migration-setup-item'>
                  ✓ Sin necesidad de conocimientos técnicos
                </div>
                <div className='migration-setup-item'>✓ Soporte completo incluido</div>
                <div className='migration-setup-item'>✓ Paga solo por mensajes enviados</div>
              </div>
            </div>

            <div className='migration-modal-footer'>
              <button className='migration-cta-button' onClick={() => setStep(2)}>
                Comenzar Migración →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className='step-content'>
            <h2>Información Básica</h2>
            <p className='form-subtitle'>Nosotros nos encargamos de todo el proceso con Meta</p>

            <form className='migration-form'>
              <div className='form-group'>
                <label>Nombre de tu Negocio</label>
                <input
                  type='text'
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder='Mi Empresa'
                />
              </div>

              <div className='form-row'>
                <div className='form-group' style={{ flex: '0 0 120px' }}>
                  <label>Código País</label>
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  >
                    <option value='+1'>+1 USA</option>
                    <option value='+52'>+52 MX</option>
                    <option value='+34'>+34 ES</option>
                    <option value='+54'>+54 AR</option>
                    <option value='+57'>+57 CO</option>
                    <option value='+56'>+56 CL</option>
                    <option value='+51'>+51 PE</option>
                  </select>
                </div>
                <div className='form-group' style={{ flex: 1 }}>
                  <label>Número de WhatsApp Business</label>
                  <input
                    type='tel'
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder='123456789'
                  />
                </div>
              </div>

              <div className='form-group'>
                <label>Tipo de Negocio</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                >
                  <option value=''>Selecciona...</option>
                  <option value='retail'>Comercio/Retail</option>
                  <option value='services'>Servicios</option>
                  <option value='education'>Educación</option>
                  <option value='health'>Salud</option>
                  <option value='tech'>Tecnología</option>
                  <option value='other'>Otro</option>
                </select>
              </div>

              <div className='form-group'>
                <label>Mensajes estimados por mes</label>
                <select
                  value={formData.estimatedMessages}
                  onChange={(e) => setFormData({ ...formData, estimatedMessages: e.target.value })}
                >
                  <option value='1000'>Hasta 1,000</option>
                  <option value='10000'>1,000 - 10,000</option>
                  <option value='50000'>10,000 - 50,000</option>
                  <option value='100000'>50,000 - 100,000</option>
                  <option value='more'>Más de 100,000</option>
                </select>
              </div>

              <div className='info-box'>
                <strong>🔒 Proceso 100% Seguro</strong>
                <p>
                  Gestionamos todo con Meta. Recibirás un email con los siguientes pasos en 24
                  horas.
                </p>
              </div>

              <div className='button-group'>
                <button type='button' className='secondary-btn' onClick={() => setStep(1)}>
                  ← Atrás
                </button>
                <button
                  type='button'
                  className='cta-button'
                  onClick={handleSubmit}
                  disabled={!formData.businessName || !formData.phoneNumber}
                >
                  Solicitar API Oficial
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <motion.div
            className='step-content success-step'
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <FaCheckCircle className='success-icon' />
            <h2>¡Solicitud Enviada!</h2>
            <p>Hemos recibido tu solicitud para WhatsApp Business API</p>

            <div className='next-steps'>
              <h3>Próximos pasos:</h3>
              <ol>
                <li>📧 Recibirás un email de confirmación en minutos</li>
                <li>📝 Nuestro equipo preparará tu cuenta con Meta</li>
                <li>✅ En 24-48h tendrás tu API funcionando</li>
                <li>🚀 Te ayudaremos con la migración completa</li>
              </ol>
            </div>

            <button className='cta-button' onClick={onClose}>
              Entendido
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default WhatsAppMigrationModal;
