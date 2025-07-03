import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

// Configuración avanzada y profesional para i18next
// - Detección automática de idioma
// - Fallback robusto
// - Pluralización y formatos
// - Extensible a namespaces y backends externos

i18n
  .use(HttpBackend) // Carga traducciones desde un servidor
  .use(initReactI18next) // Pasa la instancia de i18n a react-i18next
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Ruta a los archivos de traducción
    },
    lng: 'es', // Idioma por defecto
    fallbackLng: ['es', 'en'], // Fallback robusto
    supportedLngs: ['es', 'en'],
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // React ya se encarga del escape
      format: (value, format, lng) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        return value;
      },
    },
    pluralSeparator: '_',
    ns: ['translation'], // Namespace por defecto
    defaultNS: 'translation',
    react: {
      useSuspense: true, // Permite loading boundaries
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`Clave de traducción faltante: [${lng}] ${ns}:${key}`);
      }
      return fallbackValue;
    },
  });

export { default } from 'i18next';
