import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import XPTracker from '@components/common/XPTracker';
import useReadingXP from '@hooks/useReadingXP';

import logger from '../../services/loggerService';

import './Blog.css';

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const xp = useReadingXP(slug);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const staticPosts = {
          'whatsapp-ventas': {
            title:
              '5 Formas de Usar WhatsApp para Aumentar tus Ventas: ' +
              'Convierte Conversaciones en Oportunidades',
            excerpt:
              'Explora 5 estrategias clave para potenciar tus ventas en WhatsApp ' +
              'con un chatbot, convirtiendo chats en ' +
              'oportunidades con Plubot.',
            content: `
              <h2>Introducción</h2>
              <p>
                WhatsApp es una herramienta poderosa para ventas. Con un chatbot de IA de
                <a href="/">Plubot</a>, puedes automatizar conversaciones y cerrar más ventas.
                Aquí te mostramos 5 formas de lograrlo.
              </p>
              <h2>1. Calificación de Leads Automatizada</h2>
              <p>
                Un chatbot puede hacer preguntas clave para calificar leads, asegurando que tu
                equipo de ventas solo hable con los prospectos más prometedores.
              </p>
              <p>Plubot te ayuda a filtrar y priorizar leads sin esfuerzo.</p>
              <div data-percent="50" class="xp-checkpoint"></div>
              <h2>2. Catálogo de Productos Interactivo</h2>
              <p>
                Muestra tus productos directamente en WhatsApp. Un chatbot puede guiar a los
                clientes a través de tu catálogo y responder sus dudas.
              </p>
              <p>Con Plubot, tu catálogo cobra vida en el chat.</p>
              <h2>3. Recuperación de Carritos Abandonados</h2>
              <p>
                Envía recordatorios automáticos a los clientes que dejaron productos en su
                carrito, aumentando las conversiones.
              </p>
              <h2>4. Soporte Postventa Inmediato</h2>
              <p>
                Ofrece respuestas rápidas a preguntas sobre envíos, devoluciones o uso del
                producto, mejorando la satisfacción del cliente.
              </p>
              <h2>5. Ofertas y Promociones Personalizadas</h2>
              <p>
                Envía ofertas exclusivas a tus clientes basadas en su historial de compras,
                fomentando la lealtad y las ventas recurrentes.
              </p>
              <div data-percent="100" class="xp-checkpoint"></div>
              <h2>Conclusión</h2>
              <p>
                WhatsApp, combinado con la IA de Plubot, es una máquina de ventas. ¿Listo para
                potenciar tu negocio? <a href="/contacto">Habla con nosotros</a>.
              </p>
            `,
          },
          'automatizacion-emprendedores': {
            title:
              'Automatización para Emprendedores: Cómo Ahorrar Tiempo y ' +
              'Escalar tu Negocio',
            excerpt:
              'Consejos clave para emprendedores que buscan optimizar su rutina ' +
              'diaria con la ayuda de la ' +
              'inteligencia artificial.',
            content: `
              <h2>Introducción</h2>
              <p>
                Como emprendedor, tu tiempo es oro. La automatización con IA te permite delegar
                tareas repetitivas para que puedas enfocarte en lo que realmente importa: hacer
                crecer tu negocio. Con <a href="/">Plubot</a>, la automatización es más fácil
                que nunca.
              </p>
              <h2>1. Gestiona tus Redes Sociales</h2>
              <p>
                Programa publicaciones y responde comentarios automáticamente, manteniendo una
                presencia activa en redes sin esfuerzo.
              </p>
              <p>Plubot puede ser tu community manager 24/7.</p>
              <div data-percent="50" class="xp-checkpoint"></div>
              <h2>2. Automatiza el Email Marketing</h2>
              <p>
                Crea secuencias de correos para nutrir leads y fidelizar clientes, todo de
                forma automática.
              </p>
              <p>Con Plubot, tus campañas de email funcionan mientras duermes.</p>
              <h2>3. Organiza tu Agenda</h2>
              <p>
                Un chatbot puede agendar reuniones, enviar recordatorios y gestionar tu
                calendario, evitando conflictos de horarios.
              </p>
              <h2>4. Centraliza la Atención al Cliente</h2>
              <p>
                Ofrece respuestas instantáneas a preguntas frecuentes a través de un chatbot,
                mejorando la experiencia de tus clientes.
              </p>
              <h2>5. Analiza Datos para Decisiones Estratégicas</h2>
              <p>
                Usa IA para obtener insights de tus datos de ventas y clientes, ayudándote a
                tomar decisiones informadas rápidamente.
              </p>
              <div data-percent="100" class="xp-checkpoint"></div>
              <h2>Conclusión</h2>
              <p>
                La automatización con IA transforma la forma en que los emprendedores trabajan.
                Con Plubot, ahorras tiempo, reduces costos y escalas tu negocio. ¿Listo para
                optimizar? <a href="/contacto">Contáctanos ahora</a>.
              </p>
            `,
          },
          'futuro-atencion-cliente': {
            title:
              'El Futuro de la Atención al Cliente: Cómo la IA y los Chatbots ' +
              'Están Revolucionando el Servicio',
            excerpt:
              'Descubre cómo la IA y los chatbots están redefiniendo la atención ' +
              'al cliente, ofreciendo experiencias ' +
              'personalizadas y eficientes.',
            content: `
              <h2>Introducción</h2>
              <p>
                La atención al cliente está evolucionando rápidamente gracias a la inteligencia
                artificial. Los chatbots impulsados por IA están transformando la forma en que
                las empresas interactúan con sus clientes. Descubre 5 formas en que
                <a href="/">Plubot</a> está liderando esta revolución.
              </p>
              <h2>1. Respuestas Instantáneas 24/7</h2>
              <p>
                Los clientes esperan respuestas rápidas a cualquier hora. Un chatbot de IA
                proporciona soporte inmediato, mejorando la satisfacción del cliente.
              </p>
              <p>Plubot crea chatbots que responden en tiempo real, sin importar la hora.</p>
              <div data-percent="50" class="xp-checkpoint"></div>
              <h2>2. Personalización a Escala</h2>
              <p>
                La IA analiza el comportamiento del cliente para ofrecer respuestas y
                recomendaciones personalizadas, creando experiencias únicas.
              </p>
              <p>Con Plubot, cada interacción se siente tailor-made.</p>
              <h2>3. Reducción de Costos Operativos</h2>
              <p>
                Automatizar la atención al cliente reduce la necesidad de grandes equipos de
                soporte, ahorrando recursos sin sacrificar calidad.
              </p>
              <p>Plubot optimiza tus operaciones con chatbots eficientes.</p>
              <h2>4. Integración con Múltiples Canales</h2>
              <p>
                Los chatbots de IA se integran con WhatsApp, redes sociales y sitios web,
                ofreciendo una experiencia unificada.
              </p>
              <h2>5. Análisis Predictivo para Anticipar Necesidades</h2>
              <p>
                La IA predice las necesidades de los clientes basándose en datos, permitiendo
                respuestas proactivas que mejoran la lealtad.
              </p>
              <div data-percent="100" class="xp-checkpoint"></div>
              <h2>Conclusión</h2>
              <p>
                El futuro de la atención al cliente es impulsado por la IA. Con Plubot, puedes
                ofrecer un servicio rápido, personalizado y eficiente. ¿Quieres transformar tu
                soporte? <a href="/contacto">Contáctanos hoy</a>.
              </p>
            `,
          },
          'transformar-negocio-chatbots': {
            title:
              'Cómo la IA Puede Transformar tu Negocio con Chatbots: 5 Beneficios Clave',
            excerpt:
              'Descubre cómo los chatbots de IA creados con Plubot pueden ' +
              'optimizar tu negocio, desde atender clientes hasta ' +
              'captar oportunidades.',
            content: `
              <h2>Introducción</h2>
              <p>
                Los chatbots de IA están revolucionando los negocios al automatizar procesos y
                mejorar la experiencia del cliente. Con <a href="/">Plubot</a>, puedes
                aprovechar estos beneficios para transformar tu empresa. Aquí tienes 5
                beneficios clave.
              </p>
              <h2>1. Atención al Cliente 24/7</h2>
              <p>
                Un chatbot de IA ofrece soporte continuo, respondiendo preguntas y resolviendo
                problemas en cualquier momento.
              </p>
              <p>Plubot asegura que tus clientes nunca queden sin respuesta.</p>
              <div data-percent="50" class="xp-checkpoint"></div>
              <h2>2. Generación de Leads Automatizada</h2>
              <p>
                Los chatbots capturan leads al interactuar con visitantes, calificándolos y
                guiándolos hacia una conversión.
              </p>
              <p>Con Plubot, conviertes visitantes en clientes potenciales sin esfuerzo.</p>
              <h2>3. Personalización a Escala</h2>
              <p>
                La IA adapta las interacciones según los datos del cliente, ofreciendo
                experiencias personalizadas a gran escala.
              </p>
              <p>Plubot hace que cada cliente se sienta especial.</p>
              <h2>4. Ahorro de Recursos</h2>
              <p>
                Automatizar tareas repetitivas reduce los costos operativos y libera a tu
                equipo para tareas estratégicas.
              </p>
              <h2>5. Escalabilidad para tu Negocio</h2>
              <p>
                Los chatbots crecen con tu negocio, manejando miles de interacciones sin
                perder eficiencia.
              </p>
              <div data-percent="100" class="xp-checkpoint"></div>
              <h2>Conclusión</h2>
              <p>
                Los chatbots de IA son una herramienta poderosa para transformar tu negocio.
                Con Plubot, puedes implementar soluciones que mejoran la eficiencia y la
                experiencia del cliente. ¿Listo para empezar?
                <a href="/contacto">Contáctanos ahora</a>.
              </p>
            `,
          },
          'eficiencia-negocio-plubot': {
            title:
              'Automatización con IA: 5 Formas de Hacer tu Negocio Más Eficiente con Plubot',
            excerpt:
              'Explora 5 formas en que la IA y los chatbots de Plubot ' +
              'optimizan la eficiencia de tu negocio.',
            content: `
              <h2>Introducción</h2>
              <p>
                La eficiencia es clave para el éxito empresarial. La inteligencia artificial y
                los chatbots de <a href="/">Plubot</a> te ayudan a optimizar procesos y
                maximizar resultados. Descubre 5 formas de mejorar tu negocio.
              </p>
              <h2>1. Resolución Rápida de Consultas</h2>
              <p>
                Un chatbot de IA responde preguntas comunes al instante, reduciendo el tiempo
                de espera para los clientes.
              </p>
              <p>Plubot asegura respuestas rápidas y precisas en todo momento.</p>
              <div data-percent="50" class="xp-checkpoint"></div>
              <h2>2. Automatización de Tareas Repetitivas</h2>
              <p>
                Desde agendar citas hasta enviar recordatorios, los chatbots automatizan
                tareas que consumen tiempo.
              </p>
              <p>Con Plubot, liberas a tu equipo para tareas más estratégicas.</p>
              <h2>3. Mejora en la Gestión de Clientes</h2>
              <p>
                La IA organiza datos de clientes y ofrece insights para mejorar las
                interacciones y aumentar la retención.
              </p>
              <p>Plubot centraliza la gestión de clientes para mayor eficiencia.</p>
              <h2>4. Soporte Multicanal</h2>
              <p>
                Los chatbots se integran con WhatsApp, redes sociales y tu sitio web,
                ofreciendo soporte coherente en todos los canales.
              </p>
              <h2>5. Insights para Toma de Decisiones</h2>
              <p>
                La IA analiza datos de interacciones para proporcionarte informes que guían
                tus decisiones estratégicas.
              </p>
              <div data-percent="100" class="xp-checkpoint"></div>
              <h2>Conclusión</h2>
              <p>
                La automatización con IA impulsa la eficiencia de tu negocio. Con Plubot,
                puedes optimizar procesos y enfocarte en el crecimiento. ¿Listo para
                transformar tu negocio? <a href="/contacto">Contáctanos hoy</a>.
              </p>
            `,
          },
        };

        // eslint-disable-next-line security/detect-object-injection -- Falso positivo: slug seguro.
        const selectedPost = staticPosts[slug];
        if (selectedPost) {
          setPost(selectedPost);
        }
      } catch (error) {
        logger.error('Error al cargar la publicación del blog:', error);
      }
    };
    fetchPost();
  }, [slug]);

  if (!post) return <div>Cargando...</div>;

  return (
    <section className='blog-post-detail'>
      <div className='blog-container'>
        <h1>{post.title}</h1>
        <p>
          <em>{post.excerpt}</em>
        </p>
        <hr />
        {/* eslint-disable-next-line react/no-danger -- Justificación: HTML estático y seguro. */}
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
      <XPTracker xpGained={xp.xpGained} level={xp.level} />
    </section>
  );
};

export default BlogPost;
