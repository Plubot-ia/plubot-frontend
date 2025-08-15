/**
 * Plubot Widget Embed Script
 * Version: 1.0.0
 *
 * Este script permite embeber un chatbot Plubot en cualquier sitio web.
 * Simplemente incluye este script con los atributos data-* necesarios.
 */

(function () {
  // Configuración predeterminada
  const DEFAULT_CONFIG = {
    botId: '',
    theme: 'light',
    position: 'right',
    width: '350px',
    height: '500px',
    primaryColor: '#4facfe',
    welcomeMessage: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte?',
    apiUrl: 'https://api.plubot.com',
    autoOpen: false,
    zIndex: 999999,
    iconSize: '50px',
    mobileBreakpoint: '768px',
    loadingMessage: 'Cargando...',
    buttonText: 'Chatear',
    showBranding: true,
    allowAttachments: false,
    allowVoice: false,
    allowFeedback: true,
  };

  // Obtener configuración del script
  const getConfig = () => {
    const script =
      document.getElementById('plubot-script') || document.querySelector('script[data-bot-id]');
    if (!script) {
      console.error('Plubot: No se encontró el script con los atributos necesarios');
      return null;
    }

    const config = { ...DEFAULT_CONFIG };

    // Leer todos los atributos data-*
    for (const attr of script.attributes) {
      if (attr.name.startsWith('data-')) {
        // Convertir data-bot-id a botId
        const key = attr.name
          .replace('data-', '')
          .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        config[key] = attr.value;
      }
    }

    // Validar que exista un ID de bot
    if (!config.botId) {
      console.error('Plubot: Se requiere un ID de bot (data-bot-id)');
      return null;
    }

    return config;
  };

  // Crear estilos CSS
  const createStyles = (config) => {
    const styleEl = document.createElement('style');
    styleEl.id = 'plubot-styles';

    // Colores según el tema
    const colors =
      config.theme === 'dark'
        ? {
            background: '#1f1f1f',
            text: '#ffffff',
            secondaryBackground: '#2d2d2d',
            border: '#444444',
            inputBackground: '#333333',
          }
        : {
            background: '#ffffff',
            text: '#333333',
            secondaryBackground: '#f5f5f5',
            border: '#e0e0e0',
            inputBackground: '#f9f9f9',
          };

    // Aplicar tema automático si está configurado
    const autoThemeCSS =
      config.theme === 'auto'
        ? `
        @media (prefers-color-scheme: dark) {
          .plubot-widget-container {
            --plubot-bg: #1f1f1f;
            --plubot-text: #ffffff;
            --plubot-secondary-bg: #2d2d2d;
            --plubot-border: #444444;
            --plubot-input-bg: #333333;
          }
        }
      `
        : '';

    // Estilos CSS
    styleEl.textContent = `
      :root {
        --plubot-primary: ${config.primaryColor};
        --plubot-bg: ${colors.background};
        --plubot-text: ${colors.text};
        --plubot-secondary-bg: ${colors.secondaryBackground};
        --plubot-border: ${colors.border};
        --plubot-input-bg: ${colors.inputBackground};
      }
      
      ${autoThemeCSS}
      
      .plubot-widget-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        position: fixed;
        z-index: ${config.zIndex};
        bottom: 20px;
        ${config.position === 'right' ? 'right: 20px;' : ''}
        ${config.position === 'left' ? 'left: 20px;' : ''}
        ${config.position === 'center' ? 'left: 50%; transform: translateX(-50%);' : ''}
        display: flex;
        flex-direction: column;
        color: var(--plubot-text);
      }
      
      .plubot-widget-button {
        width: ${config.iconSize};
        height: ${config.iconSize};
        border-radius: 50%;
        background-color: var(--plubot-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        align-self: ${config.position === 'center' ? 'center' : config.position};
        border: none;
        outline: none;
      }
      
      .plubot-widget-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }
      
      .plubot-chat-container {
        position: absolute;
        bottom: calc(${config.iconSize} + 20px);
        ${config.position === 'right' ? 'right: 0;' : ''}
        ${config.position === 'left' ? 'left: 0;' : ''}
        ${config.position === 'center' ? 'left: 50%; transform: translateX(-50%);' : ''}
        width: ${config.width};
        height: ${config.height};
        max-height: 70vh;
        background-color: var(--plubot-bg);
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        pointer-events: none;
        border: 1px solid var(--plubot-border);
      }
      
      .plubot-chat-container.active {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }
      
      .plubot-chat-header {
        padding: 12px 16px;
        background-color: var(--plubot-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .plubot-chat-title {
        font-weight: bold;
        font-size: 16px;
      }
      
      .plubot-close-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        transition: background-color 0.2s;
      }
      
      .plubot-close-button:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .plubot-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .plubot-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
        word-break: break-word;
      }
      
      .plubot-message.bot {
        align-self: flex-start;
        background-color: var(--plubot-secondary-bg);
        border-bottom-left-radius: 4px;
      }
      
      .plubot-message.user {
        align-self: flex-end;
        background-color: var(--plubot-primary);
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .plubot-chat-input {
        padding: 12px;
        border-top: 1px solid var(--plubot-border);
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: var(--plubot-bg);
      }
      
      .plubot-input {
        flex: 1;
        padding: 10px 14px;
        border-radius: 20px;
        border: 1px solid var(--plubot-border);
        outline: none;
        font-size: 14px;
        background-color: var(--plubot-input-bg);
        color: var(--plubot-text);
      }
      
      .plubot-input:focus {
        border-color: var(--plubot-primary);
      }
      
      .plubot-send-button {
        background-color: var(--plubot-primary);
        color: white;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .plubot-send-button:hover {
        background-color: ${adjustColor(config.primaryColor, -20)};
      }
      
      .plubot-loading {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background-color: var(--plubot-secondary-bg);
        border-radius: 12px;
        font-size: 14px;
        align-self: flex-start;
      }
      
      .plubot-typing-indicator {
        display: flex;
        gap: 4px;
      }
      
      .plubot-typing-indicator span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--plubot-primary);
        opacity: 0.6;
        animation: plubot-typing 1.4s infinite ease-in-out;
      }
      
      .plubot-typing-indicator span:nth-child(1) {
        animation-delay: 0s;
      }
      
      .plubot-typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .plubot-typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes plubot-typing {
        0%, 60%, 100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-4px);
        }
      }
      
      .plubot-branding {
        font-size: 11px;
        text-align: center;
        padding: 6px;
        opacity: 0.7;
      }
      
      .plubot-branding a {
        color: var(--plubot-primary);
        text-decoration: none;
      }
      
      @media (max-width: ${config.mobileBreakpoint}) {
        .plubot-chat-container {
          width: calc(100vw - 40px);
          height: 60vh;
          max-height: 500px;
          ${config.position === 'center' ? 'width: 90vw;' : ''}
        }
      }
    `;

    document.head.appendChild(styleEl);
  };

  // Función para ajustar el color (aclarar u oscurecer)
  function adjustColor(color, amount) {
    return (
      '#' +
      color
        .replace(/^#/, '')
        .replace(/../g, (color) =>
          ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2),
        )
    );
  }

  // Crear la estructura HTML del widget
  const createWidgetHTML = (config) => {
    const container = document.createElement('div');
    container.id = 'plubot-widget-container';
    container.className = 'plubot-widget-container';

    // Botón para abrir el chat
    const button = document.createElement('button');
    button.className = 'plubot-widget-button';
    button.setAttribute('aria-label', 'Abrir chat');
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="white"/>
      </svg>
    `;

    // Contenedor del chat
    const chatContainer = document.createElement('div');
    chatContainer.className = 'plubot-chat-container';

    // Cabecera del chat
    const header = document.createElement('div');
    header.className = 'plubot-chat-header';
    header.innerHTML = `
      <div class="plubot-chat-title">Chat con Plubot</div>
      <button class="plubot-close-button" aria-label="Cerrar chat">×</button>
    `;

    // Contenedor de mensajes
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'plubot-chat-messages';

    // Mensaje de bienvenida
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'plubot-message bot';
    welcomeMessage.textContent = config.welcomeMessage;
    messagesContainer.appendChild(welcomeMessage);

    // Sección de entrada de texto
    const inputSection = document.createElement('div');
    inputSection.className = 'plubot-chat-input';
    inputSection.innerHTML = `
      <input type="text" class="plubot-input" placeholder="Escribe un mensaje..." aria-label="Mensaje">
      <button class="plubot-send-button" aria-label="Enviar mensaje">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.01 21L23 12 2.01 3 2 10L17 12 2 14L2.01 21Z" fill="white"/>
        </svg>
      </button>
    `;

    // Branding (opcional)
    let branding = '';
    if (config.showBranding) {
      branding = document.createElement('div');
      branding.className = 'plubot-branding';
      branding.innerHTML =
        'Powered by <a href="https://plubot.com" target="_blank" rel="noopener">Plubot</a>';
    }

    // Ensamblar componentes
    chatContainer.appendChild(header);
    chatContainer.appendChild(messagesContainer);
    chatContainer.appendChild(inputSection);
    if (branding) chatContainer.appendChild(branding);

    container.appendChild(button);
    container.appendChild(chatContainer);

    return container;
  };

  // Agregar funcionalidad al widget
  const initializeWidget = (config) => {
    const container = document.getElementById('plubot-widget-container');
    const button = container.querySelector('.plubot-widget-button');
    const chatContainer = container.querySelector('.plubot-chat-container');
    const closeButton = container.querySelector('.plubot-close-button');
    const input = container.querySelector('.plubot-input');
    const sendButton = container.querySelector('.plubot-send-button');
    const messagesContainer = container.querySelector('.plubot-chat-messages');

    // Estado del chat
    let isOpen = false;
    let isWaitingForResponse = false;

    // Función para abrir/cerrar el chat
    const toggleChat = () => {
      isOpen = !isOpen;
      if (isOpen) {
        chatContainer.classList.add('active');
        input.focus();
      } else {
        chatContainer.classList.remove('active');
      }
    };

    // Evento para el botón principal
    button.addEventListener('click', toggleChat);

    // Evento para el botón de cerrar
    closeButton.addEventListener('click', toggleChat);

    // Función para agregar un mensaje
    const addMessage = (text, isUser = false) => {
      const message = document.createElement('div');
      message.className = `plubot-message ${isUser ? 'user' : 'bot'}`;
      message.textContent = text;
      messagesContainer.appendChild(message);

      // Scroll al último mensaje
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // Función para mostrar indicador de carga
    const showLoading = () => {
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'plubot-loading';
      loadingIndicator.innerHTML = `
        <div class="plubot-typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span>${config.loadingMessage}</span>
      `;
      messagesContainer.appendChild(loadingIndicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      return loadingIndicator;
    };

    // Función para enviar mensaje
    const sendMessage = async () => {
      const text = input.value.trim();
      if (!text || isWaitingForResponse) return;

      // Agregar mensaje del usuario
      addMessage(text, true);
      input.value = '';

      // Mostrar indicador de carga
      isWaitingForResponse = true;
      const loadingIndicator = showLoading();

      try {
        // Llamada a la API
        const response = await fetch(`${config.apiUrl}/chat/${config.botId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: text }),
        });

        if (!response.ok) {
          throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();

        // Eliminar indicador de carga
        messagesContainer.removeChild(loadingIndicator);

        // Agregar respuesta del bot
        addMessage(data.response);
      } catch (error) {
        console.error('Error al enviar mensaje:', error);

        // Eliminar indicador de carga
        messagesContainer.removeChild(loadingIndicator);

        // Mostrar mensaje de error
        addMessage('Lo siento, ha ocurrido un error. Por favor, intenta de nuevo más tarde.');
      } finally {
        isWaitingForResponse = false;
      }
    };

    // Evento para el botón de enviar
    sendButton.addEventListener('click', sendMessage);

    // Evento para enviar con Enter
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // Abrir automáticamente si está configurado
    if (config.autoOpen) {
      setTimeout(() => {
        if (!isOpen) toggleChat();
      }, 1000);
    }
  };

  // Inicializar el widget
  const initWidget = () => {
    // Obtener configuración
    const config = getConfig();
    if (!config) return;

    // Crear estilos
    createStyles(config);

    // Crear HTML
    const widgetHTML = createWidgetHTML(config);
    document.body.appendChild(widgetHTML);

    // Inicializar funcionalidad
    initializeWidget(config);
  };

  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
